/**
 * WebRTC Configuration for Enterprise Deployment
 * Supports TURN servers for NAT traversal in restrictive networks
 */

export interface ICEServerConfig {
    urls: string | string[];
    username?: string;
    credential?: string;
}

export interface WebRTCConfig {
    iceServers: ICEServerConfig[];
    iceCandidatePoolSize?: number;
    iceTransportPolicy?: 'all' | 'relay';
}

/**
 * Get WebRTC configuration with TURN servers
 * In production, credentials should come from environment variables or secure config
 */
export function getWebRTCConfig(): WebRTCConfig {
    const config: WebRTCConfig = {
        iceServers: [
            // Google STUN servers (free, reliable for most networks)
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        ],
        iceCandidatePoolSize: 10,
    };

    // Add TURN servers if credentials are available
    // In production, use environment variables:
    // NEXT_PUBLIC_TURN_URL, NEXT_PUBLIC_TURN_USERNAME, NEXT_PUBLIC_TURN_CREDENTIAL
    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    if (turnUrl && turnUsername && turnCredential) {
        config.iceServers.push({
            urls: [
                `turn:${turnUrl}?transport=udp`,
                `turn:${turnUrl}?transport=tcp`,
            ],
            username: turnUsername,
            credential: turnCredential,
        });
        console.log('[WebRTC Config] TURN servers configured');
    } else {
        console.warn('[WebRTC Config] TURN servers not configured. Using STUN only. This may fail in restrictive networks.');
    }

    return config;
}

/**
 * Quality presets for adaptive bitrate
 */
export enum QualityPreset {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    AUTO = 'AUTO',
}

export interface QualitySettings {
    maxWidth: number;
    maxHeight: number;
    maxFrameRate: number;
    maxBitrate: number; // bits per second
}

export const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
    [QualityPreset.LOW]: {
        maxWidth: 1280,
        maxHeight: 720,
        maxFrameRate: 15,
        maxBitrate: 500000, // 500 kbps
    },
    [QualityPreset.MEDIUM]: {
        maxWidth: 1920,
        maxHeight: 1080,
        maxFrameRate: 24,
        maxBitrate: 1500000, // 1.5 Mbps
    },
    [QualityPreset.HIGH]: {
        maxWidth: 1920,
        maxHeight: 1080,
        maxFrameRate: 30,
        maxBitrate: 3000000, // 3 Mbps
    },
    [QualityPreset.AUTO]: {
        maxWidth: 1920,
        maxHeight: 1080,
        maxFrameRate: 30,
        maxBitrate: 3000000, // Will be adjusted based on bandwidth
    },
};

/**
 * Apply quality constraints to media stream
 */
export async function applyQualityConstraints(
    stream: MediaStream,
    quality: QualityPreset
): Promise<void> {
    const settings = QUALITY_PRESETS[quality];
    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack) {
        try {
            await videoTrack.applyConstraints({
                width: { max: settings.maxWidth },
                height: { max: settings.maxHeight },
                frameRate: { max: settings.maxFrameRate },
            });
            console.log(`[WebRTC] Applied ${quality} quality constraints`);
        } catch (err) {
            console.error('[WebRTC] Failed to apply quality constraints:', err);
        }
    }
}

/**
 * Get display media with quality constraints
 */
export async function getDisplayMediaWithQuality(
    quality: QualityPreset = QualityPreset.AUTO
): Promise<MediaStream> {
    const settings = QUALITY_PRESETS[quality];
    
    const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            width: { ideal: settings.maxWidth },
            height: { ideal: settings.maxHeight },
            frameRate: { ideal: settings.maxFrameRate },
        },
        audio: true,
    });

    return stream;
}
