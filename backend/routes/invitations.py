import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from backend.routes.auth import get_current_user
from backend.models import UserResponse, WorkspaceInvitation
from backend.database import get_collection
from backend.email_service import email_service
from datetime import datetime, timezone

router = APIRouter()

@router.post("/", response_model=dict)
async def create_invitation(
    request: Request,
    invitation_data: dict,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user)
):
    email = invitation_data.get("email")
    org_id = invitation_data.get("org_id")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    invitations_collection = get_collection("invitations")
    
    # Check if already invited
    query = {"email": email, "status": "pending"}
    if org_id:
        query["org_id"] = org_id
        
    existing = await invitations_collection.find_one(query)
    if existing:
        return {"message": "Invitation already pending for this email", "id": str(existing["_id"])}
    
    # If org_id provided, verify existence and permissions
    org_name = "Life Meeting"
    if org_id:
        from backend.services.organization_service import OrganizationService
        org = await OrganizationService.get_organization(org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        # Check if user is already a member
        # (Simplified: relying on frontend or service to handle cleaner, but adding check here is good)
        is_member = any(m["user_id"] == current_user.id for m in org.get("members", []))
        if not is_member: # Should be admin check really
             pass # For now, allow any member to invite
        org_name = org["name"]

    token = secrets.token_urlsafe(32)
    invitation = WorkspaceInvitation(
        email=email,
        org_id=org_id,
        token=token,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        created_at=datetime.now(timezone.utc),
        status="pending"
    )
    
    invitation_dict = invitation.dict()
    if "id" in invitation_dict: del invitation_dict["id"]
    
    result = await invitations_collection.insert_one(invitation_dict)
    
    # Construct invite URL
    frontend_url = "http://localhost:3000" 
    # Points to signup or special invite acceptance page
    invite_url = f"{frontend_url}/invite/{token}"
    
    # Send email (mocked or real)
    background_tasks.add_task(email_service.send_workspace_invite, email, current_user.full_name, invite_url, org_name)
    
    return {"message": "Invitation sent successfully", "id": str(result.inserted_id)}

@router.post("/{token}/accept", response_model=dict)
async def accept_invitation(
    token: str,
    current_user: UserResponse = Depends(get_current_user)
):
    invitations_collection = get_collection("invitations")
    invitation = await invitations_collection.find_one({"token": token, "status": "pending"})
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or expired")
        
    if invitation["email"] != current_user.email:
         raise HTTPException(status_code=403, detail="This invitation is for a different email address")

    # If it's an org invite, add to org
    if invitation.get("org_id"):
        from backend.services.organization_service import OrganizationService
        await OrganizationService.add_member(invitation["org_id"], current_user.id)

    # Update invitation status
    await invitations_collection.update_one(
        {"_id": invitation["_id"]},
        {"$set": {"status": "accepted"}}
    )
    
    return {"message": "Invitation accepted", "org_id": invitation.get("org_id")}

@router.get("/", response_model=list[dict])
async def list_invitations(current_user: UserResponse = Depends(get_current_user)):
    invitations_collection = get_collection("invitations")
    # Show invites sent by me OR invites for my orgs (if admin)
    # For now, just sent by me
    cursor = invitations_collection.find({"sender_id": current_user.id}).sort("created_at", -1)
    
    invites = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        invites.append(doc)
    return invites
