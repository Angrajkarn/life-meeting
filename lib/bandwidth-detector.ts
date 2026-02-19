/**
 * Bandwidth Detection and Monitoring Utility
 * Detects network bandwidth and provides quality recommendations
 */

export interface BandwidthInfo {
    downlink: number; // Mbps
    rtt: number; // Round-trip time in ms
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
    quality: 'high' | 'medium' | 'low';
}

export class BandwidthDetector {
    private static instance: BandwidthDetector;
    private bandwidthInfo: BandwidthInfo | null = null;
    private listeners: Set<(info: BandwidthInfo) => void> = new Set();

    private constructor() {
        this.initMonitoring();
    }

    static getInstance(): BandwidthDetector {
        if (!BandwidthDetector.instance) {
            BandwidthDetector.instance = new BandwidthDetector();
        }
        return BandwidthDetector.instance;
    }

    /**
     * Initialize bandwidth monitoring using Network Information API
     */
    private initMonitoring(): void {
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            
            // Initial detection
            this.updateBandwidthInfo();

            // Listen for changes
            connection.addEventListener('change', () => {
                this.updateBandwidthInfo();
            });
        } else {
            console.warn('[Bandwidth Detector] Network Information API not supported');
            // Fallback to manual testing
            this.performManualTest();
        }
    }

    /**
     * Update bandwidth info from Network Information API
     */
    private updateBandwidthInfo(): void {
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            
            const downlink = connection.downlink || 10; // Mbps
            const rtt = connection.rtt || 100; // ms
            const effectiveType = connection.effectiveType || 'unknown';

            this.bandwidthInfo = {
                downlink,
                rtt,
                effectiveType,
                quality: this.determineQuality(downlink, rtt),
            };

            console.log('[Bandwidth Detector] Updated:', this.bandwidthInfo);
            this.notifyListeners();
        }
    }

    /**
     * Perform manual bandwidth test (fallback)
     */
    private async performManualTest(): Promise<void> {
        try {
            const startTime = Date.now();
            const response = await fetch('/api/bandwidth-test', { method: 'HEAD' });
            const rtt = Date.now() - startTime;

            // Rough estimate based on RTT
            let downlink = 10;
            if (rtt < 50) downlink = 20;
            else if (rtt < 100) downlink = 10;
            else if (rtt < 200) downlink = 5;
            else downlink = 2;

            this.bandwidthInfo = {
                downlink,
                rtt,
                effectiveType: 'unknown',
                quality: this.determineQuality(downlink, rtt),
            };

            this.notifyListeners();
        } catch (error) {
            console.error('[Bandwidth Detector] Manual test failed:', error);
        }
    }

    /**
     * Determine quality level based on bandwidth
     */
    private determineQuality(downlink: number, rtt: number): 'high' | 'medium' | 'low' {
        if (downlink >= 5 && rtt < 150) return 'high';
        if (downlink >= 2 && rtt < 300) return 'medium';
        return 'low';
    }

    /**
     * Get current bandwidth info
     */
    getBandwidthInfo(): BandwidthInfo | null {
        if (!this.bandwidthInfo) {
            this.updateBandwidthInfo();
        }
        return this.bandwidthInfo;
    }

    /**
     * Subscribe to bandwidth changes
     */
    subscribe(callback: (info: BandwidthInfo) => void): () => void {
        this.listeners.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        if (this.bandwidthInfo) {
            this.listeners.forEach(callback => callback(this.bandwidthInfo!));
        }
    }

    /**
     * Get recommended quality preset based on current bandwidth
     */
    getRecommendedQuality(): 'LOW' | 'MEDIUM' | 'HIGH' {
        const info = this.getBandwidthInfo();
        
        if (!info) return 'MEDIUM';
        
        switch (info.quality) {
            case 'high':
                return 'HIGH';
            case 'medium':
                return 'MEDIUM';
            case 'low':
                return 'LOW';
            default:
                return 'MEDIUM';
        }
    }

    /**
     * Monitor WebRTC connection stats
     */
    async monitorWebRTCStats(peerConnection: RTCPeerConnection): Promise<void> {
        if (!peerConnection) return;

        try {
            const stats = await peerConnection.getStats();
            let bytesReceived = 0;
            let packetLoss = 0;

            stats.forEach((report) => {
                if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                    bytesReceived = report.bytesReceived || 0;
                    packetLoss = report.packetsLost || 0;
                }
            });

            console.log('[Bandwidth Detector] WebRTC Stats:', {
                bytesReceived,
                packetLoss,
            });
        } catch (error) {
            console.error('[Bandwidth Detector] Failed to get WebRTC stats:', error);
        }
    }
}
