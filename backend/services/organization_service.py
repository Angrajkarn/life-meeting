from backend.database import get_collection
from backend.models import Organization, OrganizationMember
from bson import ObjectId
from datetime import datetime, timezone
import uuid

class OrganizationService:
    @staticmethod
    async def create_organization(user_id: str, name: str, slug: str):
        orgs_collection = get_collection("organizations")
        users_collection = get_collection("users")
        
        # Check if slug exists
        existing = await orgs_collection.find_one({"slug": slug})
        if existing:
            raise ValueError(f"Organization with slug '{slug}' already exists")

        # Create Org
        member = OrganizationMember(user_id=user_id, role="owner", status="active")
        org = Organization(
            name=name,
            slug=slug,
            owner_id=user_id,
            members=[member],
            settings={"allow_guest_access": True}
        )
        
        org_dict = org.dict(exclude={"id"})
        result = await orgs_collection.insert_one(org_dict)
        org_id = str(result.inserted_id)
        
        # Update User
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"organizations": org_id}}
        )
        
        return {**org_dict, "id": org_id}

    @staticmethod
    async def get_user_organizations(user_id: str):
        orgs_collection = get_collection("organizations")
        # Find orgs where members.user_id matches
        cursor = orgs_collection.find({"members.user_id": user_id})
        orgs = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            orgs.append(doc)
        return orgs

    @staticmethod
    async def get_organization(org_id: str):
        orgs_collection = get_collection("organizations")
        doc = await orgs_collection.find_one({"_id": ObjectId(org_id)})
        if doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            return doc
        return None

    @staticmethod
    async def add_member(org_id: str, user_id: str, role: str = "member"):
        orgs_collection = get_collection("organizations")
        users_collection = get_collection("users")
        
        member = OrganizationMember(user_id=user_id, role=role, status="active")
        
        # Add to Org
        await orgs_collection.update_one(
            {"_id": ObjectId(org_id)},
            {"$push": {"members": member.dict()}}
        )
        
        # Add Org to User
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"organizations": org_id}}
        )
        
        # Real-time Broadcast
        try:
            from backend.websocket_manager import manager
            import json
            
            # Fetch updated org to get all members
            org = await orgs_collection.find_one({"_id": ObjectId(org_id)})
            if org:
                member_dict = member.dict()
                # Fan-out to all members
                for m in org.get("members", []):
                    await manager.notify_user(m["user_id"], json.dumps({
                        "type": "org:member_added",
                        "org_id": org_id,
                        "member": {
                            **member_dict,
                            "joined_at": member_dict["joined_at"].isoformat() if isinstance(member_dict["joined_at"], datetime) else member_dict["joined_at"]
                        }
                    }))
        except Exception as e:
            print(f"Failed to broadcast member addition: {e}")
            
        return True

    @staticmethod
    async def remove_member(org_id: str, user_id: str):
        orgs_collection = get_collection("organizations")
        users_collection = get_collection("users")
        
        # Check current role (prevent owner from leaving without transfer)
        org = await orgs_collection.find_one({"_id": ObjectId(org_id)})
        if not org:
            raise ValueError("Organization not found")
            
        if org.get("owner_id") == user_id:
            # Check if there are other members
            if len(org.get("members", [])) > 1:
                raise ValueError("Owners cannot leave. Transfer ownership or delete the organization.")
            # If only member, maybe allow delete? For now, block.
        
        # Remove from Org
        await orgs_collection.update_one(
            {"_id": ObjectId(org_id)},
            {"$pull": {"members": {"user_id": user_id}}}
        )
        
        # Remove Org from User
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"organizations": org_id}}
        )
        
        # Real-time Broadcast
        try:
            from backend.websocket_manager import manager
            import json
            
            # Notify the removed user first
            await manager.notify_user(user_id, json.dumps({
                "type": "org:member_removed",
                "org_id": org_id,
                "user_id": user_id,
                "reason": "You have left or were removed from the organization."
            }))
            
            # Notify others
            for m in org.get("members", []):
                if m["user_id"] != user_id:
                    await manager.notify_user(m["user_id"], json.dumps({
                        "type": "org:member_removed",
                        "org_id": org_id,
                        "user_id": user_id
                    }))
        except Exception as e:
            print(f"Failed to broadcast member removal: {e}")
            
        return True
