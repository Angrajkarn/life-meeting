from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from backend.models import UserResponse, SubscriptionPlan, Organization, OrganizationBilling
from backend.database import get_collection
from backend.routes.auth import get_current_user
from bson import ObjectId
from datetime import datetime, timezone, timedelta

router = APIRouter()

# Mock Plans
PLANS = [
    SubscriptionPlan(id="free", name="Free", max_seats=5, features=["basic_meetings"], price_monthly=0, currency="USD"),
    SubscriptionPlan(id="pro", name="Pro", max_seats=50, features=["recording", "transcription", "unlimited_time"], price_monthly=15, currency="USD"),
    SubscriptionPlan(id="enterprise", name="Enterprise", max_seats=1000, features=["sso", "audit_logs", "dedicated_support", "recording", "transcription"], price_monthly=45, currency="USD")
]

@router.get("/plans", response_model=List[SubscriptionPlan])
async def get_plans():
    """List available subscription plans."""
    return PLANS

@router.get("/my-billing", response_model=OrganizationBilling)
async def get_my_org_billing(current_user: UserResponse = Depends(get_current_user)):
    """Get billing info for the user's primary organization."""
    if not current_user.organizations:
        raise HTTPException(status_code=400, detail="User not in any organization")
    
    org_id = current_user.organizations[0]
    orgs_collection = get_collection("organizations")
    org_doc = await orgs_collection.find_one({"_id": ObjectId(org_id)})
    
    if not org_doc:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    org = Organization(**org_doc)
    if org.billing:
        return org.billing
    
    # Return default free billing
    return OrganizationBilling(org_id=org_id, plan_id="free")

@router.post("/subscribe")
async def subscribe_to_plan(
    plan_id: str = Body(..., embed=True),
    payment_method_id: str = Body(..., embed=True), # Mock Stripe payment method ID
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Switch organization plan (Mock implementation).
    """
    if not current_user.organizations:
        raise HTTPException(status_code=400, detail="User not in any organization")
        
    # Validation: Only Owner can change plan
    # (Simplified for now, assume any member can for demo)
    
    plan = next((p for p in PLANS if p.id == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    org_id = current_user.organizations[0]
    orgs_collection = get_collection("organizations")
    
    # Mock Billing Record
    billing_update = OrganizationBilling(
        org_id=org_id,
        plan_id=plan_id,
        status="active",
        subscription_id=f"sub_{ObjectId()}",
        payment_method_last4="4242",
        next_invoice_date=datetime.now(timezone.utc) + timedelta(days=30)
    )
    
    await orgs_collection.update_one(
        {"_id": ObjectId(org_id)},
        {"$set": {"billing": billing_update.dict(), "plan": plan_id}}
    )
    
    return {"status": "success", "plan": plan_id}
