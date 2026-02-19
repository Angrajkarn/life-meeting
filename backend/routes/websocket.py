from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.websocket_manager import manager
from backend.database import get_collection
from backend.models import ChatMessage
from backend.presence import (
    create_participant_presence,
    update_participant_presence,
    remove_participant_presence,
    get_all_participants
)
import secrets
import time
import random
import string
from datetime import datetime, timezone
import json
from bson import ObjectId

router = APIRouter()

@router.websocket("/ws/{meeting_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str, user_id: str):
    print(f"[WebSocket] Connection attempt - Meeting: '{meeting_id}', User: '{user_id}'")
    try:
        with open("ws_debug.txt", "a") as f:
            f.write(f"{datetime.utcnow()} - WS Attempt - Meeting: {meeting_id}, User: {user_id}\n")
    except Exception as io_err:
        print(f"[WebSocket] Failed to write to debug log: {io_err}")

    try:
        # Pass user_id to connect
        print(f"[WebSocket] Accepting connection for user {user_id} in meeting {meeting_id}")
        await manager.connect(websocket, meeting_id, user_id)
        print(f"[WebSocket] Connection established successfully")
        
        chat_collection = get_collection("chat_messages")
        meetings_collection = get_collection("meetings")

        # Fetch User Details
        users_collection = get_collection("users")
        user_name = "Guest " + user_id[-4:]
        user_role = "guest"
        
        if ObjectId.is_valid(user_id):
            user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
            if user_doc:
                if "full_name" in user_doc:
                    user_name = user_doc["full_name"]
                
        # Determine Role from Meeting Data (Source of Truth)
        meeting = None
        if ObjectId.is_valid(meeting_id):
            meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
        
        if meeting:
            if meeting.get("host_id") == user_id:
                user_role = "host"
            else:
                 # Check participants array for role override (co-host)
                 participants = meeting.get("participants", [])
                 p_data = next((p for p in participants if p.get("user_id") == user_id), None)
                 if p_data and p_data.get("role"):
                     user_role = p_data["role"]
        
        # Create participant presence (enterprise model)
        participant_data = await create_participant_presence(
            meeting_id=meeting_id,
            user_id=user_id,
            name=user_name,
            role=user_role
        )

        # Broadcast participant_joined event with full presence data
        await manager.broadcast(json.dumps({
            "type": "participant_joined",
            "data": {
                "user_id": participant_data["user_id"],
                "name": participant_data["name"],
                "role": participant_data["role"],
                "presence": participant_data["presence"],
                "is_video_on": participant_data["is_video_on"],
                "is_audio_on": participant_data["is_audio_on"],
                "is_speaking": participant_data["is_speaking"],
                "is_presenting": participant_data["is_presenting"],
                "is_hand_raised": participant_data["is_hand_raised"],
                "avatar_color": participant_data["avatar_color"],
                "joined_at": participant_data["joined_at"].isoformat()
            }
        }), meeting_id)

        # Late Joiner Support: Send current participants list
        all_participants = await get_all_participants(meeting_id)
        await manager.send_personal_message(json.dumps({
            "type": "participant_list",
            "data": [
                {
                    "user_id": p["user_id"],
                    "name": p["name"],
                    "role": p["role"],
                    "presence": p["presence"],
                    "is_video_on": p["is_video_on"],
                    "is_audio_on": p["is_audio_on"],
                    "is_speaking": p.get("is_speaking", False),
                    "is_presenting": p.get("is_presenting", False),
                    "is_hand_raised": p.get("is_hand_raised", False),
                    "avatar_color": p["avatar_color"],
                    "joined_at": p["joined_at"].isoformat() if isinstance(p["joined_at"], datetime) else p["joined_at"]
                }
                for p in all_participants if p["user_id"] != user_id  # Exclude self
            ]
        }), websocket)

        # Late Joiner Support: Notify about active screen share
        if ObjectId.is_valid(meeting_id):
            full_meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
            if full_meeting and full_meeting.get("active_presenter_id"):
                active_presenter_id = full_meeting.get("active_presenter_id")
                # Send notification only to the newly joined user
                await manager.send_personal_message(json.dumps({
                    "type": "active_presenter_notification",
                    "active_presenter_id": active_presenter_id,
                    "message": "Screen share is active"
                }), websocket)
                print(f"[Late Joiner] Notified {user_id} about active presenter {active_presenter_id}")


        # System Message: Join
        system_msg = {
            "meeting_id": meeting_id,
            "sender_id": "system",
            "sender_name": "System",
            "sender_role": "system",
            "timestamp": datetime.utcnow(),
            "content": {"type": "system", "body": f"{user_name} joined the meeting."},
            "scope": "public",
            "reactions": [],
            "is_deleted": False,
            "type": "chat"
        }
        res = await chat_collection.insert_one(system_msg)
        system_msg["id"] = str(res.inserted_id)
        system_msg.pop("_id")
        system_msg["timestamp"] = system_msg["timestamp"].isoformat()
        await manager.broadcast(json.dumps({"type": "chat_message", "message": system_msg}), meeting_id)

        # Rate Limiting
        import time
        msg_count = 0
        last_reset = time.time()
        RATE_LIMIT = 30 # messages per minute
        
        reaction_count = 0
        reaction_last_reset = time.time()
        REACTION_RATE_LIMIT = 60 # reactions per minute
        
        while True:
            data = await websocket.receive_text()
            try:
                data_json = json.loads(data)
                msg_type = data_json.get("type")

                # --- ENTERPRISE CHAT SYSTEM HANDLERS ---
                if msg_type == "chat:presence":
                    status = data_json.get("status", "online")
                    await manager.update_presence(user_id, status)
                    continue

                if msg_type == "chat:typing":
                    channel_id = data_json.get("channel_id")
                    is_typing = data_json.get("is_typing", False)
                    if channel_id:
                        await manager.set_typing(channel_id, user_id, is_typing)
                    continue

                if msg_type == "chat:message":
                    channel_id = data_json.get("channel_id")
                    text = data_json.get("text")
                    content = data_json.get("content")
                    parent_id = data_json.get("parent_id")
                    reply_to_name = data_json.get("reply_to_name")
                    reply_to_content = data_json.get("reply_to_content")
                    mentions = data_json.get("mentions", [])
                    
                    if channel_id and (text or content):
                        # Persist Message
                        messages_collection = get_collection("messages")
                        msg_obj = {
                            "channel_id": channel_id,
                            "sender_id": user_id,
                            "sender_name": user_name,
                            "content": content if content else {"type": "text", "body": text},
                            "timestamp": datetime.now(timezone.utc),
                            "status": "sent",
                            "parent_id": parent_id,
                            "reply_to_name": reply_to_name,
                            "reply_to_content": reply_to_content,
                            "mentions": mentions
                        }

                        # Resolve Poll Data if applicable
                        if msg_obj["content"].get("type") == "poll":
                            poll_id = msg_obj["content"].get("poll_id")
                            if poll_id:
                                polls_collection = get_collection("polls")
                                poll = await polls_collection.find_one({"_id": ObjectId(poll_id)})
                                if poll:
                                    msg_obj["poll_data"] = poll
                                    msg_obj["poll_data"]["id"] = str(poll["_id"])
                                    msg_obj["poll_data"].pop("_id")
                                    # Handle datetime in poll_data if any
                                    if "created_at" in msg_obj["poll_data"]:
                                        msg_obj["poll_data"]["created_at"] = msg_obj["poll_data"]["created_at"].isoformat()

                        result = await messages_collection.insert_one(msg_obj)
                        
                        # Update channel activity
                        await get_collection("channels").update_one(
                            {"_id": ObjectId(channel_id)},
                            {
                                "$set": {
                                    "last_message": msg_obj["content"].get("body", ""),
                                    "last_message_at": msg_obj["timestamp"]
                                }
                            }
                        )
                        
                        msg_obj["id"] = str(result.inserted_id)
                        msg_obj.pop("_id")
                        msg_obj["timestamp"] = msg_obj["timestamp"].isoformat()
                        
                        # Ensure top-level 'text' for backward compatibility with frontend
                        msg_obj["text"] = msg_obj["content"].get("body", "")
                        
                        await manager.broadcast_to_channel(channel_id, json.dumps({
                            "type": "chat:message",
                            "data": msg_obj
                        }))
                    continue

                if msg_type == "canvas:sync":
                    channel_id = data_json.get("channel_id")
                    if channel_id:
                        await manager.broadcast_to_channel(channel_id, json.dumps({
                            "type": "canvas:sync",
                            "data": data_json.get("data")
                        }))
                    continue

                if msg_type == "huddle:start":
                    channel_id = data_json.get("channel_id")
                    if channel_id:
                        huddle_code = "".join(random.choices(string.ascii_lowercase, k=9))
                        formatted_code = f"{huddle_code[:3]}-{huddle_code[3:6]}-{huddle_code[6:]}"
                        
                        await manager.broadcast_to_channel(channel_id, json.dumps({
                            "type": "huddle:invite",
                            "data": {
                                "code": formatted_code,
                                "creator_name": user_name,
                                "channel_id": channel_id
                            }
                        }))
                    continue

                # Rate Limit Check: Chat Messages
                if msg_type == "chat_message":
                    now = time.time()
                    if now - last_reset > 60:
                        msg_count = 0
                        last_reset = now
                    
                    msg_count += 1
                    if msg_count > RATE_LIMIT:
                        await manager.send_personal_message(json.dumps({
                            "type": "error",
                            "message": "Message rate limit exceeded. Please slow down."
                        }), websocket)
                        continue

                # Rate Limit Check: Reactions
                if msg_type == "chat_reaction":
                    now = time.time()
                    if now - reaction_last_reset > 60:
                        reaction_count = 0
                        reaction_last_reset = now
                    
                    reaction_count += 1
                    if reaction_count > REACTION_RATE_LIMIT:
                         # Silently ignore or warn? verification says "Verify UI handles load without freezing", backend should reject.
                         # Let's warn but not close connection.
                        await manager.send_personal_message(json.dumps({
                            "type": "error",
                            "message": "Reaction rate limit exceeded."
                        }), websocket)
                        continue

                # --- EMOJI REACTION (Enterprise Reaction System) ---
                if msg_type == "reaction_send":
                    # Import reaction handler
                    from backend.reaction_handler import handle_reaction_send
                    
                    # Get meeting settings
                    meeting = None
                    if ObjectId.is_valid(meeting_id):
                        meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
                    
                    if not meeting:
                        if ObjectId.is_valid(meeting_id): # Only error if it was supposed to be a meeting
                            await manager.send_personal_message(json.dumps({
                                "type": "error",
                                "message": "Meeting not found"
                            }), websocket)
                        continue
                    
                    meeting_settings = meeting.get('settings', {})
                    
                    # Get rate limiter from app state
                    rate_limiter = websocket.app.state.reaction_rate_limiter
                    
                    # Handle reaction with validation
                    await handle_reaction_send(
                        ws=websocket,
                        user_id=user_id,
                        user_name=user_name,
                        data=data_json.get('data', {}),
                        meeting_settings=meeting_settings,
                        user_role=user_role,
                        rate_limiter=rate_limiter if rate_limiter else None,
                        broadcast_func=lambda meeting_id, msg: manager.broadcast(json.dumps(msg), meeting_id)
                    )
                    continue

                # --- 1. CHAT MESSAGE ---
                if msg_type == "chat_message":
                    # Payload: { type: "chat_message", scope: "public"|"private", targetId: "...", content: {...} }
                    
                    # Permission Check
                    # Re-fetch meeting to check for Chat Lock
                    can_chat = True
                    if ObjectId.is_valid(meeting_id):
                        meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
                        if not meeting:
                            print("DEBUG: Meeting not found in DB!")
                            continue
                            
                        participants = meeting.get("participants", [])
                        p_current = next((p for p in participants if p.get("user_id") == user_id), None)
                        
                        # Check Participant Permissions
                        if p_current and "permissions" in p_current:
                            can_chat = p_current["permissions"].get("canChat", True)
                        
                        # Check Global Lock
                        if meeting.get("settings", {}).get("is_chat_locked"):
                             can_chat = False
                             print("DEBUG: Chat is globally locked.")

                    # Hosts override locks
                    if user_role in ["host", "co-host"]:
                        can_chat = True
                        print("DEBUG: Host override active.")

                    if not can_chat:
                         print(f"DEBUG: Message rejected due to lock/permissions for {user_id}")
                         await manager.send_personal_message(json.dumps({
                             "type": "error",
                             "message": "Chat is disabled for you."
                         }), websocket)
                         continue

                    print(f"DEBUG: Message accepted from {user_id}. Inserting to DB...")


                    # Construct Conditioned Message
                    content_raw = data_json.get("content", {})
                    
                    # Handle legacy string payloads by converting to structured content
                    if isinstance(content_raw, str):
                        content_data = {"type": "text", "body": content_raw}
                    elif isinstance(content_raw, dict):
                        content_data = content_raw
                        # Ensure basic fields exist
                        if "type" not in content_data: content_data["type"] = "text"
                        if "body" not in content_data: content_data["body"] = data_json.get("text", "")
                    else:
                        content_data = {"type": "text", "body": str(content_raw)}

                    scope = data_json.get("scope", "public")
                    target_id = data_json.get("targetId")

                    chat_msg = {
                        "meeting_id": meeting_id,
                        "sender_id": user_id,
                        "sender_name": user_name,
                        "sender_role": user_role,
                        "timestamp": datetime.utcnow(),
                        "content": content_data, # Expects {type, body, fileUrl...}
                        "scope": scope,
                        "target_id": target_id,
                        "reactions": [],
                        "is_deleted": False,
                        "type": "chat" # Internal discriminator
                    }

                    # Validate Private Message
                    if scope == "private" and not target_id:
                        continue # Invalid

                    # Save to DB
                    try:
                        result = await chat_collection.insert_one(chat_msg)
                        chat_msg["id"] = str(result.inserted_id)
                        chat_msg.pop("_id")
                        chat_msg["timestamp"] = chat_msg["timestamp"].isoformat()

                    except Exception as e:
                         print(f"DB Error: {e}")
                         # Notify client of error
                         await manager.send_personal_message(json.dumps({
                            "type": "error",
                            "message": f"Message save failed: {str(e)}"
                        }), websocket)
                         continue

                    # Broadcast (Targeted)
                    wrapper = {
                        "type": "chat_message",
                        "message": chat_msg
                    }
                    print(f"[Meeting] Broadcasting to {meeting_id}: {wrapper}")
                    await manager.broadcast(json.dumps(wrapper), meeting_id, sender_id=user_id, target_id=target_id if scope == "private" else None)

                # --- 2. CHAT REACTION ---
                elif msg_type == "chat_reaction":
                    # Payload: { type: "chat_reaction", messageId: "...", emoji: "..." }
                    msg_id = data_json.get("messageId")
                    emoji = data_json.get("emoji")
                    
                    if not msg_id or not emoji: continue

                    # Check if user already reacted with this emoji? Toggle logic.
                    # Simple append for now or set logic needs DB aggregation.
                    # Let's check if we can toggle.
                    
                    # For simplicity in Phase 1: Just Add.
                    # Or proper toggle:
                    # print(f"DEBUG: Processing REACTION {emoji} for {msg_id} from {user_id}")
                    
                    try:
                        if not msg_id or not emoji or not ObjectId.is_valid(msg_id): continue
                        
                        existing_msg = await chat_collection.find_one(
                            {"_id": ObjectId(msg_id), "reactions": {"$elemMatch": {"userId": user_id, "emoji": emoji}}}
                        )
                        
                        if existing_msg:
                            print("DEBUG: Removing existing reaction")
                            await chat_collection.update_one(
                                {"_id": ObjectId(msg_id)},
                                {"$pull": {"reactions": {"userId": user_id, "emoji": emoji}}}
                            )
                        else:
                            print("DEBUG: Adding new reaction")
                            await chat_collection.update_one(
                                {"_id": ObjectId(msg_id)},
                                {"$push": {"reactions": {"userId": user_id, "emoji": emoji}}}
                            )
                        
                        # Broadcast Update
                        updated_msg = await chat_collection.find_one({"_id": ObjectId(msg_id)})
                        if updated_msg:
                            reactions = updated_msg.get("reactions", [])
                            print(f"DEBUG: Broadcasting reaction update: {len(reactions)} reactions")
                            await manager.broadcast(json.dumps({
                                "type": "chat_reaction_update",
                                "messageId": msg_id,
                                "reactions": reactions
                            }), meeting_id)
                        else:
                             print("DEBUG: Failed to fetch updated message for broadcast")
                             
                    except Exception as e:
                        print(f"DEBUG: REACTION Error: {e}")

                # --- 3. CHAT MODERATION ---
                elif msg_type == "chat_moderation":
                    # Payload: { action: "delete"|"clear"|"lock"|"unlock", targetId: "..." }
                    if user_role not in ["host", "co-host"]:
                        continue # Unauthorized

                    action = data_json.get("action")
                    target_id = data_json.get("targetId")
                    
                    # Audit Log
                    audit_collection = get_collection("audit_logs")
                    await audit_collection.insert_one({
                        "meeting_id": meeting_id,
                        "admin_id": user_id,
                        "action": action,
                        "target_id": target_id,
                        "timestamp": datetime.now(timezone.utc)
                    })

                    system_body = None

                    if action == "delete" and target_id:
                        print(f"DEBUG: Processing DELETE for {target_id} in meeting {meeting_id}")
                        try:
                            oid = ObjectId(target_id)
                            res = await chat_collection.update_one(
                                 {"_id": oid},
                                 {"$set": {"is_deleted": True}}
                            )
                            if res.modified_count > 0:
                                await manager.broadcast(json.dumps({
                                    "type": "chat_message_deleted",
                                    "messageId": target_id
                                }), meeting_id)
                                print(f"DEBUG: DELETE success, broadcast sent.")
                            else:
                                print(f"DEBUG: DELETE failed, doc not found or already deleted.")
                        except Exception as e:
                            print(f"DEBUG: DELETE error: {e}")
                        
                    elif action == "clear":
                        await manager.broadcast(json.dumps({
                            "type": "chat_cleared",
                            "adminId": user_id
                        }), meeting_id)
                        system_body = "Chat history was cleared by host."

                    elif action == "lock_chat":
                         if ObjectId.is_valid(meeting_id):
                             await meetings_collection.update_one(
                                 {"_id": ObjectId(meeting_id)},
                                 {"$set": {"settings.is_chat_locked": True}}
                             )
                         await manager.broadcast(json.dumps({
                             "type": "meeting_settings_updated",
                             "settings": {"is_chat_locked": True}
                         }), meeting_id)
                         system_body = "Chat was locked by host."

                    elif action == "unlock_chat":
                         if ObjectId.is_valid(meeting_id):
                             await meetings_collection.update_one(
                                 {"_id": ObjectId(meeting_id)},
                                 {"$set": {"settings.is_chat_locked": False}}
                             )
                         await manager.broadcast(json.dumps({
                             "type": "meeting_settings_updated",
                             "settings": {"is_chat_locked": False}
                         }), meeting_id)
                         system_body = "Chat was unlocked by host."
                    
                    if system_body:
                        # Broadcast System Message
                        sys_msg = {
                            "meeting_id": meeting_id,
                            "sender_id": "system",
                            "sender_name": "System",
                            "sender_role": "system",
                            "timestamp": datetime.utcnow(),
                            "content": {"type": "system", "body": system_body},
                            "scope": "public",
                            "reactions": [],
                            "is_deleted": False,
                            "type": "chat"
                        }
                        res = await chat_collection.insert_one(sys_msg)
                        sys_msg["id"] = str(res.inserted_id)
                        sys_msg.pop("_id")
                        sys_msg["timestamp"] = sys_msg["timestamp"].isoformat()
                        await manager.broadcast(json.dumps({"type": "chat_message", "message": sys_msg}), meeting_id)


                # --- 4. AUDIO CONTROL (Enterprise) ---
                elif msg_type == "audio_control":
                    action = data_json.get("action")
                    target_id = data_json.get("target_user_id")
                    state = data_json.get("requested_state")
                    
                    # Fetch Meeting & Requester Role
                    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
                    if not meeting: continue
                    
                    # Identify Requester Role
                    requester_role = "guest"
                    if meeting.get("host_id") == user_id:
                        requester_role = "host"
                    else:
                        participants = meeting.get("participants", [])
                        p_req = next((p for p in participants if p.get("user_id") == user_id), None)
                        if p_req: requester_role = p_req.get("role", "guest")
                    
                    is_admin = requester_role in ["host", "co-host"]
                    
                    # 1. SET MUTE STATE
                    if action == "set_mute_state":
                         if not target_id: continue
                         
                         current_settings = meeting.get("settings", {})
                         audio_locked = current_settings.get("audio_locked", False)
                         allowed = False
                         
                         # Case A: Self-Control
                         if target_id == user_id:
                             if state is True: # Mute Self
                                 allowed = True
                             else: # Unmute Self
                                 if audio_locked and not is_admin:
                                     allowed = False
                                     await manager.send_personal_message(json.dumps({
                                         "type": "error",
                                         "message": "Audio is locked by the host."
                                     }), websocket)
                                 else:
                                     allowed = True
                         
                         # Case B: Host Controlling Others
                         else:
                             if is_admin:
                                 if state is True: # Force Mute
                                     allowed = True
                                 else: # Force Unmute
                                     allowed = False
                                     # Send "Request to Unmute" to Target
                                     await manager.broadcast(json.dumps({
                                         "type": "audio_control",
                                         "action": "request_to_unmute",
                                         "requester_id": user_id
                                     }), meeting_id, sender_id=user_id, target_id=target_id)
                                     
                                     await manager.send_personal_message(json.dumps({
                                        "type": "info", 
                                        "message": f"Asked user to unmute."
                                     }), websocket)
                             else:
                                 allowed = False
                        
                         if allowed and ObjectId.is_valid(meeting_id):
                             await meetings_collection.update_one(
                                 {"_id": ObjectId(meeting_id), "participants.user_id": target_id},
                                 {"$set": {"participants.$.isMuted": state}}
                             )
                             await manager.broadcast(json.dumps({
                                 "type": "participant_audio_update",
                                 "user_id": target_id,
                                 "isMuted": state,
                                 "updated_by": user_id
                             }), meeting_id)
                             
                             # Audit Log
                             get_collection("audit_logs").insert_one({
                                 "meeting_id": meeting_id,
                                 "action": "mute_user" if state else "unmute_user",
                                 "actor_id": user_id,
                                 "target_id": target_id,
                                 "timestamp": datetime.now(timezone.utc)
                             })

                    # 2. LOCK AUDIO (Global)
                    elif action == "set_global_lock":
                        if not is_admin: continue
                        
                        locked_state = data_json.get("locked")
                        if ObjectId.is_valid(meeting_id):
                            await meetings_collection.update_one(
                                {"_id": ObjectId(meeting_id)},
                                {"$set": {"settings.audio_locked": locked_state}}
                            )
                        
                        await manager.broadcast(json.dumps({
                            "type": "meeting_settings_update",
                            "settings": {"audio_locked": locked_state},
                            "updated_by": user_id
                        }), meeting_id)
                        
                        get_collection("audit_logs").insert_one({
                                 "meeting_id": meeting_id,
                                 "action": "lock_audio" if locked_state else "unlock_audio",
                                 "actor_id": user_id,
                                 "timestamp": datetime.now(timezone.utc)
                        })

                    # 3. MUTE ALL
                    elif action == "mute_all":
                         if not is_admin: continue
                         
                         if ObjectId.is_valid(meeting_id):
                             await meetings_collection.update_one(
                                 {"_id": ObjectId(meeting_id)},
                                 {"$set": {"participants.$[elem].isMuted": True}},
                                 array_filters=[{"elem.user_id": {"$ne": user_id}}]
                             )
                         
                         await manager.broadcast(json.dumps({
                             "type": "participant_audio_update_bulk",
                             "action": "mute_all",
                             "except_user": user_id,
                             "updated_by": user_id
                         }), meeting_id)
                         
                         get_collection("audit_logs").insert_one({
                                 "meeting_id": meeting_id,
                                 "action": "mute_all",
                                 "actor_id": user_id,
                                 "timestamp": datetime.now(timezone.utc)
                         })

                # --- EXISTING HANDLERS (Preserved) ---

                # --- 5. VIDEO CONTROL (Enterprise) ---
                elif msg_type == "video_control":
                    action = data_json.get("action")
                    target_id = data_json.get("target_user_id")
                    state = data_json.get("requested_state")

                    # Fetch Meeting & Requester Role
                    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
                    if not meeting: continue

                    # Identify Requester Role
                    requester_role = "guest"
                    if meeting.get("host_id") == user_id:
                        requester_role = "host"
                    else:
                        participants = meeting.get("participants", [])
                        p_req = next((p for p in participants if p.get("user_id") == user_id), None)
                        if p_req: requester_role = p_req.get("role", "guest")

                    is_admin = requester_role in ["host", "co-host"]

                    # 1. SET VIDEO STATE
                    if action == "set_video_state":
                         if not target_id: continue

                         current_settings = meeting.get("settings", {})
                         video_locked = current_settings.get("video_locked", False)
                         allowed = False

                         # Case A: Self-Control
                         if target_id == user_id:
                             if state is True: # Turn Video ON
                                 if video_locked and not is_admin:
                                     allowed = False
                                     await manager.send_personal_message(json.dumps({
                                         "type": "error",
                                         "message": "Camera is disabled by the host."
                                     }), websocket)
                                 else:
                                     allowed = True
                             else: # Turn Video OFF
                                 allowed = True

                         # Case B: Host Controlling Others
                         else:
                             if is_admin:
                                 if state is True: # Force ON - FORBIDDEN (Privacy)
                                     allowed = False
                                     # Optional: Send request to enable? 
                                     # For now, strict: "Host cannot force turn on camera"
                                     # We could implement "request_to_enable_video" later if needed.
                                 else: # Force OFF (Stop Video)
                                     allowed = True
                             else:
                                 allowed = False

                         if allowed and ObjectId.is_valid(meeting_id):
                             await meetings_collection.update_one(
                                 {"_id": ObjectId(meeting_id), "participants.user_id": target_id},
                                 {"$set": {"participants.$.is_video_on": state}}
                             )
                             await manager.broadcast(json.dumps({
                                 "type": "participant_video_update",
                                 "user_id": target_id,
                                 "is_video_on": state,
                                 "updated_by": user_id
                             }), meeting_id)

                             # Audit Log
                             get_collection("audit_logs").insert_one({
                                 "meeting_id": meeting_id,
                                 "action": "video_on" if state else "video_off",
                                 "actor_id": user_id,
                                 "target_id": target_id,
                                 "timestamp": datetime.now(timezone.utc)
                             })

                    # 2. LOCK VIDEO (Global)
                    elif action == "set_global_lock":
                        if not is_admin: continue

                        locked_state = data_json.get("locked")
                        if ObjectId.is_valid(meeting_id):
                            await meetings_collection.update_one(
                                {"_id": ObjectId(meeting_id)},
                                {"$set": {"settings.video_locked": locked_state}}
                            )

                        await manager.broadcast(json.dumps({
                            "type": "meeting_settings_update",
                            "settings": {"video_locked": locked_state},
                            "updated_by": user_id
                        }), meeting_id)

                        get_collection("audit_logs").insert_one({
                                 "meeting_id": meeting_id,
                                 "action": "lock_video" if locked_state else "unlock_video",
                                 "actor_id": user_id,
                                 "timestamp": datetime.now(timezone.utc)
                        })

                    # 3. STOP ALL VIDEO
                    elif action == "stop_all_video":
                         if not is_admin: continue

                         if ObjectId.is_valid(meeting_id):
                             await meetings_collection.update_one(
                                 {"_id": ObjectId(meeting_id)},
                                 {"$set": {"participants.$[elem].isVideoOn": False}},
                                 array_filters=[{"elem.user_id": {"$ne": user_id}}] # Except Host
                             )

                         await manager.broadcast(json.dumps({
                             "type": "participant_video_update_bulk",
                             "action": "stop_all_video",
                             "except_user": user_id,
                             "updated_by": user_id
                         }), meeting_id)

                         get_collection("audit_logs").insert_one({
                                 "meeting_id": meeting_id,
                                 "action": "stop_all_video",
                                 "actor_id": user_id,
                                 "timestamp": datetime.now(timezone.utc)
                         })


                # --- SPEAKING DETECTION (Enterprise) ---
                elif msg_type == "participant_speaking":
                    # Client sends: { type: "participant_speaking", is_speaking: true/false }
                    is_speaking = data_json.get("is_speaking", False)
                    
                    # Broadcast to all participants (including sender for confirmation)
                    await manager.broadcast(json.dumps({
                        "type": "participant_speaking",
                        "user_id": user_id,
                        "is_speaking": is_speaking,
                        "timestamp": datetime.utcnow().isoformat()
                    }), meeting_id)
                    
                    print(f"[Speaking] {user_name} is {'speaking' if is_speaking else 'not speaking'}")


                # --- 6. SCREEN SHARE (Enterprise) ---
                elif msg_type == "screen_share":
                    action = data_json.get("action")
                    target_id = data_json.get("target_user_id")

                    # Fetch Meeting & Requester Role
                    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
                    if not meeting: continue

                    # Identify Requester Role
                    requester_role = "guest"
                    if meeting.get("host_id") == user_id:
                        requester_role = "host"
                    else:
                        participants = meeting.get("participants", [])
                        p_req = next((p for p in participants if p.get("user_id") == user_id), None)
                        if p_req: requester_role = p_req.get("role", "guest")

                    is_admin = requester_role in ["host", "co-host"]
                    current_active_presenter = meeting.get("active_presenter_id")
                    current_settings = meeting.get("settings", {})
                    screen_share_locked = current_settings.get("screen_share_locked", False)

                    # 1. START SHARE
                    if action == "start_share":
                         # Check 1: Is locked?
                         if screen_share_locked and not is_admin:
                             await manager.send_personal_message(json.dumps({
                                 "type": "error",
                                 "message": "Screen sharing is locked by the host."
                             }), websocket)
                             continue
                         
                         # Check 2: Collision? (Someone else sharing)
                         if current_active_presenter and current_active_presenter != user_id:
                              # If Admin, they can "Take Over" (override)
                              if is_admin:
                                   pass # Allowed to override
                              else:
                                   await manager.send_personal_message(json.dumps({
                                     "type": "error",
                                     "message": "Someone is already sharing."
                                   }), websocket)
                                   continue

                         # Update DB
                         if ObjectId.is_valid(meeting_id):
                             await meetings_collection.update_one(
                                 {"_id": ObjectId(meeting_id)},
                                 {"$set": {"active_presenter_id": user_id}}
                             )
                         
                         # Broadcast
                         await manager.broadcast(json.dumps({
                             "type": "screen_share_update",
                             "active_presenter_id": user_id,
                             "updated_by": user_id
                         }), meeting_id)
                         
                         get_collection("audit_logs").insert_one({
                                 "meeting_id": meeting_id,
                                 "action": "start_screen_share",
                                 "actor_id": user_id,
                                 "timestamp": datetime.now(timezone.utc)
                         })

                    # 2. STOP SHARE (Self or Host Force)
                    elif action == "stop_share":
                         # Only current presenter or Admin can stop
                         if (current_active_presenter == user_id or is_admin) and ObjectId.is_valid(meeting_id):
                             await meetings_collection.update_one(
                                 {"_id": ObjectId(meeting_id)},
                                 {"$set": {"active_presenter_id": None}}
                             )
                            
                             await manager.broadcast(json.dumps({
                                 "type": "screen_share_update",
                                 "active_presenter_id": None,
                                 "updated_by": user_id
                             }), meeting_id)

                    # 3. FORCE STOP (Host Only - Explicit Target)
                    elif action == "force_stop_share":
                         if is_admin and ObjectId.is_valid(meeting_id):
                             await meetings_collection.update_one(
                                 {"_id": ObjectId(meeting_id)},
                                 {"$set": {"active_presenter_id": None}}
                             )
                        
                             await manager.broadcast(json.dumps({
                                 "type": "screen_share_update",
                                 "active_presenter_id": None,
                                 "updated_by": user_id
                             }), meeting_id)
                        
                             get_collection("audit_logs").insert_one({
                                     "meeting_id": meeting_id,
                                     "action": "force_stop_screen_share",
                                     "actor_id": user_id,
                                     "timestamp": datetime.now(timezone.utc)
                             })

                    # 4. GLOBAL LOCK
                    elif action == "set_global_lock":
                        if not is_admin: continue

                        locked_state = data_json.get("locked")
                        if ObjectId.is_valid(meeting_id):
                            await meetings_collection.update_one(
                                {"_id": ObjectId(meeting_id)},
                                {"$set": {"settings.screen_share_locked": locked_state}}
                            )

                        await manager.broadcast(json.dumps({
                            "type": "meeting_settings_update",
                            "settings": {"screen_share_locked": locked_state},
                            "updated_by": user_id
                        }), meeting_id)
                        
                        get_collection("audit_logs").insert_one({
                                 "meeting_id": meeting_id,
                                 "action": "lock_screen_share" if locked_state else "unlock_screen_share",
                                 "actor_id": user_id,
                                 "timestamp": datetime.now(timezone.utc)
                        })

                # --- 7. WEBRTC SIGNALING RELAY ---
                elif msg_type == "webrtc_signal":
                    # Simply relay WebRTC signals between peers
                    to_user_id = data_json.get("to_user_id")
                    from_user_id = data_json.get("from_user_id")
                    signal = data_json.get("signal")
                    
                    if to_user_id and from_user_id and signal:
                        # Send to specific target user
                        await manager.broadcast(json.dumps({
                            "type": "webrtc_signal",
                            "from_user_id": from_user_id,
                            "signal": signal
                        }), meeting_id, sender_id=from_user_id, target_id=to_user_id)
                        
                        # Log for debugging
                        print(f"[WebRTC] Relayed signal from {from_user_id} to {to_user_id}")
                    else:
                        print(f"[WebRTC] Invalid signal message: missing fields")

                elif msg_type == "end_meeting":
                    # ... (Existing Logic)
                    meeting = None
                    if ObjectId.is_valid(meeting_id):
                        meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
                    if not meeting: continue
                    if meeting.get("host_id") != user_id: continue
                    if ObjectId.is_valid(meeting_id):
                        await meetings_collection.update_one(
                            {"_id": ObjectId(meeting_id)},
                            {"$set": {"status": "ended"}}
                        )
                    await manager.broadcast(json.dumps({"type": "meeting_ended"}), meeting_id)

                elif msg_type == "user_update":
                    # ... (Existing Logic)
                    user_data = data_json.get("data", {})
                    if "isMuted" in user_data and ObjectId.is_valid(meeting_id):
                        await meetings_collection.update_one(
                            {"_id": ObjectId(meeting_id), "participants.user_id": user_id},
                            {"$set": {"participants.$.isMuted": user_data["isMuted"]}}
                        )
                    await manager.broadcast(data, meeting_id)
                
                elif msg_type == "presence_update":
                    # Enterprise Presence Update Handler
                    updates = data_json.get("updates", {})
                    
                    # Update presence in DB
                    success = await update_participant_presence(meeting_id, user_id, updates)
                    
                    if success:
                        # Broadcast to all participants
                        await manager.broadcast(json.dumps({
                            "type": "participant_update",
                            "user_id": user_id,
                            "updates": updates
                        }), meeting_id)
                        
                        print(f"[Presence] Updated {user_id}: {updates}")

                elif msg_type == "participant_action":
                    # Enterprise Host Controls Logic (Preserved)
                    # We just need to make sure we use the updated manager logic/broadcast
                    action = data_json.get("action")
                    target_id = data_json.get("targetId")
                    value = data_json.get("value")

                    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
                    if not meeting: continue
                    
                    participants = meeting.get("participants", [])
                    actor = next((p for p in participants if p.get("user_id") == user_id), None)
                    actor_role = actor.get("role", "guest") if actor else "guest"
                    is_creator = meeting.get("host_id") == user_id
                    is_admin = is_creator or actor_role in ["host", "co-host"]

                    if not is_admin: continue
                    
                    # ... (Rest of logic truncated for brevity match, assume standard logic applies)
                    # For safety, I will re-paste the crucial participant action blocks to ensure no regression.
                    
                    update_op = None
                    if action == "mute_participant": update_op = {"$set": {"participants.$.isMuted": True}}
                    elif action == "remove_participant":
                         if ObjectId.is_valid(meeting_id):
                             await meetings_collection.update_one({"_id": ObjectId(meeting_id)}, {"$pull": {"participants": {"user_id": target_id}}})
                         await manager.broadcast(json.dumps({"type": "participant_removed", "targetId": target_id}), meeting_id)
                         continue
                    # ... (Other cases same as before) 
                    elif action == "lock_chat": update_op = {"$set": {"participants.$.permissions.canChat": False}}
                    elif action == "unlock_chat": update_op = {"$set": {"participants.$.permissions.canChat": True}}
                    # ... (etc)
                    
                    # Just passing through for brevity in this replacement block, but in reality I MUST include them.
                    # Since I am replacing the WHOLE function, I must check the previous file content (lines 139-248).
                    # I will try to preserve it accurately.
                    
                    # SIMPLIFICATION: I will re-implement the participant_action block fully to avoid errors.
                    
                    if action == "mute_participant": update_op = {"$set": {"participants.$.isMuted": True}}
                    elif action == "stop_video": update_op = {"$set": {"participants.$.isVideoOn": False}}
                    elif action == "lock_mic": update_op = {"$set": {"participants.$.permissions.canUnmute": False}}
                    elif action == "unlock_mic": update_op = {"$set": {"participants.$.permissions.canUnmute": True}}
                    elif action == "lock_camera": update_op = {"$set": {"participants.$.permissions.canShareVideo": False}}
                    elif action == "unlock_camera": update_op = {"$set": {"participants.$.permissions.canShareVideo": True}}
                    elif action == "lock_screen_share": update_op = {"$set": {"participants.$.permissions.canShareScreen": False}}
                    elif action == "unlock_screen_share": update_op = {"$set": {"participants.$.permissions.canShareScreen": True}}
                    elif action == "lock_chat": update_op = {"$set": {"participants.$.permissions.canChat": False}}
                    elif action == "unlock_chat": update_op = {"$set": {"participants.$.permissions.canChat": True}}
                    elif action == "lock_reactions": update_op = {"$set": {"participants.$.permissions.canUseReactions": False}}
                    elif action == "unlock_reactions": update_op = {"$set": {"participants.$.permissions.canUseReactions": True}}
                    elif action == "send_to_waiting_room": update_op = {"$set": {"participants.$.status": "waiting"}}
                    elif action == "admit_participant": update_op = {"$set": {"participants.$.status": "active"}}
                    
                    if update_op and target_id and ObjectId.is_valid(meeting_id):
                        await meetings_collection.update_one(
                            {"_id": ObjectId(meeting_id), "participants.user_id": target_id},
                            update_op
                        )
                        await manager.broadcast(json.dumps({
                            "type": "participant_updated",
                            "action": action,
                            "targetId": target_id,
                            "value": value
                        }), meeting_id)
                    
                else:
                    await manager.broadcast(data, meeting_id)
                
            except json.JSONDecodeError:
                pass
            except Exception as e:
                print(f"WebSocket Error: {e}")
                import traceback
                traceback.print_exc()
                try:
                    await manager.send_personal_message(json.dumps({
                        "type": "error",
                        "message": f"Server Error: {str(e)}"
                    }), websocket)
                except:
                    pass
                
    except WebSocketDisconnect:
        await manager.disconnect(websocket, meeting_id)
        
        # Remove participant presence (enterprise model)
        await remove_participant_presence(meeting_id, user_id)

        # Broadcast participant_left event
        await manager.broadcast(json.dumps({
            "type": "participant_left",
            "user_id": user_id
        }), meeting_id)

        # System Message: Leave
        chat_collection = get_collection("chat_messages")
        sys_msg = {
            "meeting_id": meeting_id,
            "sender_id": "system",
            "sender_name": "System",
            "sender_role": "system",
            "timestamp": datetime.utcnow(),
            "content": {"type": "system", "body": f"{user_name} left the meeting."},
            "scope": "public",
            "reactions": [],
            "is_deleted": False,
            "type": "chat"
        }
        res = await chat_collection.insert_one(sys_msg)
        sys_msg["id"] = str(res.inserted_id)
        sys_msg.pop("_id")
        sys_msg["timestamp"] = sys_msg["timestamp"].isoformat()
        await manager.broadcast(json.dumps({"type": "chat_message", "message": sys_msg}), meeting_id)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        import traceback
        traceback.print_exc() 
        await manager.disconnect(websocket, meeting_id)
        try:
            await websocket.close(code=1011)
        except:
            pass
