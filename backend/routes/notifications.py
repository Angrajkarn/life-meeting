from fastapi import APIRouter, Depends, HTTPException, Request
from backend.routes.auth import get_current_user
from backend.models import UserResponse, Notification, ActivityLog
from backend.services.notification_service import notification_service
from backend.database import get_collection
from backend.limiter import limiter
from datetime import datetime, timezone

router = APIRouter()

@router.get("/", response_model=list[Notification])
@limiter.limit("30/minute")
async def get_notifications(
    request: Request, 
    limit: int = 50, 
    unread_only: bool = False,
    current_user: UserResponse = Depends(get_current_user)
):
    return await notification_service.get_notifications(current_user.id, limit, unread_only)

@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: UserResponse = Depends(get_current_user)):
    await notification_service.mark_as_read(notification_id)
    return {"message": "Marked as read"}

@router.post("/mark-all-read")
async def mark_all_read(current_user: UserResponse = Depends(get_current_user)):
    await notification_service.mark_all_as_read(current_user.id)
    return {"message": "All marked as read"}

@router.get("/activity", response_model=list[ActivityLog])
@limiter.limit("30/minute")
async def get_activity_feed(
    request: Request,
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_user)
):
    # This might fetch team activity, or just personal
    # For now, let's fetch all activity logs where the user is involved or it's public/team-wide
    # Simplifying to "all logs" for now (production would filtering by team/permissions)
    collection = get_collection("activity_logs")
    cursor = collection.find().sort("timestamp", -1).limit(limit)
    
    logs = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        logs.append(ActivityLog(**doc))
    return logs

# Internal/Test endpoint to trigger a notification
@router.post("/test-send")
async def send_test_notification(
    data: dict, 
    current_user: UserResponse = Depends(get_current_user)
):
    notif = Notification(
        user_id=current_user.id,
        type="system_alert",
        title=data.get("title", "Test Notification"),
        message=data.get("message", "This is a test."),
        priority=data.get("priority", "normal")
    )
    result = await notification_service.create_notification(notif)
    return result
