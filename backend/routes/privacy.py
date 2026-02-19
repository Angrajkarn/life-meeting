from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from backend.routes.auth import get_current_user
from backend.models import UserResponse, PrivacySettings, PrivacyPolicy
from backend.database import get_collection
from backend.limiter import limiter
from datetime import datetime, timezone
from bson import ObjectId
import json

router = APIRouter()

async def get_effective_privacy_settings(user: UserResponse):
    """
    Merges user preferences with organization policies.
    Org policies always override user settings where conflicts exist.
    """
    user_settings = user.preferences.privacy.dict()
    
    # improved: fetch all orgs the user is part of
    if not user.organizations:
        return user_settings

    orgs_collection = get_collection("organizations")
    # simplified: just take the policy of the first org for now (multi-org policy merging is complex)
    # In a real enterprise app, you might pick the strictest policy or the "primary" org
    primary_org_id = user.organizations[0] 
    org = await orgs_collection.find_one({"_id": ObjectId(primary_org_id)})
    
    if not org or "privacy_policy" not in org:
        return user_settings
        
    org_policy = PrivacyPolicy(**org.get("privacy_policy", {}))
    
    # --- POLICY ENFORCEMENT LOGIC ---
    
    # 1. Recording Policy
    if org_policy.enforce_recording == "deny":
        user_settings["allow_recording"] = False
        user_settings["_enforced_recording"] = "deny" # Metadata for UI lock
    elif org_policy.enforce_recording == "allow":
         user_settings["allow_recording"] = True
         user_settings["_enforced_recording"] = "allow"

    # 2. Camera Policy
    if org_policy.enforce_camera_on:
        user_settings["_enforced_camera"] = True
        # We don't have a direct user setting for this in PrivacySettings yet, 
        # but this flag tells frontend to warn/enforce.
        
    return user_settings

@router.get("/effective-settings")
@limiter.limit("20/minute")
async def read_effective_privacy_settings(request: Request, current_user: UserResponse = Depends(get_current_user)):
    return await get_effective_privacy_settings(current_user)

@router.patch("/settings")
@limiter.limit("20/minute")
async def update_privacy_settings(
    request: Request, 
    settings: PrivacySettings, 
    current_user: UserResponse = Depends(get_current_user)
):
    users_collection = get_collection("users")
    
    # We only update the raw user preferences. 
    # The effective settings endpoint calculates overrides on read.
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"preferences.privacy": settings.dict()}}
    )
    
    return {"message": "Privacy settings updated", "settings": settings}

@router.post("/export-data")
@limiter.limit("1/day") # Strict limit on data exports
async def trigger_data_export(
    request: Request, 
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    GDPR/CCPA compliant data export.
    Triggers a background task to gather all user data and email it.
    """
    # Create an audit log for this request
    audit_collection = get_collection("audit_logs")
    await audit_collection.insert_one({
        "user_id": current_user.id,
        "action": "data_export_requested",
        "timestamp": datetime.now(timezone.utc),
        "ip_address": request.client.host
    })

    # Mock background task for now
    background_tasks.add_task(process_data_export, current_user.email)
    
    return {"message": "Data export started. You will receive an email shortly."}

async def process_data_export(email: str):
    # This would simulate a long running job
    # Querying messages, meetings, logs, etc.
    print(f"Processing data export for {email}...") 
    # email_service.send_data_export(email, zip_file)
