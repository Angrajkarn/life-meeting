import requests
import json
import asyncio
import websockets
from datetime import datetime

# Configuration
API_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws/dashboard/test_user"
MESSAGE_ID = "698aebe0d449026978c5b582" # From the error report

async def test_reactions():
    # 1. Connect to WebSocket to listen for updates
    try:
        websocket = await websockets.connect(WS_URL)
        print(f"Connected to {WS_URL}")
        
        # Consume initial messages
        await websocket.recv() # participant_joined
        await websocket.recv() # participant_list
    except Exception as e:
        print(f"WS Connection failed: {e}")
        return

    # 2. Send Reaction via HTTP
    print(f"Testing POST {API_URL}/chat/messages/{MESSAGE_ID}/reactions")
    # We expect a 401 Unauthorized if no token is provided, which is BETTER than 404 Not Found
    try:
        response = requests.post(f"{API_URL}/chat/messages/{MESSAGE_ID}/reactions", json={"emoji": "❤️"})
        
        if response.status_code == 404:
            print("FAILED: Endpoint still returns 404")
        elif response.status_code == 401:
            print("STATUS: 401 Unauthorized (Expected as we didn't provide a token)")
            print("REASON: Endpoint exists but requires authentication.")
        else:
            print(f"Status: {response.status_code}")
            print(f"Body: {response.text}")
    except Exception as e:
        print(f"HTTP Request failed: {e}")

    await websocket.close()

if __name__ == "__main__":
    asyncio.run(test_reactions())
