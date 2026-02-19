from fastapi import APIRouter, HTTPException, status, Depends, Request, Response
from backend.models import MeetingCreate, MeetingUpdate, MeetingResponse, UserResponse, ChatMessage, Participant
from backend.database import get_collection
from backend.routes.auth import get_current_user, get_optional_user
from backend.limiter import limiter
from backend.websocket_manager import manager
from backend.email_service import EmailService
from fastapi import BackgroundTasks
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from typing import List, Optional
from backend.models import MeetingStatus
from pydantic import BaseModel
import random
import string
import json

router = APIRouter()

def generate_meeting_code():
    # Format: abc-def-ghi
    chars = string.ascii_lowercase
    part1 = ''.join(random.choices(chars, k=3))
    part2 = ''.join(random.choices(chars, k=3))
    part3 = ''.join(random.choices(chars, k=3))
    return f"{part1}-{part2}-{part3}"

@router.post("/", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_meeting(
    request: Request,
    meeting: MeetingCreate, 
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user)
):
    meetings_collection = get_collection("meetings")
    
    # 1. Conflict Detection (Enterprise Logic)
    # Check if host has any overlapping meetings
    # Special case: allow overlapping for ad-hoc "Meet Now" style meetings
    is_adhoc = (meeting.start_time - datetime.now(meeting.start_time.tzinfo or timezone.utc)).total_seconds() < 300
    
    conflict = None
    if not is_adhoc:
        conflict = await meetings_collection.find_one({
            "host_id": str(current_user.id),
            "status": {"$in": [MeetingStatus.SCHEDULED, MeetingStatus.STARTING_SOON, MeetingStatus.JOIN_NOW, MeetingStatus.LIVE]},
            "$or": [
                {"start_time": {"$lt": meeting.end_time}, "end_time": {"$gt": meeting.start_time}}
            ]
        })
    
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Conflict detected: You already have a meeting '{conflict['title']}' scheduled at this time."
        )

    meeting_dict = meeting.dict()
    meeting_dict["host_id"] = str(current_user.id)
    meeting_dict["code"] = generate_meeting_code()
    
    # Calculate initial status based on start_time
    # Handle both aware and naive start_time (Pydantic might give aware)
    if meeting.start_time.tzinfo:
        now = datetime.now(timezone.utc)
    else:
        now = datetime.utcnow()
    
    delta = meeting.start_time - now
    if delta <= timedelta(minutes=2):
        meeting_dict["status"] = MeetingStatus.JOIN_NOW
    elif delta <= timedelta(minutes=10):
        meeting_dict["status"] = MeetingStatus.STARTING_SOON
    else:
        meeting_dict["status"] = MeetingStatus.SCHEDULED
        
    meeting_dict["created_at"] = now
    meeting_dict["participants"] = []
    
    # Ensure host is in attendees if not already there
    attendees = meeting_dict.get("attendees", [])
    if not any(a["user_id"] == str(current_user.id) for a in attendees):
        attendees.append({"user_id": str(current_user.id), "role": "host"})
    meeting_dict["attendees"] = attendees
    
    meeting_dict["settings"] = meeting.settings.dict()
    meeting_dict["spotlighted_user_ids"] = []
    meeting_dict["spotlight_set_by"] = None
    
    result = await meetings_collection.insert_one(meeting_dict)
    meeting_id = str(result.inserted_id)
    
    # 2. Real-Time Targeted Notifications
    # Notify all attendees about the new meeting so it appears in their Upcoming list
    response_data = MeetingResponse(id=meeting_id, **meeting_dict)
    
    # Use response_data.json() which handles datetime objects correctly
    notification_msg = json.dumps({
        "type": "meeting_created",
        "meeting": json.loads(response_data.json())
    })
    
    for attendee in attendees:
        # Don't notify the one who created it (they are already in the UI flow)
        if attendee["user_id"] != str(current_user.id):
            await manager.notify_user(attendee["user_id"], notification_msg)
            
    # EMAIL NOTIFICATION (Background Task)
    attendee_emails = [a["user_id"] for a in attendees if "@" in a["user_id"]]
    if attendee_emails:
        template_data = {
            "title": response_data.title,
            "date": response_data.start_time.strftime("%B %d, %Y"),
            "time": response_data.start_time.strftime("%I:%M %p"),
            "timezone": response_data.timezone,
            "host_name": current_user.full_name,
            "code": response_data.code,
            "join_url": f"{request.base_url}meeting/{response_data.code}"
        }
        background_tasks.add_task(EmailService.send_meeting_invite, attendee_emails, template_data)
    
    # AUTO-CREATE PERSISTENT CHAT CHANNEL
    channels_collection = get_collection("channels")
    await channels_collection.insert_one({
        "name": response_data.title,
        "type": "meeting",
        "meeting_id": str(response_data.id),
        "members": [str(current_user.id)] + [a["user_id"] for a in attendees],
        "created_at": datetime.now(timezone.utc)
    })

    # LOG ACTIVITY
    from backend.services.notification_service import notification_service
    from backend.models import ActivityLog
    
    await notification_service.log_activity(ActivityLog(
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        target_id=meeting_id,
        target_type="meeting",
        type="meeting_created",
        title=f"New meeting: {response_data.title}",
        description=f"Scheduled for {response_data.start_time.strftime('%b %d, %H:%M')}",
        timestamp=datetime.now(timezone.utc)
    ))

    return response_data

