from fastapi import APIRouter, Depends, HTTPException, status, Request
from backend.routes.auth import get_current_user
from backend.models import UserResponse, Team, Channel, ChatMessage, TeamMember, ChatContent, Poll, PollOption, Canvas
from backend.database import get_collection
from backend.limiter import limiter
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional
import json
import uuid
import secrets

router = APIRouter(tags=["chat"])

@router.post("/teams", response_model=Team)
@limiter.limit("5/minute")
async def create_team(
    request: Request,
    team: Team,
    current_user: UserResponse = Depends(get_current_user)
):
    teams_collection = get_collection("teams")
    
    team_data = team.dict(exclude={"id"})
    team_data["owner_id"] = str(current_user.id)
    team_data["members"] = [{"user_id": str(current_user.id), "role": "admin"}]
    team_data["created_at"] = datetime.now(timezone.utc)
    
    result = await teams_collection.insert_one(team_data)
    team_data["id"] = str(result.inserted_id)
    
    return team_data

@router.post("/channels", response_model=Channel)
async def create_channel(
    channel: Channel,
    current_user: UserResponse = Depends(get_current_user)
):
    channels_collection = get_collection("channels")
    
    channel_data = channel.dict(exclude={"id"})
    if not channel_data.get("members"):
        channel_data["members"] = [str(current_user.id)]
    
    # Check if DM already exists
    if channel_data["type"] == "dm" and len(channel_data["members"]) == 2:
        existing = await channels_collection.find_one({
            "type": "dm",
            "members": {"$all": channel_data["members"]}
        })
        if existing:
            return Channel(id=str(existing["_id"]), **existing)

    channel_data["created_at"] = datetime.now(timezone.utc)
    result = await channels_collection.insert_one(channel_data)
    channel_data["id"] = str(result.inserted_id)
    
    return channel_data

@router.get("/channels", response_model=List[Channel])
async def list_channels(current_user: UserResponse = Depends(get_current_user)):
    channels_collection = get_collection("channels")
    cursor = channels_collection.find({
        "$or": [
            {"members": str(current_user.id)},
            {"type": "channel", "team_id": {"$exists": True}} # Simplified: all public channels in teams
        ]
    })
    
    channels = []
    users_collection = get_collection("users")
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        # Resolve member details for DMs or UI richness
        if doc.get("members"):
            member_docs = await users_collection.find({
                "_id": {"$in": [ObjectId(m) for m in doc["members"] if ObjectId.is_valid(m)]}
            }).to_list(length=len(doc["members"]))
            doc["member_details"] = [
                {"id": str(u["_id"]), "full_name": u.get("full_name"), "email": u.get("email")}
                for u in member_docs
            ]
        channels.append(doc)
    return channels

@router.get("/channels/{channel_id}", response_model=Channel)
async def get_channel(channel_id: str, current_user: UserResponse = Depends(get_current_user)):
    channels_collection = get_collection("channels")
    channel = await channels_collection.find_one({"_id": ObjectId(channel_id)})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    channel["id"] = str(channel["_id"])
    
    # Resolve member details
    if channel.get("members"):
        users_collection = get_collection("users")
        member_docs = await users_collection.find({
            "_id": {"$in": [ObjectId(m) for m in channel["members"] if ObjectId.is_valid(m)]}
        }).to_list(length=len(channel["members"]))
        channel["member_details"] = [
            {"id": str(u["_id"]), "full_name": u.get("full_name"), "email": u.get("email")}
            for u in member_docs
        ]
        
    return channel

