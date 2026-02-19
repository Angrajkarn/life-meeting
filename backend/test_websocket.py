import asyncio
import websockets
import json

async def test_connection():
    uri = "ws://127.0.0.1:8000/ws/test-meeting/test-user"
    print(f"Attempting to connect to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            
            # Wait for join message
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Send a chat message
            msg = {
                "type": "chat",
                "content": "Hello from test script!",
                "sender_name": "Test Bot"
            }
            await websocket.send(json.dumps(msg))
            print("Sent test message")
            
            # Wait for echo
            response = await websocket.recv()
            print(f"Received echo: {response}")
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
