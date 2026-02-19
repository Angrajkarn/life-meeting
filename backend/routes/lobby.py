"""
Lobby API Routes
Handles pre-join lobby configuration and meeting join requests
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from backend.database import get_collection
from bson import ObjectId

router = APIRouter(prefix="/api/meetings", tags=["lobby"])

# ===== Models =====

class LobbyConfig(BaseModel):
    mute_on_entry: bool = False
    camera_on_entry: bool = True
    audio_locked: bool = False
    video_locked: bool = False
    waiting_room_enabled: bool = False
    allow_camera: bool = True
    allow_screen_share: bool = True

class JoinState(BaseModel):
    is_muted: bool
    is_video_on: bool
    selected_devices: Dict[str, str]
    audio_settings: Dict[str, bool]
    display_name: str
    avatar_url: Optional[str] = None
    joined_from_lobby: bool = True

class JoinRequest(BaseModel):
    user_id: str
    join_state: JoinState

class HostInfo(BaseModel):
    name: str
    is_waiting: bool = False

class LobbyConfigResponse(BaseModel):
    meeting_id: str
    title: str
    policies: LobbyConfig
    host_info: HostInfo

class JoinResponse(BaseModel):
    success: bool
    meeting_token: str
    websocket_url: str
    initial_state: Dict[str, Any]


# ===== Endpoints =====

@router.get("/{meeting_id}/lobby-config", response_model=LobbyConfigResponse)
async def get_lobby_config(meeting_id: str):
    """
    Get meeting lobby configuration and policies
    """
    try:
        meetings_collection = get_collection("meetings")
        users_collection = get_collection("users")

        # Find meeting
        try:
            meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
        except:
            # If invalid ObjectId, return 404
            raise HTTPException(status_code=404, detail="Meeting not found")

        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")

        # Get host info
        host = await users_collection.find_one({"_id": meeting.get("host_id")})
        host_name = host.get("full_name", "Unknown Host") if host else "Unknown Host"

        # Get lobby config (with defaults)
        lobby_config = meeting.get("lobby_config", {})
        policies = LobbyConfig(
            mute_on_entry=lobby_config.get("mute_on_entry", False),
            camera_on_entry=lobby_config.get("camera_on_entry", True),
            audio_locked=lobby_config.get("audio_locked", False),
            video_locked=lobby_config.get("video_locked", False),
            waiting_room_enabled=lobby_config.get("waiting_room_enabled", False),
            allow_camera=lobby_config.get("allow_camera", True),
            allow_screen_share=lobby_config.get("allow_screen_share", True),
        )

        return LobbyConfigResponse(
            meeting_id=meeting_id,
            title=meeting.get("title", "Meeting"),
            policies=policies,
            host_info=HostInfo(
                name=host_name,
                is_waiting=True  # TODO: Check if host is actually in meeting
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Lobby] Error getting config: {e}")
        raise HTTPException(status_code=500, detail="Failed to get lobby configuration")


@router.post("/{meeting_id}/join", response_model=JoinResponse)
async def join_meeting(meeting_id: str, request: JoinRequest):
    """
    Join a meeting with the assembled join state from lobby
    """
    try:
        meetings_collection = get_collection("meetings")

        # Find meeting
        try:
            meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
        except:
            raise HTTPException(status_code=404, detail="Meeting not found")

        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")

        # Validate join state against policies
        lobby_config = meeting.get("lobby_config", {})
        
        # Enforce policies
        final_muted = request.join_state.is_muted
        final_video_on = request.join_state.is_video_on

        if lobby_config.get("mute_on_entry"):
            final_muted = True

        if lobby_config.get("camera_on_entry") is False:
            final_video_on = False

        # Add user to participants if not already there
        participant = {
            "user_id": request.user_id,
            "joined_at": datetime.now(timezone.utc),
            "is_muted": final_muted,
            "is_video_on": final_video_on,
            "role": "host" if request.user_id == meeting.get("host_id") else "participant",
            "display_name": request.join_state.display_name,
            "avatar_url": request.join_state.avatar_url,
            "selected_devices": request.join_state.selected_devices,
            "audio_settings": request.join_state.audio_settings,
        }

        # Update meeting participants
        await meetings_collection.update_one(
            {"_id": ObjectId(meeting_id)},
            {
                "$addToSet": {"participants": participant},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )

        print(f"[Lobby] User {request.user_id} joined meeting {meeting_id}")
        print(f"[Lobby] Join state: muted={final_muted}, video={final_video_on}")

        # Generate WebSocket URL
        websocket_url = f"ws://127.0.0.1:8000/ws/{meeting_id}/{request.user_id}"

        return JoinResponse(
            success=True,
            meeting_token="temp_token",  # TODO: Generate real JWT token
            websocket_url=websocket_url,
            initial_state={
                "is_muted": final_muted,
                "is_video_on": final_video_on,
                "role": participant["role"],
                "meeting_id": meeting_id,
                "user_id": request.user_id,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Lobby] Error joining meeting: {e}")
        raise HTTPException(status_code=500, detail="Failed to join meeting")


@router.get("/{meeting_id}/waiting-room")
async def get_waiting_room(meeting_id: str):
    """
    Get waiting room participants (for host)
    """
    try:
        meetings_collection = get_collection("meetings")

        meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")

        waiting_room = meeting.get("waiting_room", [])
        
        return {
            "meeting_id": meeting_id,
            "waiting_count": len(waiting_room),
            "participants": waiting_room
        }

    except Exception as e:
        print(f"[Lobby] Error getting waiting room: {e}")
        raise HTTPException(status_code=500, detail="Failed to get waiting room")