@router.get("/channels/{channel_id}/messages", response_model=List[ChatMessage])
async def get_messages(
    channel_id: str,
    limit: int = 50,
    before: Optional[datetime] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    messages_collection = get_collection("messages")
    query = {"channel_id": channel_id, "deleted_for": {"$ne": str(current_user.id)}}
    if before:
        query["timestamp"] = {"$lt": before}
        
    cursor = messages_collection.find(query).sort("timestamp", -1).limit(limit)
    
    messages = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        # Support legacy messages that used 'text' instead of 'content'
        if "text" in doc and "content" not in doc:
            doc["content"] = {"type": "text", "body": doc["text"]}
            
        # Resolve Poll Data
        if doc.get("content", {}).get("type") == "poll":
            poll_id = doc["content"].get("poll_id")
            if poll_id:
                polls_collection = get_collection("polls")
                poll = await polls_collection.find_one({"_id": ObjectId(poll_id)})
                if poll:
                    # Clean up _id
                    poll["id"] = str(poll["_id"])
                    poll.pop("_id")
                    
                    # Serialize dates
                    if "created_at" in poll and isinstance(poll["created_at"], datetime):
                        poll["created_at"] = poll["created_at"].isoformat()
                        
                    # Ensure options are present and serialized
                    if "options" not in poll:
                        poll["options"] = []
                        
                    doc["poll_data"] = poll
                    
        messages.append(doc)
    
    return messages[::-1] # Return in chronological order

@router.get("/presence")
async def get_presence(current_user: UserResponse = Depends(get_current_user)):
    from backend.websocket_manager import manager
    return manager.presence

@router.post("/messages/{message_id}/reactions")
async def toggle_reaction(
    message_id: str,
    reaction_data: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    emoji = reaction_data.get("emoji")
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji is required")
        
    messages_collection = get_collection("messages")
    message = await messages_collection.find_one({"_id": ObjectId(message_id)})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
        
    reactions = message.get("reactions", [])
    user_id = str(current_user.id)
    
    # Toggle logic: remove if exists, add if not
    existing_reaction = next((r for r in reactions if r["userId"] == user_id and r["emoji"] == emoji), None)
    
    if existing_reaction:
        reactions = [r for r in reactions if not (r["userId"] == user_id and r["emoji"] == emoji)]
    else:
        reactions.append({"userId": user_id, "emoji": emoji})
        
    await messages_collection.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"reactions": reactions}}
    )
    
    # Broadcast update via WebSocket
    from backend.websocket_manager import manager
    channel_id = message.get("channel_id")
    meeting_id = message.get("meeting_id")
    
    broadcast_payload = {
        "type": "chat:reaction",
        "data": {
            "messageId": message_id,
            "reactions": reactions,
            "channel_id": channel_id
        }
    }
    
    if channel_id:
        await manager.broadcast_to_channel(channel_id, json.dumps(broadcast_payload))
    elif meeting_id:
        await manager.broadcast(json.dumps(broadcast_payload), meeting_id)
        
    return {"status": "success", "reactions": reactions}

@router.post("/messages", response_model=ChatMessage)
async def send_message(
    message: ChatMessage,
    current_user: UserResponse = Depends(get_current_user)
):
    messages_collection = get_collection("messages")
    
    msg_data = message.dict(exclude={"id"})
    msg_data["sender_id"] = str(current_user.id)
    msg_data["sender_name"] = current_user.full_name
    
    # Ensure content is set
    text_val = msg_data.get("text")
    if text_val and not msg_data.get("content"):
        msg_data["content"] = {"type": "text", "body": text_val}
        
    # Always ensure content exists and has a body
    if not msg_data.get("content"):
        msg_data["content"] = {"type": "text", "body": text_val or ""}
    elif not msg_data["content"].get("body"):
        msg_data["content"]["body"] = text_val or ""

    msg_data.pop("text", None)
    msg_data["timestamp"] = datetime.now(timezone.utc)
    msg_data["status"] = "sent"
    
    result = await messages_collection.insert_one(msg_data)
    
    # Update channel activity
    await get_collection("channels").update_one(
        {"_id": ObjectId(message.channel_id)},
        {
            "$set": {
                "last_message": msg_data["content"].get("body", ""),
                "last_message_at": msg_data["timestamp"]
            }
        }
    )
    
    msg_data["id"] = str(result.inserted_id)
    
    return msg_data

