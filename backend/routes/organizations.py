from fastapi import APIRouter, Depends, HTTPException, status, Request
from backend.routes.auth import get_current_user
from backend.models import UserResponse, Organization, OrganizationMember
from backend.services.organization_service import OrganizationService
from backend.database import get_collection
from bson import ObjectId

router = APIRouter()

@router.post("/", response_model=dict)
async def create_organization(
    request: Request, 
    data: dict, 
    current_user: UserResponse = Depends(get_current_user)
):
    name = data.get("name")
    slug = data.get("slug")
    
    if not name or not slug:
        raise HTTPException(status_code=400, detail="Name and slug are required")
        
    try:
        org = await OrganizationService.create_organization(current_user.id, name, slug)
        return org
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[dict])
async def list_organizations(
    request: Request, 
    current_user: UserResponse = Depends(get_current_user)
):
    return await OrganizationService.get_user_organizations(current_user.id)

@router.get("/{org_id}", response_model=dict)
async def get_organization(
    org_id: str, 
    current_user: UserResponse = Depends(get_current_user)
):
    org = await OrganizationService.get_organization(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # Check membership
    is_member = any(m["user_id"] == current_user.id for m in org.get("members", []))
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
        
    return org

@router.post("/{org_id}/members")
async def add_member(
    org_id: str, 
    data: dict, 
    current_user: UserResponse = Depends(get_current_user)
):
    user_id = data.get("user_id")
    role = data.get("role", "member")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
        
    # Verify requester is owner or admin
    org = await OrganizationService.get_organization(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    requester_role = next((m["role"] for m in org.get("members", []) if m["user_id"] == current_user.id), None)
    if requester_role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
        
    await OrganizationService.add_member(org_id, user_id, role)
    return {"message": "Member added successfully"}

@router.delete("/{org_id}/members/{user_id}")
async def remove_member(
    org_id: str,
    user_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    # Verify requester is owner or admin
    org = await OrganizationService.get_organization(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    requester_role = next((m["role"] for m in org.get("members", []) if m["user_id"] == current_user.id), None)
    if requester_role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Validation handled in Service (e.g. owner leaving)
    try:
        await OrganizationService.remove_member(org_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    return {"message": "Member removed successfully"}

@router.post("/{org_id}/leave")
async def leave_organization(
    org_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    try:
        await OrganizationService.remove_member(org_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    return {"message": "You have left the organization"}