@router.get("/upcoming", response_model=list[MeetingResponse])
@limiter.limit("30/minute")
async def get_upcoming_meetings(
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    meetings_collection = get_collection("meetings")
    now = datetime.now(timezone.utc)
    
    # Filter: User is host OR User is in attendees OR (Org visibility AND status not ended)
    # Plus, the meeting hasn't ended.
    query = {
        "status": {"$ne": MeetingStatus.ENDED},
        "$or": [
            {"host_id": str(current_user.id)},
            {"attendees.user_id": str(current_user.id)},
            {"settings.visibility": {"$in": ["org", "team"]}}
        ]
    }
    
    meetings_cursor = meetings_collection.find(query).sort("start_time", 1)
    meetings = await meetings_cursor.to_list(length=50)
    
    return [MeetingResponse(id=str(m["_id"]), **m) for m in meetings]

@router.get("/", response_model=list[MeetingResponse])
@limiter.limit("30/minute")
async def list_meetings(
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    meetings_collection = get_collection("meetings")
    meetings_cursor = meetings_collection.find({"host_id": str(current_user.id)})
    meetings = await meetings_cursor.to_list(length=100)
    
    return [MeetingResponse(id=str(m["_id"]), **m) for m in meetings]

@router.get("/history", response_model=list[MeetingResponse])
@limiter.limit("30/minute")
async def get_meeting_history(
    request: Request,
    days: Optional[int] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    meetings_collection = get_collection("meetings")
    now = datetime.now(timezone.utc)
    
    # History: Meetings that have ended OR occurred in the past
    # Filter: User is host OR User is in attendees
    history_condition = {
        "$or": [
            {"status": MeetingStatus.ENDED},
            {"end_time": {"$lt": now}}
        ]
    }
    
    user_condition = {
        "$or": [
            {"host_id": str(current_user.id)},
            {"attendees.user_id": str(current_user.id)}
        ]
    }
    
    query = {"$and": [history_condition, user_condition]}
    
    # Optional: Date range filtering
    if days is not None and days > 0:
        cutoff = now - timedelta(days=days)
        query["$and"].append({"start_time": {"$gte": cutoff}})
    
    meetings_cursor = meetings_collection.find(query).sort("end_time", -1)
    meetings = await meetings_cursor.to_list(length=100)
    
    return [MeetingResponse(id=str(m["_id"]), **m) for m in meetings]

@router.get("/{meeting_id}", response_model=MeetingResponse)
@limiter.limit("30/minute")
async def get_meeting(
    request: Request,
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    return MeetingResponse(id=str(meeting["_id"]), **meeting)

@router.patch("/{meeting_id}", response_model=MeetingResponse)
@limiter.limit("10/minute")
async def update_meeting(
    request: Request,
    meeting_id: str, 
    meeting_update: MeetingUpdate,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user)
):
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    if meeting["host_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to edit this meeting")
        
    update_data = {k: v for k, v in meeting_update.dict().items() if v is not None}
    
    if update_data:
        await meetings_collection.update_one(
            {"_id": ObjectId(meeting_id)},
            {"$set": update_data}
        )
        # Re-fetch full meeting to ensure we broadcast the complete state
        meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
        
        # Real-time update broadcast
        response_model = MeetingResponse(id=str(meeting["_id"]), **meeting)
        broadcast_msg = json.dumps({
            "type": "meeting_updated",
            "meeting": json.loads(response_model.json(by_alias=True))
        })
        await manager.broadcast(broadcast_msg, "dashboard")

        # EMAIL NOTIFICATION for updates
        attendees = meeting.get("attendees", [])
        attendee_emails = [a["user_id"] for a in attendees if "@" in a["user_id"]]
        if attendee_emails:
            template_data = {
                "title": response_model.title,
                "date": response_model.start_time.strftime("%B %d, %Y"),
                "time": response_model.start_time.strftime("%I:%M %p"),
                "timezone": response_model.timezone,
                "host_name": current_user.full_name,
                "join_url": f"{request.base_url}meeting/{response_model.code}"
            }
            background_tasks.add_task(EmailService.send_meeting_update, attendee_emails, template_data)

        # LOG ACTIVITY
        from backend.services.notification_service import notification_service
        from backend.models import ActivityLog

        await notification_service.log_activity(ActivityLog(
            actor_id=str(current_user.id),
            actor_name=current_user.full_name,
            target_id=meeting_id,
            target_type="meeting",
            type="meeting_updated",
            title=f"Meeting updated: {response_model.title}",
            description="Details were updated",
            timestamp=datetime.now(timezone.utc)
        ))
        
    return MeetingResponse(id=str(meeting["_id"]), **meeting)

@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def delete_meeting(
    request: Request,
    meeting_id: str,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user)
):
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    if meeting["host_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this meeting")
        
    await meetings_collection.delete_one({"_id": ObjectId(meeting_id)})
    
    # Real-time deletion broadcast
    broadcast_msg = json.dumps({
        "type": "meeting_deleted",
        "meeting_id": meeting_id
    })
    await manager.broadcast(broadcast_msg, "dashboard")
    
    # EMAIL NOTIFICATION for cancellation
    attendees = meeting.get("attendees", [])
    attendee_emails = [a["user_id"] for a in attendees if "@" in a["user_id"]]
    if attendee_emails:
        template_data = {
            "title": meeting.get("title"),
            "date": meeting.get("start_time").strftime("%B %d, %Y"),
            "time": meeting.get("start_time").strftime("%I:%M %p")
        }
        background_tasks.add_task(EmailService.send_meeting_cancel, attendee_emails, template_data)

    # LOG ACTIVITY
    from backend.services.notification_service import notification_service
    from backend.models import ActivityLog
    
    await notification_service.log_activity(ActivityLog(
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        target_id=meeting_id,
        target_type="meeting",
        type="meeting_deleted",
        title=f"Meeting deleted: {meeting.get('title')}",
        description="The meeting was cancelled",
        timestamp=datetime.now(timezone.utc)
    ))

    return None

@router.get("/{meeting_id}/chat", response_model=List[ChatMessage])
@limiter.limit("60/minute")
async def get_chat_history(
    request: Request,
    meeting_id: str,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    chat_collection = get_collection("chat_messages")
    
    match_query = {
        "meeting_id": meeting_id,
        "is_deleted": {"$ne": True} # Don't fetch deleted messages (or fetch but filter in UI? UI handles is_deleted msg, but we might want to respect backend deletion)
        # Actually, if we want to show "Message removed", we need to fetch them.
        # But usually we just hard delete or soft delete. 
        # The MessageItem checks `is_deleted`. 
        # Let's keep fetching them but maybe filter scopes.
    }
    
    if current_user:
        match_query["$or"] = [
            {"scope": "public"},
            {"scope": "private", "sender_id": str(current_user.id)},
            {"scope": "private", "target_id": str(current_user.id)}
        ]
    else:
        # Guests or Unauth: Only Public
        match_query["scope"] = "public"

    cursor = chat_collection.find(match_query).sort("timestamp", 1)
    messages = await cursor.to_list(length=100)
    
    # Convert ObjectId to string and support legacy messages
    for msg in messages:
        msg["id"] = str(msg["_id"])
        if "text" in msg and "content" not in msg:
            msg["content"] = {"type": "text", "body": msg["text"]}
        
    return messages

@router.get("/code/{code}", response_model=MeetingResponse)
@limiter.limit("60/minute")
async def get_meeting_by_code(
    request: Request,
    code: str
):
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"code": code})
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    return MeetingResponse(id=str(meeting["_id"]), **meeting)

@router.post("/{meeting_id}/join", response_model=MeetingResponse)
@limiter.limit("20/minute")
async def join_meeting(
    request: Request,
    meeting_id: str,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    # If no user, create a guest participant (Logic for guest auth to be added later)
    # For now, require auth or rely on optional user
    
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    user_id = str(current_user.id) if current_user else f"guest_{ObjectId()}"
    name = current_user.full_name if current_user else "Guest user"

    # Check if already joined
    existing = next((p for p in meeting.get("participants", []) if p["user_id"] == user_id), None)
    
    if not existing:
        # Standardize participant data to match frontend types
        new_participant = Participant(
            user_id=user_id,
            name=name,
            joined_at=datetime.now(timezone.utc),
            status="In Meeting",
            role="guest"
        )
        
        await meetings_collection.update_one(
            {"_id": ObjectId(meeting_id)},
            {"$push": {"participants": new_participant.dict()}}
        )
        # Refresh meeting object
        meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})

        # LOG ACTIVITY
        from backend.services.notification_service import notification_service
        from backend.models import ActivityLog
        
        await notification_service.log_activity(ActivityLog(
            actor_id=user_id,
            actor_name=name,
            target_id=meeting_id,
            target_type="meeting",
            type="meeting_joined",
            title=f"{name} joined {meeting.get('title')}",
            description="Joined the meeting room",
            timestamp=datetime.now(timezone.utc)
        ))

    # Check if host is joining and start the meeting if not started
    print(f"DEBUG: join_meeting user_id={user_id} host_id={meeting.get('host_id')} started_at={meeting.get('started_at')}")
    if meeting.get("host_id") == user_id and not meeting.get("started_at"):
        print("DEBUG: Starting meeting now!")
        now = datetime.now(timezone.utc)
        await meetings_collection.update_one(
            {"_id": ObjectId(meeting_id)},
            {"$set": {"started_at": now, "status": MeetingStatus.LIVE}}
        )
        # Refresh for response
        meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
        
        # Broadcast start
        response_model = MeetingResponse(id=str(meeting["_id"]), **meeting)
        broadcast_msg = json.dumps({
            "type": "meeting_updated",
            "meeting": json.loads(response_model.json(by_alias=True))
        })
        await manager.broadcast(broadcast_msg, "dashboard")

    return MeetingResponse(id=str(meeting["_id"]), **meeting)