@router.get("/channels/{channel_id}/files")
async def get_channel_files(channel_id: str, current_user: UserResponse = Depends(get_current_user)):
    messages_collection = get_collection("messages")
    cursor = messages_collection.find({
        "channel_id": channel_id,
        "content.type": "file"
    }).sort("timestamp", -1)
    
    files = []
    async for doc in cursor:
        files.append({
            "id": str(doc["_id"]),
            "name": doc["content"].get("fileName"),
            "url": doc["content"].get("fileUrl"),
            "size": doc["content"].get("fileSize"),
            "sender_name": doc.get("sender_name"),
            "timestamp": doc.get("timestamp")
        })
    return files

@router.get("/channels/{channel_id}/photos")
async def get_channel_photos(channel_id: str, current_user: UserResponse = Depends(get_current_user)):
    messages_collection = get_collection("messages")
    cursor = messages_collection.find({
        "channel_id": channel_id,
        "content.type": "image"
    }).sort("timestamp", -1)
    
    photos = []
    async for doc in cursor:
        photos.append({
            "id": str(doc["_id"]),
            "url": doc["content"].get("fileUrl"),
            "sender_name": doc.get("sender_name"),
            "timestamp": doc.get("timestamp")
        })
    return photos

@router.get("/channels/{channel_id}/search")
async def search_messages(
    channel_id: str,
    query: str,
    current_user: UserResponse = Depends(get_current_user)
):
    if not query:
        return []
        
    messages_collection = get_collection("messages")
    # Search in content.body
    cursor = messages_collection.find({
        "channel_id": channel_id,
        "content.body": {"$regex": query, "$options": "i"},
        "is_deleted": False
    }).sort("timestamp", -1).limit(50)
    
    results = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        # Ensure timestamp is serialized
        if "timestamp" in doc and isinstance(doc["timestamp"], datetime):
            doc["timestamp"] = doc["timestamp"].isoformat()
        results.append(doc)
    return results

@router.post("/channels/{channel_id}/pin")
async def toggle_channel_pin(channel_id: str, current_user: UserResponse = Depends(get_current_user)):
    channels_collection = get_collection("channels")
    channel = await channels_collection.find_one({"_id": ObjectId(channel_id)})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    user_id = str(current_user.id)
    pinned_users = channel.get("pinned_users", [])
    
    if user_id in pinned_users:
        await channels_collection.update_one(
            {"_id": ObjectId(channel_id)},
            {"$pull": {"pinned_users": user_id}}
        )
        return {"status": "success", "is_pinned": False}
    else:
        await channels_collection.update_one(
            {"_id": ObjectId(channel_id)},
            {"$addToSet": {"pinned_users": user_id}}
        )
        return {"status": "success", "is_pinned": True}

@router.post("/channels/{channel_id}/mute")
async def toggle_channel_mute(channel_id: str, current_user: UserResponse = Depends(get_current_user)):
    channels_collection = get_collection("channels")
    channel = await channels_collection.find_one({"_id": ObjectId(channel_id)})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    user_id = str(current_user.id)
    muted_users = channel.get("muted_users", [])
    
    if user_id in muted_users:
        await channels_collection.update_one(
            {"_id": ObjectId(channel_id)},
            {"$pull": {"muted_users": user_id}}
        )
        return {"status": "success", "is_muted": False}
    else:
        await channels_collection.update_one(
            {"_id": ObjectId(channel_id)},
            {"$addToSet": {"muted_users": user_id}}
        )
        return {"status": "success", "is_muted": True}

@router.post("/channels/{channel_id}/unread")
async def toggle_channel_unread(channel_id: str, current_user: UserResponse = Depends(get_current_user)):
    channels_collection = get_collection("channels")
    channel = await channels_collection.find_one({"_id": ObjectId(channel_id)})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    user_id = str(current_user.id)
    unread_users = channel.get("unread_users", [])
    
    if user_id in unread_users:
        await channels_collection.update_one(
            {"_id": ObjectId(channel_id)},
            {"$pull": {"unread_users": user_id}}
        )
        return {"status": "success", "is_unread": False}
    else:
        await channels_collection.update_one(
            {"_id": ObjectId(channel_id)},
            {"$addToSet": {"unread_users": user_id}}
        )
        return {"status": "success", "is_unread": True}

