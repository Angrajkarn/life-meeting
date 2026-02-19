import asyncio
import websockets
import json
import uuid
import requests
import time

API_URL = "http://localhost:8002"
WS_URL = "ws://localhost:8002/ws"

try:
    from pymongo import MongoClient
    from bson.objectid import ObjectId
except ImportError:
    print("pymongo not installed. Please install it.")
    exit(1)

MONGO_DETAILS = "mongodb://localhost:27017"
MEETING_ID = "507f1f77bcf86cd799439011"

def create_meeting():
    print("Ensuring Test Meeting exists in DB...")
    client = MongoClient(MONGO_DETAILS)
    db = client["life_meeting"]
    meetings_col = db["meetings"]
    
    # Check if exists
    existing = meetings_col.find_one({"_id": ObjectId(MEETING_ID)})
    if not existing:
        meeting_doc = {
            "_id": ObjectId(MEETING_ID),
            "host_id": "test_host",
            "title": "Persistence Test Meeting",
            "status": "scheduled",
            "participants": [],
            "settings": {"is_chat_locked": False},
            "created_at": time.time()
        }
        meetings_col.insert_one(meeting_doc)
        print(f"Inserted meeting {MEETING_ID}")
    else:
        print(f"Meeting {MEETING_ID} already exists.")

async def send_msg():
    print(f"Testing Chat Persistence for Meeting: {MEETING_ID}")
    
    # 1. Connect and Send Message
    user_id = f"user_{uuid.uuid4().hex[:8]}"
    uri = f"{WS_URL}/{MEETING_ID}/{user_id}?name=PersistenceTester&role=guest"
    
    test_content = f"Persistence Check {uuid.uuid4().hex}"
    
    try:
        async with websockets.connect(uri) as ws:
            # Send Message
            payload = {
                "type": "chat_message",
                "scope": "public",
                "content": {
                    "type": "text", 
                    "body": test_content
                }
            }
            await ws.send(json.dumps(payload))
            print(f"Sent message: {test_content}")
            
            # Listen for Debug/Error
            try:
                while True:
                    msg = await asyncio.wait_for(ws.recv(), timeout=3.0)
                    data = json.loads(msg)
                    print(f"WS Received: {data}")
                    if data.get("type") == "debug" or data.get("type") == "error":
                        break
            except asyncio.TimeoutError:
                print("WS Timeout: No debug response received.")
            
            return test_content
            
    except Exception as e:
        print(f"WebSocket Error: {e}")
        return None

def check_history(expected_content):
    # 2. Fetch History via HTTP
    if not expected_content: return
    
    print("Fetching Chat History via HTTP...")
    resp = requests.get(f"{API_URL}/meetings/{MEETING_ID}/chat")
    
    if resp.status_code != 200:
        print(f"Failed to fetch history: {resp.status_code} {resp.text}")
        return
    
    history = resp.json()
    print(f"Retrieved {len(history)} messages.")
    
    # 3. Verify Message is present
    found = False
    for msg in history:
        if msg.get("content", {}).get("body") == expected_content:
            found = True
            break
            
    if found:
        print("SUCCESS: Message found in history! Persistence confirmed.")
    else:
        print("FAILURE: Message NOT found in history.")
        print("Last few messages:", [m.get("content", {}).get("body") for m in history[-5:]])

if __name__ == "__main__":
    content = asyncio.run(send_msg())
    if content:
        check_history(content)
