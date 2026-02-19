import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["life_meeting"]
    col = db["users"]
    
    with open("users_dump.txt", "w") as f:
        f.write("--- Users List ---\n")
        users = await col.find().to_list(length=100)
        for user in users:
            f.write(f"ID: {user['_id']}\n")
            for k, v in user.items():
                if k != "_id": f.write(f"  {k}: {v}\n")
            f.write("-" * 20 + "\n")

if __name__ == "__main__":
    asyncio.run(check_users())
