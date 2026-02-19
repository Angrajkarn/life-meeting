
import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/ws/dashboard/test_user"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            # The server sends participant_joined and participant_list on connect
            for _ in range(2):
                response = await websocket.recv()
                print(f"Received: {response}")
            
            # Try sending a chat message to a channel
            msg = {
                "type": "chat:message",
                "channel_id": "65cad5e3d82d5d6d3cbd3c3c", # Valid-looking ObjectId
                "text": "Hello from test script"
            }
            await websocket.send(json.dumps(msg))
            print("Sent chat message")
            
            # Wait for any errors
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"Received after msg: {response}")
            except asyncio.TimeoutError:
                print("No immediate response after message (expected if no other users)")
                
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
