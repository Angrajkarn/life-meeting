/**
 * Screen Share Recording Utility
 * Enterprise-grade screen recording with MediaRecorder API
 */

export type RecordingState = 'inactive' | 'recording' | 'paused';

export interface RecordingOptions {
    mimeType?: string;
    videoBitsPerSecond?: number;
    audioBitsPerSecond?: number;
}

export class ScreenRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private recordingStartTime: number = 0;

    /**
     * Start recording a media stream
     */
    async start(stream: MediaStream, options: RecordingOptions = {}): Promise<void> {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            throw new Error('Recording already in progress');
        }

        this.stream = stream;
        this.recordedChunks = [];

        // Determine best supported MIME type
        const mimeType = this.getSupportedMimeType(options.mimeType);
        
        const recorderOptions: MediaRecorderOptions = {
            mimeType,
            videoBitsPerSecond: options.videoBitsPerSecond || 2500000, // 2.5 Mbps default
            audioBitsPerSecond: options.audioBitsPerSecond || 128000,  // 128 kbps default
        };

        this.mediaRecorder = new MediaRecorder(stream, recorderOptions);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            console.log('[Screen Recorder] Recording stopped');
        };

        this.mediaRecorder.onerror = (event) => {
            console.error('[Screen Recorder] Error:', event);
        };

        this.mediaRecorder.start(1000); // Collect data every second
        this.recordingStartTime = Date.now();
        console.log('[Screen Recorder] Recording started with MIME type:', mimeType);
    }

    /**
     * Stop recording and return the recorded blob
     */
    async stop(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                reject(new Error('No active recording'));
                return;
            }

            this.mediaRecorder.onstop = () => {
                const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
                const blob = new Blob(this.recordedChunks, { type: mimeType });
                console.log(`[Screen Recorder] Recording complete: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
                resolve(blob);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Pause recording
     */
    pause(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            console.log('[Screen Recorder] Recording paused');
        }
    }

    /**
     * Resume recording
     */
    resume(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            console.log('[Screen Recorder] Recording resumed');
        }
    }

    /**
     * Get current recording state
     */
    getState(): RecordingState {
        return (this.mediaRecorder?.state as RecordingState) || 'inactive';
    }

    /**
     * Get recording duration in milliseconds
     */
    getDuration(): number {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            return Date.now() - this.recordingStartTime;
        }
        return 0;
    }

    /**
     * Get supported MIME type
     */
    private getSupportedMimeType(preferred?: string): string {
        const types = [
            preferred,
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
            'video/mp4',
        ].filter(Boolean) as string[];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'video/webm'; // Fallback
    }

    /**
     * Download recording as file
     */
    downloadRecording(blob: Blob, filename: string = 'screen-recording.webm'): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Upload recording to server
     */
    async uploadRecording(
        blob: Blob,
        meetingId: string,
        presenterId: string
    ): Promise<Response> {
        const formData = new FormData();
        formData.append('recording', blob);
        formData.append('meeting_id', meetingId);
        formData.append('presenter_id', presenterId);
        formData.append('duration', Math.floor(this.getDuration() / 1000).toString());

        const response = await fetch('/api/recordings/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload recording');
        }

        return response;
    }
}
