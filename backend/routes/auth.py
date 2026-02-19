from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer
from backend.models import UserCreate, UserLogin, Token, UserResponse, GoogleLogin, OTPVerify, PasswordResetRequest, PasswordResetConfirm
from backend.database import get_collection
from backend.auth import get_safe_password_hash, verify_password, create_access_token, verify_google_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from backend.email_service import EmailService
from jose import JWTError, jwt
from datetime import timedelta, datetime, timezone
from bson import ObjectId
import random
import string
from backend.limiter import limiter

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def signup(request: Request, user: UserCreate, background_tasks: BackgroundTasks):
    users_collection = get_collection("users")
    
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate OTP
    otp = generate_otp()
    
    # Create new user
    user_dict = user.dict()
    user_dict["password_hash"] = get_safe_password_hash(user.password)
    del user_dict["password"]
    user_dict["created_at"] = datetime.now(timezone.utc)
    user_dict["is_verified"] = False
    user_dict["otp_secret"] = otp
    user_dict["otp_created_at"] = datetime.now(timezone.utc)
    
    result = await users_collection.insert_one(user_dict)
    
    # Send Email in Background
    background_tasks.add_task(EmailService.send_otp_email, user.email, otp)
    
    # Return created user
    return UserResponse(
        id=str(result.inserted_id),
        email=user.email,
        full_name=user.full_name,
        created_at=user_dict["created_at"]
    )

@router.post("/verify-email", response_model=Token)
@limiter.limit("10/minute")
async def verify_email(request: Request, data: OTPVerify):
    users_collection = get_collection("users")
    user = await users_collection.find_one({"email": data.email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("is_verified"):
        raise HTTPException(status_code=400, detail="Email already verified")
        
    if not user.get("otp_secret") or user.get("otp_secret") != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # Mark as verified
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "otp_secret": None}}
    )
    
    # Process workspace invitations
    invitations_collection = get_collection("invitations")
    await invitations_collection.update_many(
        {"email": data.email, "status": "pending"},
        {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc)}}
    )

    # Broadcast new member joined event
    from backend.websocket_manager import manager
    import json
    join_msg = json.dumps({
        "type": "team:member_joined",
        "data": {
            "id": str(user["_id"]),
            "full_name": user.get("full_name"),
            "email": user["email"]
        }
    })
    for uid in manager.user_sessions:
        await manager.notify_user(uid, join_msg)
    
    # Generate Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"]), "email": user["email"]}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/resend-otp")
@limiter.limit("3/minute")
async def resend_otp(request: Request, data: OTPVerify, background_tasks: BackgroundTasks):
    users_collection = get_collection("users")
    user = await users_collection.find_one({"email": data.email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("is_verified"):
         return {"message": "Already verified"}
         
    otp = generate_otp()
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"otp_secret": otp, "otp_created_at": datetime.now(timezone.utc)}}
    )
    
    background_tasks.add_task(EmailService.send_otp_email, user.email, otp)
    return {"message": "OTP resent"}

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, user_credentials: UserLogin):
    users_collection = get_collection("users")
    
    # Find user
    user = await users_collection.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.get("is_verified", False):
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your account.",
        )
    
    # Generate Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"]), "email": user["email"]}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    users_collection = get_collection("users")
    user = await users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
        
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name") or user["email"].split("@")[0],
        avatar=user.get("avatar_url") or user.get("avatar"),
        status=user.get("status", "available"),
        status_message=user.get("status_message"),
        role=user.get("role"),
        department=user.get("department"),
        phone=user.get("phone"),
        created_at=user.get("created_at"),
        preferences=user.get("preferences") or {}
    )

async def get_optional_user(token: str = Depends(oauth2_scheme)) -> UserResponse | None:
    try:
        return await get_current_user(token)
    except HTTPException:
        return None

@router.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.post("/google", response_model=Token)
async def google_login(login: GoogleLogin):
    # Verify Firebase Token
    decoded_token = verify_google_token(login.token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google Token"
        )
    
    email = decoded_token.get("email")
    name = decoded_token.get("name") or email.split("@")[0]
    
    users_collection = get_collection("users")
    user = await users_collection.find_one({"email": email})
    
    if not user:
        # Create new user from Google Data
        new_user = {
            "email": email,
            "full_name": name,
            "password_hash": None, # No password for social login
            "created_at": datetime.now(timezone.utc),
            "provider": "google",
            "avatar_url": decoded_token.get("picture"),
            "is_verified": True # Social login is auto-verified
        }
        result = await users_collection.insert_one(new_user)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
        
    # Generate Our App Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id, "email": email}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, reset_request: PasswordResetRequest, background_tasks: BackgroundTasks):
    users_collection = get_collection("users")
    user = await users_collection.find_one({"email": reset_request.email})
    
    if not user:
        # Avoid user enumeration - pretend we sent it
        return {"message": "If email exists, OTP sent"}
        
    otp = generate_otp()
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_otp": otp, "reset_otp_created_at": datetime.now(timezone.utc)}}
    )
    
    background_tasks.add_task(EmailService.send_reset_email, reset_request.email, otp)
    return {"message": "OTP sent"}

@router.post("/verify-reset-otp")
@limiter.limit("5/minute")
async def verify_reset_otp(request: Request, data: OTPVerify):
    users_collection = get_collection("users")
    user = await users_collection.find_one({"email": data.email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.get("reset_otp") or user.get("reset_otp") != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # Generate temporary reset token (valid for 5 mins)
    reset_token = create_access_token(
        data={"sub": str(user["_id"]), "type": "reset"},
        expires_delta=timedelta(minutes=5)
    )
    
    # Clear OTP so it can't be reused immediately (optional, or wait for final reset)
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_otp": None}} 
    )
    
    return {"token": reset_token}

@router.post("/reset-password")
@limiter.limit("3/minute")
async def reset_password(request: Request, data: PasswordResetConfirm):
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
        user_id = payload.get("sub")
    except JWTError:
         raise HTTPException(status_code=400, detail="Invalid or expired token")
         
    users_collection = get_collection("users")
    
    # Hash new password
    new_hash = get_safe_password_hash(data.new_password)
    
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Password updated successfully"}
