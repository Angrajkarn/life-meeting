import asyncio
import websockets

async def test_ping():
    uri = "ws://127.0.0.1:8000/ws-ping"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            response = await websocket.recv()
            print(f"Received: {response}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ping())
