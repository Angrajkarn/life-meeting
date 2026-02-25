"""
Participant Presence Management

Handles participant state management for video presence system.
Decouples presence from media streams for persistent video tiles.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from backend.database import get_collection
from bson import ObjectId
import json


async def create_participant_presence(meeting_id: str, user_id: str, name: str, role: str) -> Dict:
    """
    Create a new participant presence entry.
    
    Returns the created participant data.
    """
    meetings_collection = get_collection("meetings")
    
    participant = {
        "user_id": user_id,
        "name": name,
        "role": role,
        "presence": "connected",
        "joined_at": datetime.now(timezone.utc),
        "last_seen": datetime.now(timezone.utc),
        
        # Media states
        "is_video_on": False,
        "is_audio_on": True,  # Default unmuted
        
        # UI states
        "is_speaking": False,
        "is_presenting": False,
        "is_hand_raised": False,
        "hand_raised": {
            "is_raised": False,
            "raised_at": None,
            "sequence_number": 0
        },
        
        # Avatar
        "avatar_color": generate_avatar_color(user_id)
    }
    
    # Add to meeting's participants array
    if ObjectId.is_valid(meeting_id):
        await meetings_collection.update_one(
            {"_id": ObjectId(meeting_id)},
            {
                "$pull": {"participants": {"user_id": user_id}},  # Remove if exists
            }
        )
        await meetings_collection.update_one(
            {"_id": ObjectId(meeting_id)},
            {
                "$addToSet": {"participants": participant}
            }
        )
    
    return participant


async def update_participant_presence(meeting_id: str, user_id: str, updates: Dict) -> bool:
    """
    Update participant presence state.
    
    Returns True if updated successfully.
    """
    meetings_collection = get_collection("meetings")
    
    # Build update query
    update_fields = {}
    for key, value in updates.items():
        update_fields[f"participants.$[elem].{key}"] = value
    
    # Always update last_seen
    update_fields["participants.$[elem].last_seen"] = datetime.now(timezone.utc)
    
    if ObjectId.is_valid(meeting_id):
        result = await meetings_collection.update_one(
            {"_id": ObjectId(meeting_id)},
            {"$set": update_fields},
            array_filters=[{"elem.user_id": user_id}]
        )
        return result.modified_count > 0
    
    return False


async def remove_participant_presence(meeting_id: str, user_id: str) -> bool:
    """
    Remove participant from meeting.
    
    Returns True if removed successfully.
    """
    if not ObjectId.is_valid(meeting_id):
        return False
        
    meetings_collection = get_collection("meetings")
    
    result = await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$pull": {"participants": {"user_id": user_id}}}
    )
    return result.modified_count > 0


async def get_participant_presence(meeting_id: str, user_id: str) -> Optional[Dict]:
    """
    Get a specific participant's presence data.
    """
    meetings_collection = get_collection("meetings")
    
    if ObjectId.is_valid(meeting_id):
        meeting = await meetings_collection.find_one(
            {"_id": ObjectId(meeting_id)},
            {"participants": {"$elemMatch": {"user_id": user_id}}}
        )
        if meeting and "participants" in meeting and len(meeting["participants"]) > 0:
            return meeting["participants"][0]
    
    return None


async def get_all_participants(meeting_id: str) -> List[Dict]:
    """
    Get all participants in a meeting.
    """
    meetings_collection = get_collection("meetings")
    
    if ObjectId.is_valid(meeting_id):
        meeting = await meetings_collection.find_one(
            {"_id": ObjectId(meeting_id)},
            {"participants": 1}
        )
        if meeting:
            return meeting.get("participants", [])
    
    return []


def generate_avatar_color(user_id: str) -> str:
    """
    Generate a consistent avatar color based on user ID.
    """
    colors = [
        "#6366f1",  # indigo
        "#8b5cf6",  # violet
        "#ec4899",  # pink
        "#f43f5e",  # rose
        "#f59e0b",  # amber
        "#10b981",  # emerald
        "#06b6d4",  # cyan
        "#3b82f6",  # blue
    ]
    
    # Use hash of user_id to consistently pick a color
    hash_val = sum(ord(c) for c in user_id)
    return colors[hash_val % len(colors)]


def serialize_participant(participant: Dict) -> str:
    """
    Serialize participant data for WebSocket transmission.
    """
    # Convert datetime objects to ISO strings
    serializable = participant.copy()
    if "joined_at" in serializable and isinstance(serializable["joined_at"], datetime):
        serializable["joined_at"] = serializable["joined_at"].isoformat()
    if "last_seen" in serializable and isinstance(serializable["last_seen"], datetime):
        serializable["last_seen"] = serializable["last_seen"].isoformat()
    
    return json.dumps(serializable)
