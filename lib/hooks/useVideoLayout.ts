import { useState, useMemo, useEffect } from 'react';
import { ParticipantPresence, getGridConfig } from '../gridLayout';

export type LayoutMode = 'grid' | 'speaker' | 'sidebar';

interface UseVideoLayoutProps {
    participants: ParticipantPresence[];
    localUserId: string;
    spotlightedUserIds?: string[];
    activeSpeakerId?: string | null;
    pinnedUserIds?: string[]; // Prop-based override (e.g. from parent)
    maxGallerySize?: number;
    viewMode?: string;
}

export function useVideoLayout({
    participants,
    localUserId,
    spotlightedUserIds = [],
    activeSpeakerId = null,
    pinnedUserIds: propPinnedUserIds = [],
    maxGallerySize = 25,
    viewMode = 'gallery'
}: UseVideoLayoutProps) {
    // Local State
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
    const [localPinnedUserIds, setLocalPinnedUserIds] = useState<string[]>([]);
    const [page, setPage] = useState(0);

    // Merge props and local state for pinning (local takes precedence if we want to allow user override)
    // For now, let's treat them as additive or prefer local if set.
    // Actually, usually pinning is a local user action.
    const pinnedUserIds = useMemo(() => {
        return Array.from(new Set([...propPinnedUserIds, ...localPinnedUserIds]));
    }, [propPinnedUserIds, localPinnedUserIds]);

    const togglePin = (userId: string) => {
        setLocalPinnedUserIds(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            }
            // Max 1 pin for now for simplicity, or allow multiple
            return [userId]; 
        });
        // Reset to page 0 when pinning to ensure visibility
        setPage(0);
    };

    // Priority Sorting Algorithm
    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => {
            // 1. Pinned Users (Top Priority)
            const aPinned = pinnedUserIds.includes(a.user_id);
            const bPinned = pinnedUserIds.includes(b.user_id);
            if (aPinned !== bPinned) return aPinned ? -1 : 1;

            // 2. Screen Sharing (High Priority)
            if (a.is_presenting !== b.is_presenting) return a.is_presenting ? -1 : 1;

            // 3. Spotlight (Global Priority)
            const aSpotlight = spotlightedUserIds.includes(a.user_id);
            const bSpotlight = spotlightedUserIds.includes(b.user_id);
            if (aSpotlight !== bSpotlight) return aSpotlight ? -1 : 1;

            // 4. Role (Host/Co-host) - Optional, maybe less important than speaker?
            // Let's put Active Speaker ABOVE Role if we are in Speaker Mode, but for Grid, maybe Role is better?
            // The Design Doc said: Active Speaker > Role.
            
            // 4. Active Speaker (Bubble to top)
            // Note: To prevent jitter, we might want to only do this if they are NOT already visible?
            // For this implementation, we'll sort strictly.
            const aIsSpeaker = a.user_id === activeSpeakerId || a.is_speaking;
            const bIsSpeaker = b.user_id === activeSpeakerId || b.is_speaking;
            if (aIsSpeaker !== bIsSpeaker) return aIsSpeaker ? -1 : 1;

            // 5. Role
            const aIsHost = a.role === 'host' || a.role === 'co-host';
            const bIsHost = b.role === 'host' || b.role === 'co-host';
            if (aIsHost !== bIsHost) return aIsHost ? -1 : 1;

            // 6. Join Order (Stable tie-breaker)
            // Assuming joined_at is ISO string
            return (a.joined_at || '').localeCompare(b.joined_at || '');
        });
    }, [participants, pinnedUserIds, spotlightedUserIds, activeSpeakerId]);

    // Responsive Tile Count
    // Use the maxGallerySize provided by the View Menu for enterprise layout options
    const maxTilesPerPage = maxGallerySize; 

    // Pagination Logic
    const totalPages = Math.ceil(sortedParticipants.length / maxTilesPerPage);
    
    // Safety check for page bounds
    useEffect(() => {
        if (page >= totalPages && totalPages > 0) {
            setPage(totalPages - 1);
        }
    }, [totalPages, page]);

    const paginatedParticipants = useMemo(() => {
        const start = page * maxTilesPerPage;
        return sortedParticipants.slice(start, start + maxTilesPerPage);
    }, [sortedParticipants, page, maxTilesPerPage]);

    // Layout Mode Automation (The "AI" Layout Engine)
    // - 'speaker': Forces sidebar with active speaker on main stage
    // - 'gallery': Forces grid mode (unless someone is screen sharing)
    // - 'ai': Smart switching based on meeting context
    useEffect(() => {
        const isSomeonePresenting = participants.some(p => p.is_presenting);
        const hasSpecialUser = pinnedUserIds.length > 0 || spotlightedUserIds.length > 0;

        if (viewMode === 'speaker') {
            setLayoutMode('speaker');
        } else if (viewMode === 'ai') {
            if (isSomeonePresenting || hasSpecialUser || activeSpeakerId) {
                // In AI mode, if someone talks, or shares screen, auto-focus them
                setLayoutMode('speaker');
            } else {
                setLayoutMode('grid');
            }
        } else {
            // Default/Gallery mode (or 'together')
            if (hasSpecialUser || isSomeonePresenting) {
                // Must show sidebar if presenting/pinned even in gallery mode
                setLayoutMode('sidebar');
            } else {
                setLayoutMode('grid');
            }
        }
    }, [pinnedUserIds.length, spotlightedUserIds.length, participants, viewMode, activeSpeakerId]);

    // Categorize Participants for Sidebar Mode
    const { mainStageParticipants, sidebarParticipants } = useMemo(() => {
        let main: ParticipantPresence[] = [];
        let side: ParticipantPresence[] = [];

        if (layoutMode === 'sidebar' || layoutMode === 'speaker') {
            // Priority 1: Pinned
            const pinned = participants.filter(p => pinnedUserIds.includes(p.user_id));
            if (pinned.length > 0) {
                main = pinned;
            } 
            // Priority 2: Screen Sharing (if not pinned)
            else {
                const presenting = participants.filter(p => p.is_presenting);
                if (presenting.length > 0) {
                    main = presenting;
                }
                // Priority 3: Spotlight (if not pinned/presenting)
                else {
                    const spotlighted = participants.filter(p => spotlightedUserIds.includes(p.user_id));
                    if (spotlighted.length > 0) {
                         main = spotlighted;
                    }
                    // Priority 4: Active Speaker (if Mode is Speaker or AI)
                    else if ((layoutMode === 'speaker' || viewMode === 'ai') && activeSpeakerId) {
                        const speaker = participants.find(p => p.user_id === activeSpeakerId);
                        if (speaker) main = [speaker];
                    }
                }
            }
             
            // If main empty, fallback to first sorted
             if (main.length === 0 && sortedParticipants.length > 0) {
                 main = [sortedParticipants[0]];
             }

             // Side is everyone else
             const mainIds = main.map(p => p.user_id);
             side = sortedParticipants.filter(p => !mainIds.includes(p.user_id));
        }

        return { mainStageParticipants: main, sidebarParticipants: side };
    }, [participants, pinnedUserIds, spotlightedUserIds, activeSpeakerId, layoutMode, sortedParticipants]);

    // Grid Configuration for current page
    const gridConfig = useMemo(() => {
        return getGridConfig(paginatedParticipants.length);
    }, [paginatedParticipants.length]);

    const nextPage = () => setPage(p => Math.min(p + 1, totalPages - 1));
    const prevPage = () => setPage(p => Math.max(p - 1, 0));

    return {
        layoutMode,
        setLayoutMode,
        sortedParticipants,     // Full list
        paginatedParticipants,  // Visible list for GRID
        mainStageParticipants,  // For Sidebar/Speaker
        sidebarParticipants,    // For Sidebar/Speaker
        gridConfig,
        page,
        totalPages,
        nextPage,
        prevPage,
        setPage,
        pinnedUserIds,
        togglePin
    };
}
