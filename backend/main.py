from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import auth, meetings, users, websocket, lobby, invitations
from backend.routes.chat import router as chat_router
import uvicorn
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from backend.limiter import limiter
import redis.asyncio as redis
from backend.rate_limiter import ReactionRateLimiter
import os
import re

app = FastAPI(title="Life Meeting API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Initialize Redis client for reaction rate limiting
try:
    redis_client = redis.from_url(
        "redis://localhost:6379/0",
        encoding="utf-8",
        decode_responses=True
    )
    reaction_rate_limiter = ReactionRateLimiter(redis_client)
    app.state.redis = redis_client
    app.state.reaction_rate_limiter = reaction_rate_limiter
    print("[Startup] Redis client initialized for reaction rate limiting")
except Exception as e:
    print(f"[Startup] Warning: Could not connect to Redis: {e}")
    app.state.redis = None
    app.state.reaction_rate_limiter = None

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://0.0.0.0:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(meetings.router, prefix="/meetings", tags=["Meetings"])
app.include_router(lobby.router, tags=["Lobby"])
app.include_router(websocket.router, tags=["Real-Time"])
app.include_router(invitations.router, prefix="/invitations", tags=["Invitations"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])

from backend.routes import notifications
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

from backend.routes import search
app.include_router(search.router, prefix="/search", tags=["Search"])

from backend.routes import privacy
app.include_router(privacy.router, prefix="/privacy", tags=["Privacy"])

from backend.routes import directory
app.include_router(directory.router, prefix="/directory", tags=["Directory"])

from backend.routes import organizations
app.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])

from backend.routes import billing
app.include_router(billing.router, prefix="/billing", tags=["Billing"])

from backend.routes import upload
app.include_router(upload.router, prefix="/api", tags=["Uploads"])
from backend.routes import recordings
app.include_router(recordings.router, prefix="/api/recordings", tags=["Recordings"])

# Reaction System API
from backend.api import reactions
app.include_router(reactions.router, tags=["Reactions"])

from fastapi.staticfiles import StaticFiles
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root(request: Request):
    return {"message": "Welcome to Life Meeting Enterprise API", "status": "running"}

@app.on_event("startup")
async def startup_event():
    from backend.database import connect_to_mongo
    await connect_to_mongo()
    from backend.services.scheduler import scheduler_service
    await scheduler_service.start()
    print("[Startup] Meeting scheduler and MongoDB started")

@app.on_event("shutdown")
async def shutdown_event():
    from backend.services.scheduler import scheduler_service
    await scheduler_service.stop()
    if app.state.redis:
        await app.state.redis.close()
    print("[Shutdown] Meeting scheduler stopped")

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