@router.get("/{meeting_id}/ics")
@limiter.limit("20/minute")
async def export_meeting_ics(
    request: Request,
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Export meeting as ICS file for calendar integration.
    """
    from backend.utils.calendar import generate_ics_content
    
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    ics_text = generate_ics_content({
        "id": str(meeting["_id"]),
        **meeting
    })
    
    return Response(
        content=ics_text,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename=meeting_{meeting['code']}.ics"
        }
    )


# ===== ENTERPRISE: SPOTLIGHT ENDPOINTS =====

class SpotlightRequest(BaseModel):
    user_ids: List[str]  # List of user IDs to spotlight (max 2-3)

@router.post("/{meeting_id}/spotlight")
@limiter.limit("30/minute")
async def set_spotlight(
    request: Request,
    meeting_id: str,
    spotlight_request: SpotlightRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Set spotlighted participants (host/co-host only).
    Spotlight is global and appears on all clients.
    """
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Verify user is host or co-host
    user_id = str(current_user.id)
    is_host = meeting.get("host_id") == user_id
    
    # Check co-host status
    participants = meeting.get("participants", [])
    participant = next((p for p in participants if p.get("user_id") == user_id), None)
    is_cohost = participant and participant.get("role") == "co-host"
    
    if not (is_host or is_cohost):
        raise HTTPException(
            status_code=403,
            detail="Only hosts and co-hosts can spotlight participants"
        )
    
    # Limit to max 3 spotlighted users
    if len(spotlight_request.user_ids) > 3:
        raise HTTPException(
            status_code=400,
            detail="Maximum 3 participants can be spotlighted"
        )
    
    # Update database
    await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": {
            "spotlighted_user_ids": spotlight_request.user_ids,
            "spotlight_set_by": user_id,
            "spotlight_updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Broadcast to all participants via WebSocket
    await manager.broadcast(json.dumps({
        "type": "meeting_state_update",
        "updates": {
            "spotlighted_user_ids": spotlight_request.user_ids,
            "set_by": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }), meeting_id)
    
    # Audit log
    audit_collection = get_collection("audit_logs")
    await audit_collection.insert_one({
        "meeting_id": meeting_id,
        "action": "set_spotlight",
        "actor_id": user_id,
        "target_ids": spotlight_request.user_ids,
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True, "spotlighted_user_ids": spotlight_request.user_ids}

@router.delete("/{meeting_id}/spotlight")
@limiter.limit("30/minute")
async def clear_spotlight(
    request: Request,
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Clear all spotlights (host/co-host only).
    """
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Verify user is host or co-host
    user_id = str(current_user.id)
    is_host = meeting.get("host_id") == user_id
    
    participants = meeting.get("participants", [])
    participant = next((p for p in participants if p.get("user_id") == user_id), None)
    is_cohost = participant and participant.get("role") == "co-host"
    
    if not (is_host or is_cohost):
        raise HTTPException(
            status_code=403,
            detail="Only hosts and co-hosts can clear spotlight"
        )
    
    # Update database
    await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": {
            "spotlighted_user_ids": [],
            "spotlight_set_by": None,
            "spotlight_updated_at": datetime.now(timezone.utc)
        }}
    )
    
    
    # Broadcast to all participants
    await manager.broadcast(json.dumps({
        "type": "meeting_state_update",
        "updates": {
            "spotlighted_user_ids": [],
            "set_by": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }), meeting_id)
    
    return {"success": True, "spotlighted_user_ids": []}


# ===== ENTERPRISE: MODERATION ENDPOINTS =====

class RoleUpdate(BaseModel):
    role: str # host, co-host, guest

@router.post("/{meeting_id}/participants/{target_user_id}/role")
@limiter.limit("20/minute")
async def update_participant_role(
    request: Request,
    meeting_id: str,
    target_user_id: str,
    role_update: RoleUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # ACL: Only host can change roles
    if meeting.get("host_id") != str(current_user.id):
         raise HTTPException(status_code=403, detail="Only the host can allow/revoke permissions")

    # Update logic
    result = await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id), "participants.user_id": target_user_id},
        {"$set": {"participants.$.role": role_update.role}}
    )

    if result.modified_count == 0:
         raise HTTPException(status_code=404, detail="Participant not found")

    # Broadcast
    await manager.broadcast(json.dumps({
        "type": "participant_updated",
        "user_id": target_user_id,
        "updates": {"role": role_update.role}
    }), meeting_id)

    return {"success": True, "role": role_update.role}


@router.post("/{meeting_id}/participants/{target_user_id}/mute")
@limiter.limit("30/minute")
async def mute_participant(
    request: Request,
    meeting_id: str,
    target_user_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # ACL: Host or Co-host
    user_id = str(current_user.id)
    is_host = meeting.get("host_id") == user_id
    requester_role = next((p["role"] for p in meeting.get("participants", []) if p["user_id"] == user_id), "guest")
    
    if not (is_host or requester_role == "co-host"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Update DB
    await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id), "participants.user_id": target_user_id},
        {"$set": {"participants.$.isMuted": True}}
    )

    # Broadcast
    await manager.broadcast(json.dumps({
        "type": "participant_updated",
        "user_id": target_user_id,
        "updates": {"isMuted": True}
    }), meeting_id)
    
    # Also send specific "mute_force" command to target?
    # For now, state update is enough, frontend reacts to it.

    return {"success": True}


@router.post("/{meeting_id}/participants/{target_user_id}/kick")
@limiter.limit("10/minute")
async def kick_participant(
    request: Request,
    meeting_id: str,
    target_user_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    meetings_collection = get_collection("meetings")
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # ACL: Host or Co-host
    user_id = str(current_user.id)
    is_host = meeting.get("host_id") == user_id
    requester_role = next((p["role"] for p in meeting.get("participants", []) if p["user_id"] == user_id), "guest")
    
    if not (is_host or requester_role == "co-host"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Cannot kick host
    if target_user_id == meeting.get("host_id"):
        raise HTTPException(status_code=400, detail="Cannot remove the host")

    # Update DB - Remove participant
    await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$pull": {"participants": {"user_id": target_user_id}}}
    )

    # Broadcast "user_left" or specific "user_kicked"
    await manager.broadcast(json.dumps({
        "type": "user_left", # Reuse existing event for immediate UI update
        "user_id": target_user_id,
        "reason": "kicked"
    }), meeting_id)

    return {"success": True}