@router.post("/invite")
async def invite_to_workspace(
    invitation: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    email = invitation.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    invites_collection = get_collection("invitations")
    
    # Generate secure token
    token = secrets.token_urlsafe(32)
    
    invite_data = {
        "email": email,
        "token": token,
        "sender_id": str(current_user.id),
        "sender_name": current_user.full_name,
        "created_at": datetime.now(timezone.utc),
        "status": "pending"
    }
    
    await invites_collection.insert_one(invite_data)
    
    # Send Email
    from backend.email_service import email_service
    # Construct invite URL (assuming frontend is at localhost:3000 for now)
    # In production this would come from an environment variable
    invite_url = f"http://localhost:3000/dashboard/chat/accept?token={token}"
    
    try:
        await email_service.send_workspace_invite(email, current_user.full_name, invite_url)
    except Exception as e:
        print(f"Failed to send invite email: {e}")
        # We still return success as the invite is record in DB
        
    return {"status": "success", "message": f"Invitation sent to {email}"}

@router.get("/accept-invite")
async def accept_invitation(
    token: str,
    current_user: UserResponse = Depends(get_current_user)
):
    invites_collection = get_collection("invitations")
    invite = await invites_collection.find_one({"token": token})
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    if invite.get("status") == "accepted":
        return {"status": "success", "message": "You have already joined the workspace!"}
    
    # Verify the current user is the target email (optional but recommended)
    # if invite["email"] != current_user.email:
    #     raise HTTPException(status_code=403, detail="This invitation was sent to another email address")

    # Update invitation status
    await invites_collection.update_one(
        {"_id": invite["_id"]},
        {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc)}}
    )
    
    # Auto-add user to a "General" channel if it exists
    channels_collection = get_collection("channels")
    general_channel = await channels_collection.find_one({"name": "General", "type": "channel"})
    
    if general_channel:
        await channels_collection.update_one(
            {"_id": general_channel["_id"]},
            {"$addToSet": {"members": str(current_user.id)}}
        )
    
    # Return redirect info or success
    return {"status": "success", "message": "You have joined the workspace!"}

@router.patch("/messages/{message_id}")
async def edit_message(
    message_id: str,
    update_data: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    messages_collection = get_collection("messages")
    message = await messages_collection.find_one({"_id": ObjectId(message_id)})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if str(message["sender_id"]) != str(current_user.id):
        raise HTTPException(status_code=403, detail="You can only edit your own messages")
        
    new_text = update_data.get("text")
    if not new_text:
        raise HTTPException(status_code=400, detail="New text is required")
        
    await messages_collection.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {
            "content.body": new_text,
            "is_edited": True,
            "edited_at": datetime.now(timezone.utc)
        }}
    )
    
    # Broadcast update
    from backend.websocket_manager import manager
    broadcast_payload = {
        "type": "chat:message_update",
        "data": {
            "id": message_id,
            "text": new_text,
            "is_edited": True,
            "channel_id": message.get("channel_id")
        }
    }
    await manager.broadcast_to_channel(message.get("channel_id"), json.dumps(broadcast_payload))
    
    return {"status": "success"}

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    delete_type: str = "me", # "me" or "everyone"
    current_user: UserResponse = Depends(get_current_user)
):
    messages_collection = get_collection("messages")
    message = await messages_collection.find_one({"_id": ObjectId(message_id)})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if delete_type == "everyone":
        if str(message["sender_id"]) != str(current_user.id):
            raise HTTPException(status_code=403, detail="You can only delete your own messages for everyone")
            
        # Check 10 minute rule
        time_diff = datetime.now(timezone.utc) - message["timestamp"].replace(tzinfo=timezone.utc) if message["timestamp"].tzinfo is None else datetime.now(timezone.utc) - message["timestamp"]
        if time_diff.total_seconds() > 600:
            raise HTTPException(status_code=400, detail="Time limit for 'Delete for Everyone' has passed")
            
        await messages_collection.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc)}}
        )
        
        # Broadcast delete
        from backend.websocket_manager import manager
        broadcast_payload = {
            "type": "chat:message_delete",
            "data": {
                "id": message_id,
                "delete_type": "everyone",
                "channel_id": message.get("channel_id")
            }
        }
        await manager.broadcast_to_channel(message.get("channel_id"), json.dumps(broadcast_payload))
    else:
        # Delete for me
        await messages_collection.update_one(
            {"_id": ObjectId(message_id)},
            {"$addToSet": {"deleted_for": str(current_user.id)}}
        )
        # Broadcast delete for me to sync tabs for this user
        from backend.websocket_manager import manager
        broadcast_payload = {
            "type": "chat:message_delete",
            "data": {
                "id": message_id,
                "delete_type": "me",
                "user_id": str(current_user.id),
                "channel_id": message.get("channel_id")
            }
        }
        await manager.broadcast_to_channel(message.get("channel_id"), json.dumps(broadcast_payload))
        
    return {"status": "success"}

