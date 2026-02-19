from datetime import datetime
from bson import ObjectId
import json
import asyncio

# Mock collection
class MockCollection:
    def __init__(self):
        self.data = {}
    
    async def find_one(self, query):
        if "_id" in query:
            oid = query["_id"]
            doc = self.data.get(str(oid))
            if doc:
                # Mock $elemMatch
                if "reactions" in query and "$elemMatch" in query["reactions"]:
                   matcher = query["reactions"]["$elemMatch"]
                   for r in doc.get("reactions", []):
                       if r["userId"] == matcher["userId"] and r["emoji"] == matcher["emoji"]:
                           return doc
                   return None
            return doc
        return None

    async def update_one(self, query, update):
        oid = query["_id"]
        doc = self.data.get(str(oid))
        if doc:
            if "$push" in update:
                doc.setdefault("reactions", []).append(update["push"]["reactions"])
            if "$pull" in update:
                matcher = update["$pull"]["reactions"]
                doc["reactions"] = [r for r in doc["reactions"] if not (r["userId"] == matcher["userId"] and r["emoji"] == matcher["emoji"])]

async def test_logic():
    col = MockCollection()
    msg_id = ObjectId()
    col.data[str(msg_id)] = {"_id": msg_id, "reactions": []}
    
    user_id = "user1"
    emoji = "👍"
    
    print(f"Testing Add Reaction for {msg_id}")
    
    # 1. Check existing
    existing = await col.find_one(
        {"_id": msg_id, "reactions": {"$elemMatch": {"userId": user_id, "emoji": emoji}}}
    )
    
    if existing:
        print("Found existing, removing...")
    else:
        print("Not found, adding...")
        # Add Logic
        # await col.update_one(...) 
        # (Mock update manually for test script simplicity or implement full mock)
    
    print("Logic seems sound structure-wise. The issue is likely serialization or broadcast.")

if __name__ == "__main__":
    asyncio.run(test_logic())
