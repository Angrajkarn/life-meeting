from backend.models import Notification, ActivityLog
from backend.database import get_collection
from backend.websocket_manager import manager
from bson import ObjectId
from datetime import datetime, timezone
import json

class NotificationService:
    @staticmethod
    async def create_notification(notification: Notification):
        notifications_collection = get_collection("notifications")
        
        # Convert to dict and remove ID if None (let Mongo generate it or use the one provided)
        notif_dict = notification.dict()
        if not notif_dict.get("id"):
            del notif_dict["id"]
            
        result = await notifications_collection.insert_one(notif_dict)
        notif_dict["id"] = str(result.inserted_id)
        
        # Real-time Push
        await manager.notify_user(notification.user_id, json.dumps({
            "type": "notification:new",
            "data": notif_dict
        }, default=str))
        
        return notif_dict

    @staticmethod
    async def log_activity(activity: ActivityLog):
        activity_collection = get_collection("activity_logs")
        
        act_dict = activity.dict()
        if not act_dict.get("id"):
            del act_dict["id"]
            
        result = await activity_collection.insert_one(act_dict)
        act_dict["id"] = str(result.inserted_id)
        
        # We might want to push activity updates too, e.g. to a team feed
        # For now, we persist it.
        return act_dict

    @staticmethod
    async def get_notifications(user_id: str, limit: int = 50, unread_only: bool = False):
        notifications_collection = get_collection("notifications")
        query = {"user_id": user_id}
        if unread_only:
            query["is_read"] = False
            
        cursor = notifications_collection.find(query).sort("created_at", -1).limit(limit)
        return [Notification(**{**doc, "id": str(doc["_id"])}) async for doc in cursor]

    @staticmethod
    async def mark_as_read(notification_id: str):
        notifications_collection = get_collection("notifications")
        await notifications_collection.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"is_read": True}}
        )

    @staticmethod
    async def mark_all_as_read(user_id: str):
        notifications_collection = get_collection("notifications")
        await notifications_collection.update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True}}
        )

notification_service = NotificationService()