@router.post("/messages/{message_id}/pin")
async def toggle_pin_message(
    message_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    messages_collection = get_collection("messages")
    message = await messages_collection.find_one({"_id": ObjectId(message_id)})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
        
    new_pin_status = not message.get("is_pinned", False)
    
    await messages_collection.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"is_pinned": new_pin_status}}
    )
    
    # Broadcast pin update
    from backend.websocket_manager import manager
    broadcast_payload = {
        "type": "chat:message_pin",
        "data": {
            "id": message_id,
            "is_pinned": new_pin_status,
            "channel_id": message.get("channel_id"),
            "pinned_by": current_user.full_name
        }
    }
    await manager.broadcast_to_channel(message.get("channel_id"), json.dumps(broadcast_payload))
    
    return {"status": "success", "is_pinned": new_pin_status}

@router.post("/polls", response_model=Poll)
async def create_poll(
    poll: Poll,
    current_user: UserResponse = Depends(get_current_user)
):
    polls_collection = get_collection("polls")
    poll_data = poll.dict(exclude={"id"})
    
    # Ensure options have IDs
    if "options" in poll_data:
        for opt in poll_data["options"]:
            if not opt.get("id"):
                opt["id"] = str(uuid.uuid4())
                
    poll_data["creator_id"] = str(current_user.id)
    poll_data["creator_name"] = current_user.full_name
    poll_data["created_at"] = datetime.utcnow()
    
    result = await polls_collection.insert_one(poll_data)
    poll_id = str(result.inserted_id)
    poll_data["id"] = poll_id
    
    # Create a chat message automatically
    messages_collection = get_collection("messages")
    msg_obj = {
        "channel_id": poll.channel_id,
        "sender_id": str(current_user.id),
        "sender_name": current_user.full_name,
        "content": {
            "type": "poll",
            "poll_id": poll_id,
            "body": poll.question
        },
        "timestamp": datetime.now(timezone.utc),
        "status": "sent"
    }
    
    msg_result = await messages_collection.insert_one(msg_obj)
    msg_obj["id"] = str(msg_result.inserted_id)
    msg_obj.pop("_id")
    msg_obj["timestamp"] = msg_obj["timestamp"].isoformat()
    
    # Prepare poll_data for serialization
    serializable_poll_data = poll_data.copy()
    serializable_poll_data.pop("_id", None) # Remove ObjectId
    
    if isinstance(serializable_poll_data.get("created_at"), datetime):
        serializable_poll_data["created_at"] = serializable_poll_data["created_at"].isoformat()
    
    # Force options to be serializable list of dicts
    if "options" in serializable_poll_data:
        serializable_poll_data["options"] = [
            {**opt, "votes": list(opt.get("votes", []))} 
            for opt in serializable_poll_data["options"]
        ]
    
    msg_obj["poll_data"] = serializable_poll_data
    
    # Broadcast to channel
    from backend.websocket_manager import manager
    await manager.broadcast_to_channel(poll.channel_id, json.dumps({
        "type": "chat:message",
        "data": msg_obj
    }))
    
    return poll_data

