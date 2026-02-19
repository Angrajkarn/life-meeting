from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone
from backend.models import UserResponse, Department
from backend.database import get_collection
from backend.routes.auth import get_current_user
from bson import ObjectId
import re

router = APIRouter()

@router.get("/users/search", response_model=List[UserResponse])
async def search_users(
    q: str = Query(..., min_length=2, description="Search term for name or email"),
    department_id: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Search for users in the organization directory.
    """
    users_collection = get_collection("users")
    
    # regex for case-insensitive search
    regex_pattern = {"$regex": q, "$options": "i"}
    
    query = {
        "$or": [
            {"full_name": regex_pattern},
            {"email": regex_pattern},
            {"job_title": regex_pattern}
        ]
    }

    if department_id:
        query["department_id"] = department_id

    # If enterprise with multi-tenancy, we would restrict by org_id here.
    # For now, we assume a single shared directory or that the user can see anyone 
    # (like a global address list). To be strict, we should filter by current_user.organizations.
    if current_user.organizations:
        query["organizations"] = {"$in": current_user.organizations}

    cursor = users_collection.find(query).limit(20)
    users = await cursor.to_list(length=20)
    
    return [UserResponse(**user, id=str(user["_id"])) for user in users]

@router.get("/departments", response_model=List[Department])
async def get_departments(current_user: UserResponse = Depends(get_current_user)):
    """
    List all departments.
    """
    depts_collection = get_collection("departments")
    cursor = depts_collection.find({})
    depts = await cursor.to_list(length=100)
    return [Department(**d, id=str(d["_id"])) for d in depts]

@router.patch("/users/me/profile", response_model=UserResponse)
async def update_my_profile(
    job_title: Optional[str] = None,
    department_id: Optional[str] = None,
    location: Optional[str] = None,
    phone: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update the current user's directory profile.
    """
    users_collection = get_collection("users")
    update_data = {}
    
    if job_title is not None:
        update_data["job_title"] = job_title
    if location is not None:
        update_data["location"] = location
    if phone is not None:
        update_data["phone"] = phone
        
    if department_id:
        # Verify dept exists
        depts_collection = get_collection("departments")
        dept = await depts_collection.find_one({"_id": ObjectId(department_id)})
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        update_data["department_id"] = department_id
        update_data["department"] = dept["name"]

    if not update_data:
        return current_user

    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    
    # Return updated user
    updated_user_doc = await users_collection.find_one({"_id": ObjectId(current_user.id)})
    return UserResponse(**updated_user_doc, id=str(updated_user_doc["_id"]))
