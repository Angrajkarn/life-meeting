from backend.models import ChatMessage, ChatContent
from datetime import datetime, timezone

def test_serialization():
    msg = ChatMessage(
        channel_id="test",
        sender_id="user1",
        sender_name="Test User",
        content=ChatContent(type="text", body="Hello"),
        timestamp=datetime.now(timezone.utc)
    )
    
    json_data = msg.json()
    print(f"Serialized Message: {json_data}")
    
    if "+00:00" in json_data or "Z" in json_data:
        print("SUCCESS: Timezone offset found in serialized JSON.")
    else:
        print("FAILURE: No timezone offset found in serialized JSON.")

if __name__ == "__main__":
    test_serialization()
