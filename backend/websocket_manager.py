from fastapi import WebSocket
from typing import List, Dict
import json
from bson import ObjectId

class ConnectionManager:
    def __init__(self):
        # active_connections: meeting_id -> List[{'ws': WebSocket, 'user_id': str}]
        self.active_connections: Dict[str, List[dict]] = {}
        # user_sessions: user_id -> List[WebSocket] (Global tracking)
        self.user_sessions: Dict[str, List[WebSocket]] = {}
        # presence: user_id -> status
        self.presence: Dict[str, str] = {}
        # typing: channel_id -> set of user_ids
        self.typing: Dict[str, set] = {}

    async def connect(self, websocket: WebSocket, meeting_id: str, user_id: str):
        try:
            print(f"[Manager] Accepting WebSocket for user '{user_id}' in meeting '{meeting_id}'")
            await websocket.accept()
            
            # Meeting tracking
            if meeting_id not in self.active_connections:
                self.active_connections[meeting_id] = []
            self.active_connections[meeting_id].append({"ws": websocket, "user_id": user_id})
            
            # User tracking (Global)
            if user_id not in self.user_sessions:
                self.user_sessions[user_id] = []
                
                # Fetch persisted status from DB
                # Fetch persisted status from DB
                from backend.database import get_collection
                users_collection = get_collection("users")
                
                db_status = "available"
                if ObjectId.is_valid(user_id):
                    user = await users_collection.find_one({"_id": ObjectId(user_id)})
                    if user:
                        db_status = user.get("status", "available")
                
                # First session? Mark with DB status
                await self.update_presence(user_id, db_status)
            
            self.user_sessions[user_id].append(websocket)
            
            print(f"[Manager] Connection registered. Total meeting connections '{meeting_id}': {len(self.active_connections[meeting_id])}")
        except Exception as e:
            print(f"[Manager] ERROR during connection: {e}")
            raise

    async def update_presence(self, user_id: str, status: str):
        self.presence[user_id] = status
        # Broadcast presence update to everyone (Simplified for now)
        msg = json.dumps({
            "type": "chat:presence",
            "data": {"user_id": user_id, "status": status}
        })
        # Notify all active users
        for uid in self.user_sessions:
            await self.notify_user(uid, msg)

    async def set_typing(self, channel_id: str, user_id: str, is_typing: bool):
        if channel_id not in self.typing:
            self.typing[channel_id] = set()
        
        if is_typing:
            self.typing[channel_id].add(user_id)
        else:
            self.typing[channel_id].discard(user_id)
            
        # Broadcast typing status to channel
        msg = json.dumps({
            "type": "chat:typing",
            "data": {
                "channel_id": channel_id,
                "user_id": user_id,
                "is_typing": is_typing,
                "active_typists": list(self.typing[channel_id])
            }
        })
        await self.broadcast_to_channel(channel_id, msg)

    async def disconnect(self, websocket: WebSocket, meeting_id: str):
        # Remove from meeting connections
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id] = [
                conn for conn in self.active_connections[meeting_id] 
                if conn["ws"] != websocket
            ]
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]
        
        # Remove from user global sessions
        target_uid = None
        for uid in list(self.user_sessions.keys()):
            self.user_sessions[uid] = [ws for ws in self.user_sessions[uid] if ws != websocket]
            if not self.user_sessions[uid]:
                del self.user_sessions[uid]
                target_uid = uid
                # Last session? Mark offline
                await self.update_presence(uid, "offline")
                break
        
    async def broadcast_to_channel(self, channel_id: str, message: str):
        """
        Broadcasts a message to all members of a channel who are currently online.
        In a real app, we'd fetch members from DB.
        """
        from backend.database import get_collection
        channels_collection = get_collection("channels")
        channel = await channels_collection.find_one({"_id": ObjectId(channel_id)})
        
        if channel:
            members = channel.get("members", [])
            for member_id in members:
                await self.notify_user(member_id, message)

    async def broadcast(self, message: str, meeting_id: str, sender_id: str = None, target_id: str = None):
        if meeting_id in self.active_connections:
            dead_connections = []
            for conn in self.active_connections[meeting_id]:
                ws = conn["ws"]
                uid = conn["user_id"]
                try:
                    if target_id:
                        if uid == target_id or uid == sender_id:
                            await ws.send_text(message)
                    else:
                        await ws.send_text(message)
                except Exception as e:
                    print(f"[Manager] Error sending message to user '{uid}' in meeting '{meeting_id}': {e}")
                    dead_connections.append(ws)
            
            for ws in dead_connections:
                await self.disconnect(ws, meeting_id)

    async def notify_user(self, user_id: str, message: str):
        if user_id in self.user_sessions:
            dead_sockets = []
            # Copy list to avoid concurrent modification
            for ws in list(self.user_sessions[user_id]):
                try:
                    await ws.send_text(message)
                except Exception as e:
                    print(f"[Manager] Error notifying user '{user_id}': {e}")
                    dead_sockets.append(ws)
            
            for ws in dead_sockets:
                # To disconnect properly, we'd need meeting_id.
                # However, notify_user is used globally.
                # We'll search for the meeting_id associated with this ws.
                meeting_to_remove = None
                for mid, conns in self.active_connections.items():
                    if any(c["ws"] == ws for c in conns):
                        meeting_to_remove = mid
                        break
                
                await self.disconnect(ws, meeting_to_remove or "unknown")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()
