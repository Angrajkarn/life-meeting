from fastapi import APIRouter, Depends, Request
from backend.routes.auth import get_current_user
from backend.models import UserResponse
from backend.database import get_collection
from backend.limiter import limiter
from datetime import datetime, timezone

router = APIRouter()

@router.get("/")
@limiter.limit("60/minute")
async def global_search(
    request: Request,
    q: str = "",
    limit: int = 10,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Enterprise global search across meetings, users, and teams.
    Returns categorized results with relevance ranking.
    """
    if not q or len(q.strip()) < 2:
        return {"meetings": [], "people": [], "query": q}

    query = q.strip()
    # Case-insensitive partial match regex
    pattern = {"$regex": query, "$options": "i"}

    now = datetime.now(timezone.utc)

    # ── Meetings ─────────────────────────────────────────────────
    meetings_col = get_collection("meetings")
    meetings_cursor = meetings_col.find({
        "$and": [
            {"status": {"$ne": "ended"}},
            {"$or": [
                {"host_id": str(current_user.id)},
                {"attendees.user_id": str(current_user.id)},
                {"settings.visibility": {"$in": ["org", "team"]}},
            ]},
            {"$or": [
                {"title": pattern},
                {"description": pattern},
                {"code": pattern},
            ]}
        ]
    }).sort("start_time", 1).limit(limit)

    meetings = []
    async for m in meetings_cursor:
        meetings.append({
            "id": str(m["_id"]),
            "type": "meeting",
            "title": m.get("title", "Untitled"),
            "subtitle": m.get("start_time").strftime("%b %d, %I:%M %p") if m.get("start_time") else "",
            "status": m.get("status", "scheduled"),
            "code": m.get("code", ""),
            "href": f"/meeting/{m.get('code', '')}",
        })

    # ── Users / People ────────────────────────────────────────────
    users_col = get_collection("users")
    users_cursor = users_col.find({
        "_id": {"$ne": current_user.id},
        "$or": [
            {"full_name": pattern},
            {"email": pattern},
            {"username": pattern},
        ]
    }).limit(limit)

    people = []
    async for u in users_cursor:
        people.append({
            "id": str(u["_id"]),
            "type": "person",
            "title": u.get("full_name") or u.get("username") or u.get("email", ""),
            "subtitle": u.get("email", ""),
            "avatar": u.get("avatar_url"),
            "href": f"/dashboard/team?uid={str(u['_id'])}",
        })

    return {
        "query": query,
        "meetings": meetings,
        "people": people,
        "total": len(meetings) + len(people),
    }
