// Enterprise: Spotlight & Pin Helper Functions

import { toast } from "sonner";

/**
 * API client for spotlight endpoints
 */
export async function setSpotlight(
  meetingId: string,
  userIds: string[],
  token: string
): Promise<{ success: boolean; spotlighted_user_ids: string[] }> {
  const response = await fetch(`http://localhost:8000/api/meetings/${meetingId}/spotlight`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ user_ids: userIds })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to set spotlight');
  }

  return response.json();
}

export async function clearSpotlight(
  meetingId: string,
  token: string
): Promise<{ success: boolean }> {
  const response = await fetch(`http://localhost:8000/api/meetings/${meetingId}/spotlight`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to clear spotlight');
  }

  return response.json();
}

/**
 * Toggle spotlight for a participant (client-side helper)
 * 
 * @param userId - User ID to toggle spotlight for
 * @param currentSpotlightedUserIds - Current array of spotlighted user IDs
 * @returns New array of spotlighted user IDs
 */
export function toggleSpotlightLocal(
  userId: string,
  currentSpotlightedUserIds: string[]
): string[] {
  if (currentSpotlightedUserIds.includes(userId)) {
    // Remove from spotlight
    return currentSpotlightedUserIds.filter(id => id !== userId);
  } else {
    // Add to spotlight (max 3)
    if (currentSpotlightedUserIds.length >= 3) {
      toast.error('Maximum 3 participants can be spotlighted');
      return currentSpotlightedUserIds;
    }
    return [...currentSpotlightedUserIds, userId];
  }
}

/**
 * Toggle pin for a participant (client-side only)
 * 
 * @param userId - User ID to toggle pin for
 * @param currentPinnedUserIds - Current array of pinned user IDs
 * @returns New array of pinned user IDs
 */
export function togglePin(
  userId: string,
  currentPinnedUserIds: string[]
): string[] {
  if (currentPinnedUserIds.includes(userId)) {
    // Remove from pinned
    return currentPinnedUserIds.filter(id => id !== userId);
  } else {
    // Add to pinned (no limit for pin, but typically keep it reasonable)
    return [...currentPinnedUserIds, userId];
  }
}

/**
 * Check if user has spotlight permissions
 */
export function canSpotlight(userRole: string): boolean {
  return userRole === 'host' || userRole === 'co-host';
}
