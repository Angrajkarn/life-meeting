import asyncio
from datetime import datetime, timedelta, timezone
from typing import List
from backend.models import MeetingStatus
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Configuration
CHECK_INTERVAL_SECONDS = 30 # Check every 30 seconds for state transitions
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

class MeetingSchedulerService:
    def __init__(self, db_client=None):
        self.db_client = db_client or AsyncIOMotorClient(MONGODB_URL)
        self.db = self.db_client.life_meeting
        self._running = False
        self._task = None

    async def start(self):
        """Starts the background scheduler task"""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run())
        print("[Scheduler] Meeting status engine started.")

    async def stop(self):
        """Stops the background scheduler task"""
        if not self._running:
            return
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print("[Scheduler] Meeting status engine stopped.")

    async def _run(self):
        while self._running:
            try:
                await self.update_meeting_statuses()
            except Exception as e:
                print(f"[Scheduler] Error updating meeting statuses: {e}")
            await asyncio.sleep(CHECK_INTERVAL_SECONDS)

    async def update_meeting_statuses(self):
        """
        Scans all upcoming/live meetings and transitions their status based on time.
        """
        now = datetime.now(timezone.utc)
        from backend.websocket_manager import manager
        import json
        
        # Helper to broadcast changes
        async def broadcast_change(meeting_id: str, new_status: str, attendee_ids: List[str]):
            message = json.dumps({
                "type": "meeting_status_change",
                "data": {
                    "meeting_id": str(meeting_id),
                    "status": new_status,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            })
            for user_id in attendee_ids:
                await manager.notify_user(user_id, message)

        # 1. Transition SCHEDULED -> STARTING_SOON (10 minutes before)
        starting_soon_threshold = now + timedelta(minutes=10)
        cursor = self.db.meetings.find({
            "status": MeetingStatus.SCHEDULED,
            "start_time": {"$lte": starting_soon_threshold, "$gt": now + timedelta(minutes=2)}
        })
        async for meeting in cursor:
            await self.db.meetings.update_one({"_id": meeting["_id"]}, {"$set": {"status": MeetingStatus.STARTING_SOON}})
            attendee_ids = [a["user_id"] for a in meeting.get("attendees", [])]
            await broadcast_change(meeting["_id"], MeetingStatus.STARTING_SOON, attendee_ids)

        # 2. Transition STARTING_SOON/SCHEDULED -> JOIN_NOW (2 minutes before)
        join_now_threshold = now + timedelta(minutes=2)
        cursor = self.db.meetings.find({
            "status": {"$in": [MeetingStatus.SCHEDULED, MeetingStatus.STARTING_SOON]},
            "start_time": {"$lte": join_now_threshold, "$gt": now - timedelta(minutes=5)}
        })
        async for meeting in cursor:
            await self.db.meetings.update_one({"_id": meeting["_id"]}, {"$set": {"status": MeetingStatus.JOIN_NOW}})
            attendee_ids = [a["user_id"] for a in meeting.get("attendees", [])]
            await broadcast_change(meeting["_id"], MeetingStatus.JOIN_NOW, attendee_ids)

        # 3. Transition LIVE/JOIN_NOW/SCHEDULED -> ENDED (End time reached)
        cursor = self.db.meetings.find({
            "status": {"$ne": MeetingStatus.ENDED},
            "end_time": {"$lte": now}
        })
        async for meeting in cursor:
            await self.db.meetings.update_one({"_id": meeting["_id"]}, {"$set": {"status": MeetingStatus.ENDED}})
            attendee_ids = [a["user_id"] for a in meeting.get("attendees", [])]
            await broadcast_change(meeting["_id"], MeetingStatus.ENDED, attendee_ids)

    def _broadcast_status_change(self, meeting_id: str, new_status: str):
        # Implementation depends on how we access the global socket manager
        pass

# Global Instance
scheduler_service = MeetingSchedulerService()
