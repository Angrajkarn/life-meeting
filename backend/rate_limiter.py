"""
Enterprise Reaction System - Rate Limiter
Redis-backed sliding window rate limiting (5 reactions per 10 seconds)
"""

import time
from typing import Optional
import redis.asyncio as redis


class ReactionRateLimiter:
    """
    Rate limiter for emoji reactions using Redis sliding window algorithm.
    Limits: 5 reactions per 10 second window per user per meeting.
    """
    
    def __init__(self, redis_client: redis.Redis, max_reactions: int = 5, window_seconds: int = 10):
        """
        Args:
            redis_client: Async Redis client instance
            max_reactions: Maximum reactions allowed in window (default: 5)
            window_seconds: Time window in seconds (default: 10)
        """
        self.redis = redis_client
        self.max_reactions = max_reactions
        self.window_seconds = window_seconds
    
    async def is_limited(self, user_id: str, meeting_id: str) -> tuple[bool, Optional[int]]:
        """
        Check if user is rate limited.
        
        Args:
            user_id: User identifier
            meeting_id: Meeting identifier
            
        Returns:
            Tuple of (is_limited: bool, retry_after: Optional[int])
            retry_after is seconds until next reaction allowed, None if not limited
        """
        key = f"reaction_limit:{user_id}:{meeting_id}"
        
        try:
            count = await self.redis.get(key)
            current_count = int(count) if count else 0
            
            if current_count >= self.max_reactions:
                # Get TTL to tell user when they can retry
                ttl = await self.redis.ttl(key)
                return True, max(ttl, 1)  # At least 1 second
            
            return False, None
            
        except Exception as e:
            print(f"[ReactionRateLimiter] Error checking limit: {e}")
            # Fail open - allow reaction if Redis is down
            return False, None
    
    async def increment(self, user_id: str, meeting_id: str) -> int:
        """
        Increment reaction count for user in meeting.
        
        Args:
            user_id: User identifier
            meeting_id: Meeting identifier
            
        Returns:
            New count value
        """
        key = f"reaction_limit:{user_id}:{meeting_id}"
        
        try:
            # Increment counter
            new_count = await self.redis.incr(key)
            
            # Set expiry only if this is the first reaction in the window
            if new_count == 1:
                await self.redis.expire(key, self.window_seconds)
            
            return new_count
            
        except Exception as e:
            print(f"[ReactionRateLimiter] Error incrementing: {e}")
            return 0
    
    async def reset(self, user_id: str, meeting_id: str):
        """
        Reset rate limit for user (admin override).
        
        Args:
            user_id: User identifier
            meeting_id: Meeting identifier
        """
        key = f"reaction_limit:{user_id}:{meeting_id}"
        
        try:
            await self.redis.delete(key)
        except Exception as e:
            print(f"[ReactionRateLimiter] Error resetting: {e}")


def is_valid_emoji(emoji: str) -> bool:
    """
    Validate that reaction is a valid Unicode emoji.
    
    Args:
        emoji: String to validate
        
    Returns:
        True if valid emoji, False otherwise
    """
    # Allow common emojis (simple validation)
    # In production, use a proper emoji validation library
    allowed_emojis = {'❤️', '👍', '👏', '🔥', '😂', '😮', '🎉', '💯', '🎊', '✨'}
    
    # Check if it's in allowed set
    if emoji in allowed_emojis:
        return True
    
    # Additional check: single character in emoji range
    if len(emoji) == 1:
        code_point = ord(emoji)
        # Common emoji ranges (simplified)
        emoji_ranges = [
            (0x1F600, 0x1F64F),  # Emoticons
            (0x1F300, 0x1F5FF),  # Misc Symbols
            (0x1F680, 0x1F6FF),  # Transport
            (0x2600, 0x26FF),    # Misc symbols
            (0x2700, 0x27BF),    # Dingbats
        ]
        return any(start <= code_point <= end for start, end in emoji_ranges)
    
    return False
