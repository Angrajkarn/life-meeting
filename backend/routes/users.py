from fastapi import APIRouter, Depends, HTTPException, status, Request
from backend.routes.auth import get_current_user
from backend.models import UserResponse, UserStats, ActivityLog, UserPreferences
from backend.websocket_manager import manager
import json
from backend.database import get_collection
from backend.limiter import limiter
from datetime import datetime, timedelta, timezone
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
@limiter.limit("20/minute")
async def list_all_users(request: Request, current_user: UserResponse = Depends(get_current_user)):
    users_collection = get_collection("users")
    # Fetch officially verified members except the current one
    cursor = users_collection.find({
        "_id": {"$ne": ObjectId(current_user.id)},
        "is_verified": True
    }).limit(100)
    
    users = []
    async for doc in cursor:
        user_data = {
            "id": str(doc["_id"]),
            "email": doc.get("email"),
            "full_name": doc.get("full_name", "Unknown User"),
            "role": doc.get("role"),
            "department": doc.get("department"),
            "phone": doc.get("phone"),
            "created_at": doc.get("created_at")
        }
        # Only add if email exists (basic validation)
        if user_data["email"]:
            users.append(UserResponse(**user_data))
    return users

@router.get("/me", response_model=UserResponse)
@limiter.limit("60/minute")
async def read_users_me(request: Request, current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.get("/me/stats", response_model=UserStats)
@limiter.limit("20/minute")
async def get_user_stats(request: Request, current_user: UserResponse = Depends(get_current_user)):
    meetings_collection = get_collection("meetings")
    
    # Calculate meetings today
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    meetings_today = await meetings_collection.count_documents({
        "host_id": str(current_user.id),
        "start_time": {"$gte": start_of_day, "$lt": end_of_day}
    })
    
    # Calculate upcoming meetings
    upcoming_count = await meetings_collection.count_documents({
        "host_id": str(current_user.id),
        "start_time": {"$gte": now}
    })
    
    # Mock "Hours Saved" calculation based on total meetings
    # In a real app, this would be computed from transcript analysis or automation logs
    total_meetings = await meetings_collection.count_documents({"host_id": str(current_user.id)})
    hours_saved = total_meetings * 0.5  # Assume 30 mins saved per meeting via AI capabilities
    
    return UserStats(
        meetings_today=meetings_today,
        hours_saved=hours_saved,
        upcoming_count=upcoming_count
    )

@router.put("/me/presence")
@limiter.limit("30/minute")
async def update_presence(request: Request, data: dict, current_user: UserResponse = Depends(get_current_user)):
    status = data.get("status")
    if not status or status not in ["available", "busy", "dnd", "away", "offline", "brb"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    users_collection = get_collection("users")
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"status": status}}
    )
    
    # Broadcast to all connected users
    await manager.update_presence(current_user.id, status)
    
    return {"message": "Status updated"}

@router.put("/me/status-message")
@limiter.limit("10/minute")
async def update_status_message(request: Request, data: dict, current_user: UserResponse = Depends(get_current_user)):
    message = data.get("message")
    
    users_collection = get_collection("users")
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"status_message": message}}
    )
    
    # Broadcast status message update
    update_msg = json.dumps({
        "type": "chat:status_message",
        "data": {
            "user_id": current_user.id,
            "status_message": message
        }
    })
    
    # Notify all active users
    for uid in manager.user_sessions:
        await manager.notify_user(uid, update_msg)
        
    return {"message": "Status message updated"}

@router.patch("/me/preferences")
@limiter.limit("20/minute")
async def update_preferences(request: Request, data: UserPreferences, current_user: UserResponse = Depends(get_current_user)):
    users_collection = get_collection("users")
    
    # Convert preferences to dict for MongoDB update
    preferences_dict = data.dict()
    
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"preferences": preferences_dict}}
    )
    
    # Broadcast preferences update to all sessions of this user
    update_msg = json.dumps({
        "type": "user:preferences_updated",
        "data": preferences_dict
    })
    
    # Notify ONLY the current user across their sessions/tabs
    await manager.notify_user(current_user.id, update_msg)
        
    return {"message": "Preferences updated", "preferences": preferences_dict}

@router.get("/me/activity", response_model=list[ActivityLog])
@limiter.limit("20/minute")
async def get_user_activity(request: Request, current_user: UserResponse = Depends(get_current_user)):
    # ... existing implementation ...
    meetings_collection = get_collection("meetings")
    
    recent_meetings = await meetings_collection.find(
        {"host_id": str(current_user.id)}
    ).sort("created_at", -1).limit(10).to_list(length=10)
    
    activity_logs = []
    for m in recent_meetings:
        activity_logs.append(ActivityLog(
            id=str(m["_id"]),
            actor_id=current_user.id,
            actor_name=current_user.full_name,
            target_id=str(m["_id"]),
            target_type="meeting",
            title=m["title"],
            description=f"Meeting scheduled for {m['start_time'].strftime('%b %d, %H:%M')}",
            timestamp=m["created_at"],
            type="meeting_created"
        ))
        
    return activity_logs

@router.patch("/{user_id}/role")
async def update_user_role(user_id: str, data: dict, current_user: UserResponse = Depends(get_current_user)):
    role = data.get("role")
    department = data.get("department")
    
    users_collection = get_collection("users")
    update_data = {}
    if role: update_data["role"] = role
    if department: update_data["department"] = department
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
        
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    # Broadcast update
    msg = json.dumps({
        "type": "team:member_updated",
        "data": {"id": user_id, **update_data}
    })
    for uid in manager.user_sessions:
        await manager.notify_user(uid, msg)
        
    return {"message": "User updated"}

@router.delete("/{user_id}/access")
async def revoke_user_access(user_id: str, current_user: UserResponse = Depends(get_current_user)):
    users_collection = get_collection("users")
    # In a real enterprise app, we might set an 'is_active' flag to False
    # For this implementation, we'll strip 'is_verified' to hide them from the filtered team list
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_verified": False}}
    )
    
    # Broadcast removal
    msg = json.dumps({
        "type": "team:member_removed",
        "data": {"id": user_id}
    })
    for uid in manager.user_sessions:
        await manager.notify_user(uid, msg)
        
    return {"message": "Access revoked"}