@router.post("/polls/{poll_id}/vote")
async def vote_poll(
    poll_id: str,
    option_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    polls_collection = get_collection("polls")
    poll = await polls_collection.find_one({"_id": ObjectId(poll_id)})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Remove previous vote from same user
    for option in poll["options"]:
        if str(current_user.id) in option["votes"]:
            option["votes"].remove(str(current_user.id))
    
    # Add new vote
    for option in poll["options"]:
        if option["id"] == option_id:
            option["votes"].append(str(current_user.id))
            break
            
    await polls_collection.update_one(
        {"_id": ObjectId(poll_id)},
        {"$set": {"options": poll["options"]}}
    )
    
    # Broadcast update
    from backend.websocket_manager import manager
    await manager.broadcast_to_channel(poll["channel_id"], json.dumps({
        "type": "poll:update",
        "data": {
            "poll_id": poll_id,
            "options": poll["options"]
        }
    }))
    
    return {"status": "success"}

@router.post("/canvases", response_model=Canvas)
async def update_canvas(
    canvas: Canvas,
    current_user: UserResponse = Depends(get_current_user)
):
    canvases_collection = get_collection("canvases")
    
    canvas_data = canvas.dict(exclude={"id"})
    canvas_data["last_updated_by"] = current_user.full_name
    canvas_data["updated_at"] = datetime.now(timezone.utc)
    
    await canvases_collection.update_one(
        {"channel_id": canvas.channel_id, "title": canvas.title},
        {"$set": canvas_data},
        upsert=True
    )
    
    # Fetch the final object to get the ID
    final_canvas = await canvases_collection.find_one({"channel_id": canvas.channel_id, "title": canvas.title})
    canvas_data["id"] = str(final_canvas["_id"])
    
    # Broadcast sync
    from backend.websocket_manager import manager
    # Convert datetime for JSON serialization
    sync_data = canvas_data.copy()
    if isinstance(sync_data.get("updated_at"), datetime):
        sync_data["updated_at"] = sync_data["updated_at"].isoformat()
        
    await manager.broadcast_to_channel(canvas.channel_id, json.dumps({
        "type": "canvas:sync",
        "data": sync_data
    }))
    
    return canvas_data

@router.get("/canvases/{channel_id}", response_model=List[Canvas])
async def list_canvases(channel_id: str, current_user: UserResponse = Depends(get_current_user)):
    canvases_collection = get_collection("canvases")
    cursor = canvases_collection.find({"channel_id": channel_id})
    canvases = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        canvases.append(doc)
    return canvases

@router.delete("/channels/{channel_id}")
async def delete_channel(channel_id: str, current_user: UserResponse = Depends(get_current_user)):
    channels_collection = get_collection("channels")
    messages_collection = get_collection("messages")
    
    channel = await channels_collection.find_one({"_id": ObjectId(channel_id)})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    # Permission check: For group channels, only members. For DMs, either member.
    if str(current_user.id) not in channel.get("members", []):
        raise HTTPException(status_code=403, detail="You are not a member of this channel")
        
    # Delete all messages in the channel
    await messages_collection.delete_many({"channel_id": channel_id})
    
    # Delete the channel itself
    await channels_collection.delete_one({"_id": ObjectId(channel_id)})
    
    # Broadcast deletion to all members via WebSocket
    from backend.websocket_manager import manager
    broadcast_payload = {
        "type": "chat:channel_deleted",
        "data": {
            "channel_id": channel_id,
            "deleted_by": current_user.full_name
        }
    }
    
    # Notify all members so their UI updates (sidebar removing the channel)
    for member_id in channel.get("members", []):
        await manager.notify_user(member_id, json.dumps(broadcast_payload))
        
    return {"status": "success", "message": "Channel and all messages deleted"}
