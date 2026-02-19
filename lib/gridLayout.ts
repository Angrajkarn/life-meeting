/**
 * Enterprise Grid Layout Service
 * 
 * Provides stable, deterministic tile ordering for video presence system.
 * Ordering priority: Spotlight → Presenter → Host → Join Order
 */

export interface ParticipantPresence {
  user_id: string;
  name: string;
  avatar_color: string;
  role: 'host' | 'co-host' | 'participant';
  presence: 'connected' | 'reconnecting' | 'disconnected';
  joined_at: string;
  is_video_on: boolean;
  is_audio_on: boolean;
  is_presenting: boolean;
  is_speaking: boolean;
  is_hand_raised: boolean;
  is_spotlighted?: boolean;
}

export interface GridConfig {
  cols: number;
  rows: number;
  maxTiles: number;
}

/**
 * Deterministic tile ordering algorithm
 * 
 * Rules:
 * 1. Spotlighted users first
 * 2. Presenter second
 * 3. Host third
 * 4. Speaking does NOT affect order (visual effect only)
 * 5. Join order (stable)
 * 
 * @param participants - Array of participant presence objects
 * @returns Sorted array with stable ordering
 */
export function getTileOrder(participants: ParticipantPresence[]): ParticipantPresence[] {
  return [...participants].sort((a, b) => {
    // 1. Spotlighted users first
    const aSpotlighted = a.is_spotlighted || false;
    const bSpotlighted = b.is_spotlighted || false;
    if (aSpotlighted !== bSpotlighted) {
      return aSpotlighted ? -1 : 1;
    }

    // 2. Presenter second
    if (a.is_presenting !== b.is_presenting) {
      return a.is_presenting ? -1 : 1;
    }

    // 3. Host third
    if (a.role === 'host' && b.role !== 'host') return -1;
    if (b.role === 'host' && a.role !== 'host') return 1;

    // 4. Active speaker (temporary highlight) - Prioritize current speakers
    if (a.is_speaking !== b.is_speaking) {
      return a.is_speaking ? -1 : 1;
    }

    // 5. Join order (stable) - earlier joins first
    const aJoined = new Date(a.joined_at).getTime();
    const bJoined = new Date(b.joined_at).getTime();
    return aJoined - bJoined;
  });
}

/**
 * Calculate responsive grid configuration
 * 
 * Optimizes grid layout based on participant count
 * Max 25 tiles per page (5x5 grid)
 * 
 * @param participantCount - Number of participants to display
 * @returns Grid configuration with cols, rows, maxTiles
 */
export function getGridConfig(participantCount: number): GridConfig {
  if (participantCount === 0) {
    return { cols: 1, rows: 1, maxTiles: 1 };
  }
  
  if (participantCount === 1) {
    return { cols: 1, rows: 1, maxTiles: 1 };
  }
  
  if (participantCount === 2) {
    return { cols: 2, rows: 1, maxTiles: 2 };
  }
  
  if (participantCount === 3) {
    return { cols: 3, rows: 1, maxTiles: 3 };
  }
  
  if (participantCount === 4) {
    return { cols: 2, rows: 2, maxTiles: 4 };
  }
  
  if (participantCount <= 6) {
    return { cols: 3, rows: 2, maxTiles: 6 };
  }
  
  if (participantCount <= 9) {
    return { cols: 3, rows: 3, maxTiles: 9 };
  }
  
  if (participantCount <= 12) {
    return { cols: 4, rows: 3, maxTiles: 12 };
  }
  
  if (participantCount <= 16) {
    return { cols: 4, rows: 4, maxTiles: 16 };
  }
  
  // Max 25 tiles per page (5x5)
  return { cols: 5, rows: 5, maxTiles: 25 };
}

/**
 * Get aspect ratio for grid tiles
 * 
 * @param participantCount - Number of participants
 * @returns CSS aspect-ratio string
 */
export function getTileAspectRatio(participantCount: number): string {
  if (participantCount <= 2) return '16/9';  // Wide for 1-2 users
  if (participantCount <= 6) return '4/3';   // Balanced for 3-6 users
  return '1/1';                              // Square for 7+ users
}

/**
 * Paginate participants for large meetings
 * 
 * @param participants - Sorted participants array
 * @param currentPage - 0-indexed page number
 * @param tilesPerPage - Max tiles per page (default 25)
 * @returns Paginated slice of participants
 */
export function paginateParticipants(
  participants: ParticipantPresence[],
  currentPage: number = 0,
  tilesPerPage: number = 25
): ParticipantPresence[] {
  const start = currentPage * tilesPerPage;
  const end = start + tilesPerPage;
  return participants.slice(start, end);
}

/**
 * Calculate total pages needed
 * 
 * @param participantCount - Total number of participants
 * @param tilesPerPage - Max tiles per page (default 25)
 * @returns Total number of pages
 */
export function getTotalPages(
  participantCount: number,
  tilesPerPage: number = 25
): number {
  return Math.ceil(participantCount / tilesPerPage);
}
