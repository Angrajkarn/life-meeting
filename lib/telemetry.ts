/**
 * Telemetry Service
 * 
 * Collects and reports performance metrics, user interactions,
 * and system health data for analytics and monitoring.
 * 
 * Enterprise features:
 * - Performance monitoring (CPU, memory, FPS)
 * - User engagement tracking (meeting duration, features used)
 * - Error tracking and diagnostics
 * - WebRTC quality metrics (packet loss, jitter, bitrate)
 */

export interface TelemetryEvent {
  category: 'performance' | 'engagement' | 'error' | 'webrtc' | 'feature';
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  cpu: number;  // percentage
  memory: number;  // MB
  fps: number;
  participantCount: number;
  videoTileCount: number;
  offScreenTileCount: number;
}

export interface WebRTCMetrics {
  userId: string;
  connectionState: RTCPeerConnectionState;
  packetsLost: number;
  jitter: number;
  bitrate: number;
  roundTripTime: number;
}

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private meetingId: string | null = null;
  private sessionStartTime: number;
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize the telemetry service
   */
  initialize(userId: string, meetingId: string): void {
    this.userId = userId;
    this.meetingId = meetingId;
    
    this.trackEvent({
      category: 'engagement',
      action: 'session_start',
      metadata: {
        sessionId: this.sessionId,
        userId,
        meetingId,
        timestamp: Date.now()
      }
    });

    console.log('[Telemetry] Initialized:', { userId, meetingId, sessionId: this.sessionId });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Track a telemetry event
   */
  trackEvent(event: TelemetryEvent): void {
    const enrichedEvent = {
      ...event,
      sessionId: this.sessionId,
      userId: this.userId,
      meetingId: this.meetingId,
      timestamp: Date.now()
    };

    this.events.push(enrichedEvent);
    console.log('[Telemetry]', enrichedEvent);

    // In production, send to analytics backend
    // this.sendToBackend(enrichedEvent);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: PerformanceMetrics): void {
    this.trackEvent({
      category: 'performance',
      action: 'metrics_snapshot',
      metadata: metrics
    });
  }

  /**
   * Track WebRTC quality metrics
   */
  trackWebRTCMetrics(metrics: WebRTCMetrics): void {
    this.trackEvent({
      category: 'webrtc',
      action: 'quality_metrics',
      label: metrics.userId,
      metadata: metrics
    });
  }

  /**
   * Track feature usage
   */
  trackFeature(feature: string, action: string, metadata?: Record<string, any>): void {
    this.trackEvent({
      category: 'feature',
      action,
      label: feature,
      metadata
    });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: string): void {
    this.trackEvent({
      category: 'error',
      action: 'error_occurred',
      label: context,
      metadata: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
  }

  /**
   * Initialize performance monitoring using Performance Observer
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Monitor long tasks (>50ms)
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.trackEvent({
              category: 'performance',
              action: 'long_task',
              value: entry.duration,
              metadata: {
                name: entry.name,
                duration: entry.duration
              }
            });
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['longtask', 'measure'] });
    } catch (err) {
      console.warn('[Telemetry] Performance Observer not supported:', err);
    }
  }

  /**
   * Get current performance metrics
   */
  async getCurrentPerformance(): Promise<PerformanceMetrics | null> {
    if (typeof window === 'undefined') return null;

    try {
      const memory = (performance as any).memory;
      
      return {
        cpu: 0, // CPU requires additional API or estimation
        memory: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
        fps: await this.measureFPS(),
        participantCount: 0, // Set externally
        videoTileCount: 0, // Set externally
        offScreenTileCount: 0 // Set externally
      };
    } catch (err) {
      console.error('[Telemetry] Failed to get performance metrics:', err);
      return null;
    }
  }

  /**
   * Measure current FPS
   */
  private async measureFPS(): Promise<number> {
    return new Promise((resolve) => {
      let lastTime = performance.now();
      let frames = 0;
      const duration = 1000; // Measure over 1 second

      const measure = (currentTime: number) => {
        frames++;
        const elapsed = currentTime - lastTime;

        if (elapsed >= duration) {
          const fps = Math.round((frames * 1000) / elapsed);
          resolve(fps);
        } else {
          requestAnimationFrame(measure);
        }
      };

      requestAnimationFrame(measure);
    });
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  /**
   * Get all events
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Get event summary
   */
  getSummary(): {
    totalEvents: number;
    byCategory: Record<string, number>;
    sessionDuration: number;
  } {
    const byCategory: Record<string, number> = {};
    
    this.events.forEach(event => {
      const category = event.category;
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      byCategory,
      sessionDuration: this.getSessionDuration()
    };
  }

  /**
   * Clear all events (for privacy/GDPR compliance)
   */
  clear(): void {
    this.events = [];
    console.log('[Telemetry] Events cleared');
  }

  /**
   * Cleanup on session end
   */
  destroy(): void {
    this.trackEvent({
      category: 'engagement',
      action: 'session_end',
      value: this.getSessionDuration(),
      metadata: this.getSummary()
    });

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    console.log('[Telemetry] Session ended:', this.getSummary());
  }
}

// Singleton instance
let telemetryInstance: TelemetryService | null = null;

export function getTelemetry(): TelemetryService {
  if (!telemetryInstance) {
    telemetryInstance = new TelemetryService();
  }
  return telemetryInstance;
}

export default TelemetryService;
