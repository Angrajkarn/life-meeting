import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

MONGO_DETAILS = "mongodb://localhost:27017"

async def create_meeting():
    try:
        # Create a fresh client inside the loop
        client = AsyncIOMotorClient(MONGO_DETAILS)
        database = client["life_meeting"]
        collection = database["meetings"]
        
        meeting = {
            "title": "Lobby System Test",
            "description": "Test meeting for the new pre-join lobby features",
            "start_time": datetime.utcnow(),
            "host_id": "test_host", 
            "lobby_config": {
                "mute_on_entry": True,
                "camera_on_entry": False,
                "waiting_room_enabled": True,
                "video_locked": False,
                "audio_locked": False
            },
            "participants": [],
            "waiting_room": [],
            "created_at": datetime.utcnow()
        }
        
        result = await collection.insert_one(meeting)
        
        url = f"http://localhost:3000/meeting/lobby/{str(result.inserted_id)}"
        
        print(f"\n============================================")
        print(f"✅ Test Meeting Created Successfully!")
        print(f"Meeting ID: {str(result.inserted_id)}")
        print(f"Test URL:   {url}")
        print(f"============================================")
        
        with open("test_meeting_url.txt", "w") as f:
            f.write(url)
            
    except Exception as e:
        print(f"Error creating meeting: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    asyncio.run(create_meeting())
