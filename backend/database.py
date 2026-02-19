from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import Dict, List, Any
from datetime import datetime

# MongoDB Connection String (Localhost)
MONGO_DETAILS = "mongodb://localhost:27017"

client: AsyncIOMotorClient = None
database = None
USE_MEMORY = False

# In-memory storage
MEMORY_STORE: Dict[str, Dict[str, Any]] = {
    "meetings": {},
    "users": {},
    "recordings": {}
}

async def connect_to_mongo():
    global client, database, USE_MEMORY
    try:
        client = AsyncIOMotorClient(MONGO_DETAILS, serverSelectionTimeoutMS=2000)
        # Test the connection
        await client.server_info()
        database = client["life_meeting"]
        USE_MEMORY = False
        print("MongoDB connected successfully")
    except Exception as e:
        print(f"MongoDB not available: {e}")
        print("Using in-memory storage (data will be lost on restart)")
        database = None
        USE_MEMORY = True

class InMemoryCollection:
    """Simple in-memory collection that mimics MongoDB API"""
    def __init__(self, name: str):
        self.name = name
        self.store = MEMORY_STORE.get(name, {})
        MEMORY_STORE[name] = self.store
        self._id_counter = 1
    
    async def insert_one(self, document: Dict):
        doc_id = str(self._id_counter)
        self._id_counter += 1
        document["_id"] = doc_id
        from datetime import timezone
        document["created_at"] = datetime.now(timezone.utc)
        self.store[doc_id] = document
        
        class Result:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return Result(doc_id)
    
    async def find_one(self, filter_dict: Dict):
        if "_id" in filter_dict:
            return self.store.get(filter_dict["_id"])
        
        for doc in self.store.values():
            match = all(doc.get(k) == v for k, v in filter_dict.items())
            if match:
                return doc
        return None
    
    def find(self, filter_dict: Dict = None):
        class Cursor:
            def __init__(self, store, filter_dict):
                self.store = store
                self.filter_dict = filter_dict or {}
                self._sort_field = None
                self._sort_order = 1
                self._limit = None
            
            def sort(self, field, order=1):
                self._sort_field = field
                self._sort_order = order
                return self
            
            def limit(self, limit):
                self._limit = limit
                return self
            
            async def to_list(self, length=None):
                results = []
                for doc in self.store.values():
                    if not self.filter_dict:
                        results.append(doc)
                    else:
                        match = all(doc.get(k) == v for k, v in self.filter_dict.items())
                        if match:
                            results.append(doc)
                
                if self._sort_field:
                    results.sort(key=lambda x: x.get(self._sort_field, ""), reverse=(self._sort_order == -1))
                
                if self._limit:
                    results = results[:self._limit]
                
                return results
        
        return Cursor(self.store, filter_dict)
    
    async def update_one(self, filter_dict: Dict, update_dict: Dict):
        doc = await self.find_one(filter_dict)
        if doc and "$set" in update_dict:
            doc.update(update_dict["$set"])
        
        class Result:
            def __init__(self):
                self.modified_count = 1 if doc else 0
        return Result()
    
    async def delete_one(self, filter_dict: Dict):
        if "_id" in filter_dict:
            if filter_dict["_id"] in self.store:
                del self.store[filter_dict["_id"]]
        
        class Result:
            def __init__(self):
                self.deleted_count = 1
        return Result()
    
    async def count_documents(self, filter_dict: Dict):
        count = 0
        for doc in self.store.values():
            match = all(doc.get(k) == v for k, v in filter_dict.items())
            if match:
                count += 1
        return count

# Helper: Retrieve database collection
def get_collection(collection_name: str):
    if USE_MEMORY:
        return InMemoryCollection(collection_name)
    if database is None:
        # Fallback if not initialized yet, though startup_event should handle it
        return InMemoryCollection(collection_name)
    return database[collection_name]
