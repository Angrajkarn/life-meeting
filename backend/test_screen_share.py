import asyncio
import websockets
import json
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime

# DB Config
MONGO_DETAILS = "mongodb://localhost:27017"
DB_NAME = "life_meeting"

async def setup_test_data():
    client = AsyncIOMotorClient(MONGO_DETAILS)
    db = client[DB_NAME]
    
    # Create valid ObjectId for meeting
    meeting_id = str(ObjectId())
    host_id = "host-user" # Can be any string if not ObjectId for user, but better use ObjectId usually. 
    # Backend routes/websocket use ObjectId(user_id) CHECK logic.
    # line 27 in websocket.py: if ObjectId.is_valid(user_id): ...
    host_user_id = str(ObjectId())
    guest_user_id = str(ObjectId())
    
    print(f"Setting up test data...")
    print(f"Meeting ID: {meeting_id}")
    print(f"Host ID: {host_user_id}")
    print(f"Guest ID: {guest_user_id}")

    # Insert Meeting
    meeting_doc = {
        "_id": ObjectId(meeting_id),
        "code": "test-screen-share",
        "host_id": host_user_id,
        "participants": [],
        "settings": {
            "screen_share_locked": False,
            "video_locked": False,
            "audio_locked": False
        },
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    
    await db.meetings.insert_one(meeting_doc)
    
    # Insert Host User (Optional but good for name resolution)
    await db.users.insert_one({"_id": ObjectId(host_user_id), "full_name": "Test Host", "email": "host@test.com"})
    await db.users.insert_one({"_id": ObjectId(guest_user_id), "full_name": "Test Guest", "email": "guest@test.com"})
    
    return meeting_id, host_user_id, guest_user_id, client

async def cleanup_test_data(client, meeting_id, host_id, guest_id):
    db = client[DB_NAME]
    await db.meetings.delete_one({"_id": ObjectId(meeting_id)})
    await db.users.delete_one({"_id": ObjectId(host_id)})
    await db.users.delete_one({"_id": ObjectId(guest_id)})
    client.close()
    print("Cleanup complete.")

async def test_screen_share_flow():
    meeting_id, host_id, guest_id, db_client = await setup_test_data()
    
    base_uri = "ws://127.0.0.1:8000/ws"
    uri_host = f"{base_uri}/{meeting_id}/{host_id}"
    uri_guest = f"{base_uri}/{meeting_id}/{guest_id}"

    print(f"Connecting Host: {uri_host}")
    print(f"Connecting Guest: {uri_guest}")

    try:
        async with websockets.connect(uri_host) as ws_host, websockets.connect(uri_guest) as ws_guest:
            # 1. Initial Join
            print("\n--- 1. Initial Join ---")
            # Consume initial messages (user_joined for self + storage of history?)
            # Usually: 
            # 1. Connection established.
            # 2. Host receives "user_joined" for themselves? No, broadcast to others.
            # But here we connect concurrently?
            # Let's just wait a bit and consume messages until we see "user_joined" for the other party.
            
            # Host joins first (conceptually)
            # Guest joins. Host gets "user_joined" for guest.
            
            # Since we connect in parallel Context Manager, connection order is roughly simultaneous.
            # We must be prepared to read initial messages.
            
            # Lets just wait 1 sec to stabilize
            await asyncio.sleep(1)
            
            # Flush buffers
            while True:
                try:
                    msg = await asyncio.wait_for(ws_host.recv(), timeout=0.5)
                    print(f"Host Buffer: {msg}")
                except asyncio.TimeoutError:
                    break
            
            while True:
                try:
                    msg = await asyncio.wait_for(ws_guest.recv(), timeout=0.5)
                    print(f"Guest Buffer: {msg}")
                except asyncio.TimeoutError:
                    break
            
            print("Buffers flushed. Starting Sequence.")

            # 2. Host Starts Share
            print("\n--- 2. Host Starts Share ---")
            start_msg = {
                "type": "screen_share",
                "action": "start_share",
                "target_user_id": host_id
            }
            await ws_host.send(json.dumps(start_msg))
            
            # Verify Broadcast
            # Both should receive
            resp_host = json.loads(await ws_host.recv())
            resp_guest = json.loads(await ws_guest.recv())
            
            print(f"Host received: {resp_host}")
            print(f"Guest received: {resp_guest}")
            
            assert resp_host.get("type") == "screen_share_update"
            assert resp_host.get("active_presenter_id") == host_id
            assert resp_guest.get("type") == "screen_share_update"
            assert resp_guest.get("active_presenter_id") == host_id
            print("✅ Host started share successfully.")

            # 3. Guest Tries to Share (Collision)
            print("\n--- 3. Guest Tries to Share (Collision) ---")
            guest_start = {
                "type": "screen_share",
                "action": "start_share",
                "target_user_id": guest_id
            }
            await ws_guest.send(json.dumps(guest_start))
            
            # Guest receives error
            err_guest = json.loads(await ws_guest.recv())
            print(f"Guest received: {err_guest}")
            assert err_guest["type"] == "error"
            assert "already sharing" in err_guest["message"]
            print("✅ Guest blocked from colliding.")

            # 4. Host Stops Share
            print("\n--- 4. Host Stops Share ---")
            stop_msg = {
                "type": "screen_share",
                "action": "stop_share",
                "target_user_id": host_id
            }
            await ws_host.send(json.dumps(stop_msg))
            
            resp_host = json.loads(await ws_host.recv())
            resp_guest = json.loads(await ws_guest.recv())
            assert resp_guest["active_presenter_id"] is None
            print("✅ Host stopped share.")

            # 5. Host Locks Screen Share
            print("\n--- 5. Host Locks Screen Share ---")
            lock_msg = {
                "type": "screen_share",
                "action": "set_global_lock",
                "locked": True
            }
            await ws_host.send(json.dumps(lock_msg))
            
            # Receive settings update
            resp_host = json.loads(await ws_host.recv())
            resp_guest = json.loads(await ws_guest.recv())
            
            print(f"Guest received update: {resp_guest}")
            assert resp_guest["type"] == "meeting_settings_update"
            assert resp_guest["settings"]["screen_share_locked"] is True
            print("✅ Screen share locked.")

            # 6. Guest Tries to Share (Locked)
            print("\n--- 6. Guest Tries to Share (Locked) ---")
            await ws_guest.send(json.dumps(guest_start))
            err_guest = json.loads(await ws_guest.recv())
            print(f"Guest received: {err_guest}")
            assert err_guest["type"] == "error"
            assert "locked" in err_guest["message"]
            print("✅ Guest blocked by lock.")

            # 7. Host Unlocks
            print("\n--- 7. Host Unlocks ---")
            unlock_msg = {
                "type": "screen_share",
                "action": "set_global_lock",
                "locked": False
            }
            await ws_host.send(json.dumps(unlock_msg))
            await ws_host.recv() # Update
            await ws_guest.recv() # Update
            print("✅ Unlocked.")

            # 8. Guest Starts Share
            print("\n--- 8. Guest Starts Share ---")
            await ws_guest.send(json.dumps(guest_start))
            # Guest receives update (broadcast)
            # Host receives update (broadcast)
            resp_guest = json.loads(await ws_guest.recv())
            resp_host = json.loads(await ws_host.recv())
            
            assert resp_guest["type"] == "screen_share_update"
            assert resp_guest["active_presenter_id"] == guest_id
            print("✅ Guest started share.")

            # 9. Host Force Stops Guest
            print("\n--- 9. Host Force Stops Guest ---")
            force_stop = {
                "type": "screen_share",
                "action": "force_stop_share"
            }
            await ws_host.send(json.dumps(force_stop))
            
            resp_host = json.loads(await ws_host.recv())
            resp_guest = json.loads(await ws_guest.recv())
            assert resp_guest["active_presenter_id"] is None
            print("✅ Host force stopped guest.")

        print("\n🎉 All Screen Share Tests Passed!")

    except Exception as e:
        print(f"Test Execution Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await cleanup_test_data(db_client, meeting_id, host_id, guest_id)

if __name__ == "__main__":
    try:
        asyncio.run(test_screen_share_flow())
    except Exception as e:
        print(f"Setup/Run Failed: {e}")
        sys.exit(1)
