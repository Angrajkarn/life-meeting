import asyncio
import websockets
import json
import time

WS_URL = "ws://localhost:8004/ws" # Targeting the port I opened earlier
MEETING_ID = "507f1f77bcf86cd799439011"
USER_ID = "user_tester"

async def test_innovations():
    uri = f"{WS_URL}/{MEETING_ID}/{USER_ID}"
    print(f"Connecting to {uri}")
    
    async with websockets.connect(uri) as websocket:
        # 1. Test Markdown Content
        print("\n--- Testing Markdown ---")
        msg = {
            "type": "chat_message",
            "content": {
                "type": "text",
                "body": "Hello **World** with *Style*"
            },
            "scope": "public"
        }
        await websocket.send(json.dumps(msg))
        print("Sent Markdown Message")
        
        # 2. Test Reaction Rate Limit
        print("\n--- Testing Reaction Rate Limit ---")
        # Spam 70 reactions (Limit is 60/min)
        for i in range(70):
            reaction = {
                "type": "chat_reaction",
                "messageId": "dummy_msg_id",
                "emoji": "👍"
            }
            await websocket.send(json.dumps(reaction))
            if i % 10 == 0: print(f"Sent {i} reactions...")
        
        print("Finished sending reactions. Listening for responses...")
        
        # Listen for Error
        start_time = time.time()
        error_received = False
        
        while time.time() - start_time < 5:
            try:
                response = await websocket.recv()
                data = json.loads(response)
                
                if data.get("type") == "error":
                    print(f"SUCCESS: Received Error: {data.get('message')}")
                    error_received = True
                    break
                elif data.get("type") == "chat_message":
                    body = data["message"]["content"]["body"]
                    if "**World**" in body:
                        print(f"Received Echo: {body}")
            except Exception as e:
                print(f"Socket error: {e}")
                break
        
        if not error_received:
            print("FAILURE: Did not receive rate limit error.")

if __name__ == "__main__":
    asyncio.run(test_innovations())
