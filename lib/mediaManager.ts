/**
 * Media Stream Manager
 * Centralized management of WebRTC media streams for the lobby
 */

export interface MediaStreamConfig {
    audio: boolean | MediaTrackConstraints;
    video: boolean | MediaTrackConstraints;
}

export interface StreamState {
    stream: MediaStream | null;
    isActive: boolean;
    error: string | null;
}

class MediaStreamManager {
    private currentStream: MediaStream | null = null;
    private isAcquiring: boolean = false;
    private pendingStreamPromise: Promise<MediaStream> | null = null;

    /**
     * Request a media stream with specified constraints
     */
    async getStream(config: MediaStreamConfig): Promise<MediaStream> {
        console.log("[MediaStreamManager] Requesting stream:", config);

        // If already acquiring, return the existing promise
        if (this.pendingStreamPromise) {
             console.log("[MediaStreamManager] Stream acquisition in progress, returning pending promise");
             return this.pendingStreamPromise;
        }

        // Create a new promise for the stream acquisition
        this.pendingStreamPromise = (async () => {
            // Stop any existing stream first
            this.stopStream();

            this.isAcquiring = true;

            try {
                const stream = await navigator.mediaDevices.getUserMedia(config);
                this.currentStream = stream;
                console.log(`[MediaStreamManager] Stream acquired with ${stream.getTracks().length} tracks`);
                return stream;
            } catch (error: any) {
                console.error("[MediaStreamManager] Failed to get stream:", error);
                throw new Error(this.getErrorMessage(error));
            } finally {
                this.isAcquiring = false;
                this.pendingStreamPromise = null; // Clear promise when done
            }
        })();

        return this.pendingStreamPromise;
    }

    /**
     * Get video stream for preview
     */
    async getVideoPreview(deviceId?: string): Promise<MediaStream> {
        const constraints: MediaStreamConfig = {
            video: deviceId 
                ? { deviceId: { exact: deviceId } }
                : true,
            audio: false,
        };

        return this.getStream(constraints);
    }

    /**
     * Get audio stream for level detection
     */
    async getAudioStream(deviceId?: string): Promise<MediaStream> {
        const constraints: MediaStreamConfig = {
            audio: deviceId
                ? {
                    deviceId: { exact: deviceId },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
                : {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            video: false,
        };

        return this.getStream(constraints);
    }

    /**
     * Get combined audio+video stream for joining
     */
    async getCombinedStream(
        audioDeviceId?: string,
        videoDeviceId?: string,
        videoEnabled: boolean = true,
        audioEnabled: boolean = true
    ): Promise<MediaStream> {
        const constraints: MediaStreamConfig = {
            audio: audioEnabled
                ? audioDeviceId
                    ? {
                        deviceId: { exact: audioDeviceId },
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                    : {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                : false,
            video: videoEnabled
                ? videoDeviceId
                    ? { deviceId: { exact: videoDeviceId } }
                    : true
                : false,
        };

        return this.getStream(constraints);
    }

    /**
     * Stop the current stream and release all tracks
     */
    /**
     * Stop the current stream and release all tracks
     * @param stream - Optional specific stream to stop. If provided, checks against currentStream.
     */
    stopStream(stream?: MediaStream): void {
        // If a specific stream is provided for cleanup
        if (stream) {
            console.log("[MediaStreamManager] Stopping specific stream");
            stream.getTracks().forEach(track => {
                track.stop();
                console.log(`[MediaStreamManager] Stopped track: ${track.kind}`);
            });
            
            // Only clear currentStream if it matches the stopped stream
            if (this.currentStream === stream) {
                this.currentStream = null;
            }
            return;
        }

        // Default behavior: stop current stream
        if (this.currentStream) {
            console.log("[MediaStreamManager] Stopping current stream");
            this.currentStream.getTracks().forEach(track => {
                track.stop();
                console.log(`[MediaStreamManager] Stopped track: ${track.kind}`);
            });
            this.currentStream = null;
        }
    }

    /**
     * Switch video device without recreating audio track
     */
    async switchVideoDevice(deviceId: string): Promise<MediaStream> {
        console.log(`[MediaStreamManager] Switching video to device: ${deviceId}`);

        if (!this.currentStream) {
            throw new Error("No active stream to switch");
        }

        // Get audio tracks from current stream
        const audioTracks = this.currentStream.getAudioTracks();

        // Stop and remove existing video tracks
        this.currentStream.getVideoTracks().forEach(track => track.stop());

        // Get new video track
        const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
        });

        // Create new stream with old audio + new video
        const newStream = new MediaStream([
            ...audioTracks,
            ...videoStream.getVideoTracks(),
        ]);

        this.currentStream = newStream;
        return newStream;
    }

    /**
     * Switch audio device without recreating video track
     */
    async switchAudioDevice(deviceId: string): Promise<MediaStream> {
        console.log(`[MediaStreamManager] Switching audio to device: ${deviceId}`);

        if (!this.currentStream) {
            throw new Error("No active stream to switch");
        }

        // Get video tracks from current stream
        const videoTracks = this.currentStream.getVideoTracks();

        // Stop and remove existing audio tracks
        this.currentStream.getAudioTracks().forEach(track => track.stop());

        // Get new audio track
        const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: { exact: deviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
        });

        // Create new stream with new audio + old video
        const newStream = new MediaStream([
            ...audioStream.getAudioTracks(),
            ...videoTracks,
        ]);

        this.currentStream = newStream;
        return newStream;
    }

    /**
     * Get the current active stream
     */
    getCurrentStream(): MediaStream | null {
        return this.currentStream;
    }

    /**
     * Check if currently acquiring a stream
     */
    isAcquiringStream(): boolean {
        return this.isAcquiring;
    }

    /**
     * Convert error to user-friendly message
     */
    private getErrorMessage(error: any): string {
        if (error.name === "NotAllowedError") {
            return "Permission denied. Please allow camera/microphone access.";
        } else if (error.name === "NotFoundError") {
            return "No camera or microphone found.";
        } else if (error.name === "NotReadableError") {
            return "Camera or microphone is already in use by another application.";
        } else if (error.name === "OverconstrainedError") {
            return "The selected device does not meet the requirements.";
        } else {
            return "Failed to access media devices. Please check your browser settings.";
        }
    }
}

// Export singleton instance
export const mediaStreamManager = new MediaStreamManager();
