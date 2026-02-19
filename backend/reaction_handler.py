"""
Enterprise Reaction System - WebSocket Handler
Handles real-time emoji reactions with rate limiting and policy enforcement
"""

import time
from typing import Dict, Any
from fastapi import WebSocket

from backend.rate_limiter import ReactionRateLimiter, is_valid_emoji


class ReactionDisabledError(Exception):
    """Raised when reactions are disabled for the meeting"""
    pass


class NoPermissionError(Exception):
    """Raised when user doesn't have permission to react"""
    pass


class RateLimitError(Exception):
    """Raised when user exceeds rate limit"""
    def __init__(self, retry_after: int):
        self.retry_after = retry_after
        super().__init__(f"Rate limited, retry after {retry_after} seconds")


async def validate_reaction(
    user_id: str,
    meeting_id: str,
    reaction: str,
    meeting_settings: Dict[str, Any],
    user_role: str,
    rate_limiter: ReactionRateLimiter
) -> None:
    """
    Validate if user can send a reaction.
    
    Args:
        user_id: User identifier
        meeting_id: Meeting identifier
        reaction: Emoji string
        meeting_settings: Meeting settings dict with reaction_policy
        user_role: User's role (host, co-host, participant)
        rate_limiter: Rate limiter instance
        
    Raises:
        ValueError: Invalid emoji
        ReactionDisabledError: Reactions disabled
        NoPermissionError: User lacks permission
        RateLimitError: Rate limit exceeded
    """
    # 1. Validate emoji
    if not is_valid_emoji(reaction):
        raise ValueError("Invalid emoji")
    
    # 2. Check if reactions are globally enabled
    reaction_policy = meeting_settings.get('reaction_policy', {})
    if not reaction_policy.get('allow_reactions', True):
        raise ReactionDisabledError()
    
    # 3. Check role-based permissions
    allowed_roles = reaction_policy.get('allowed_roles', ['host', 'co-host', 'participant'])
    if user_role not in allowed_roles:
        raise NoPermissionError()
    
    # 4. Check rate limit (skip for hosts with override)
    rate_limit_override = reaction_policy.get('rate_limit_override', False)
    if not (rate_limit_override and user_role in ['host', 'co-host']):
        is_limited, retry_after = await rate_limiter.is_limited(user_id, meeting_id)
        if is_limited:
            raise RateLimitError(retry_after)


async def handle_reaction_send(
    ws: WebSocket,
    user_id: str,
    user_name: str,
    data: Dict[str, Any],
    meeting_settings: Dict[str, Any],
    user_role: str,
    rate_limiter: ReactionRateLimiter,
    broadcast_func: callable
) -> None:
    """
    Process incoming reaction from user and broadcast to meeting.
    
    Args:
        ws: WebSocket connection for this user
        user_id: User identifier
        user_name: User display name
        data: Reaction event data {'reaction': str, 'meeting_id': str}
        meeting_settings: Meeting settings dict
        user_role: User's role
        rate_limiter: Rate limiter instance
        broadcast_func: Function to broadcast message to meeting
                       Signature: async (meeting_id, message) -> None
    """
    meeting_id = data.get('meeting_id')
    reaction = data.get('reaction')
    
    if not meeting_id or not reaction:
        await send_error(ws, "Missing required fields")
        return
    
    try:
        # Validate reaction
        await validate_reaction(
            user_id=user_id,
            meeting_id=meeting_id,
            reaction=reaction,
            meeting_settings=meeting_settings,
            user_role=user_role,
            rate_limiter=rate_limiter
        )
        
        # Broadcast to all meeting participants
        await broadcast_func(meeting_id, {
            "type": "reaction",
            "data": {
                "user_id": user_id,
                "user_name": user_name,
                "reaction": reaction,
                "timestamp": int(time.time())
            }
        })
        
        # Increment rate limit counter
        await rate_limiter.increment(user_id, meeting_id)
        
        print(f"[Reaction] {user_name} sent {reaction} in meeting {meeting_id}")
        
    except ValueError as e:
        await send_rejection(ws, "invalid_emoji", str(e))
        
    except RateLimitError as e:
        await send_rejection(ws, "rate_limit", retry_after=e.retry_after)
        
    except ReactionDisabledError:
        await send_rejection(ws, "disabled")
        
    except NoPermissionError:
        await send_rejection(ws, "no_permission")
        
    except Exception as e:
        print(f"[Reaction] Error handling reaction_send: {e}")
        await send_error(ws, "Internal server error")


async def send_rejection(
    ws: WebSocket,
    reason: str,
    message: str = None,
    retry_after: int = None
) -> None:
    """
    Send reaction rejection message to client.
    
    Args:
        ws: WebSocket connection
        reason: Rejection reason code
        message: Optional error message
        retry_after: Optional seconds until retry allowed
    """
    try:
        payload = {
            "type": "reaction_rejected",
            "data": {
                "reason": reason
            }
        }
        
        if message:
            payload["data"]["message"] = message
            
        if retry_after is not None:
            payload["data"]["retry_after"] = retry_after
        
        await ws.send_json(payload)
        
    except Exception as e:
        print(f"[Reaction] Error sending rejection: {e}")


async def send_error(ws: WebSocket, message: str) -> None:
    """Send error message to client"""
    try:
        await ws.send_json({
            "type": "error",
            "message": message
        })
    except Exception as e:
        print(f"[Reaction] Error sending error: {e}")
