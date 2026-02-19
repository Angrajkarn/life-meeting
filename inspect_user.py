import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

async def inspect_user(user_id):
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["life_meeting"]
    col = db["users"]
    
    print(f"--- Inspecting User {user_id} ---")
    user = await col.find_one({"_id": ObjectId(user_id)})
    if user:
        for k, v in user.items():
            print(f"{k}: {v} (Type: {type(v)})")
    else:
        print("User not found")

if __name__ == "__main__":
    asyncio.run(inspect_user("698a39ece4790fc0a5129738"))
