/**
 * Speaking Detection Service
 * 
 * Detects when a participant is speaking using Web Audio API
 * volume analysis with debouncing and cooldown logic.
 */

export class SpeakingDetector {
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private threshold: number = -50; // dB threshold for speaking
  private checkInterval: number = 100; // Check every 100ms
  private minDuration: number = 300; // Minimum speaking duration (ms)
  private cooldown: number = 500; // Cooldown after speaking stops (ms)
  
  private wasSpeaking: boolean = false;
  private speakingStartTime: number = 0;
  private lastSpeakingTime: number = 0;

  /**
   * Start detecting speaking from a media stream
   * 
   * @param stream - MediaStream to analyze
   * @param onSpeakingChange - Callback when speaking state changes
   * @returns Promise<void>
   */
  async start(
    stream: MediaStream,
    onSpeakingChange: (isSpeaking: boolean) => void
  ): Promise<void> {
    // Stop any existing detection
    this.stop();

    try {
      // Create audio context
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      // Check if stream has audio tracks
      if (stream.getAudioTracks().length === 0) {
        console.warn('[SpeakingDetector] Stream has no audio tracks, skipping detection');
        return;
      }

      // Connect stream to analyser
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      // Start periodic volume checks
      this.intervalId = setInterval(() => {
        this.checkVolume(onSpeakingChange);
      }, this.checkInterval);

      console.log('[SpeakingDetector] Started detecting');
    } catch (error) {
      console.error('[SpeakingDetector] Failed to start:', error);
      this.stop();
    }
  }

  /**
   * Check current volume and update speaking state
   */
  private checkVolume(onSpeakingChange: (isSpeaking: boolean) => void): void {
    const volume = this.getVolume();
    const now = Date.now();
    const isSpeakingNow = volume > this.threshold;

    if (isSpeakingNow && !this.wasSpeaking) {
      // Speaking just started
      this.speakingStartTime = now;
    } else if (!isSpeakingNow && this.wasSpeaking) {
      // Speaking just stopped
      const duration = now - this.speakingStartTime;
      
      // Only trigger if spoke for minimum duration
      if (duration >= this.minDuration) {
        this.lastSpeakingTime = now;
        onSpeakingChange(false);
      }
      this.wasSpeaking = false;
    } else if (isSpeakingNow && now - this.speakingStartTime >= this.minDuration) {
      // Currently speaking and met minimum duration
      if (!this.wasSpeaking) {
        // Only trigger if cooldown has passed since last speaking
        if (now - this.lastSpeakingTime >= this.cooldown) {
          onSpeakingChange(true);
          this.wasSpeaking = true;
        }
      }
    }
  }

  /**
   * Calculate current volume in decibels
   * 
   * @returns Volume in dB (-Infinity to 0)
   */
  private getVolume(): number {
    if (!this.analyser) return -Infinity;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / dataArray.length;

    // Convert to decibels
    if (average === 0) return -Infinity;
    const db = 20 * Math.log10(average / 255);
    
    return db;
  }

  /**
   * Stop detecting speaking
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.wasSpeaking = false;
    this.speakingStartTime = 0;
    this.lastSpeakingTime = 0;

    console.log('[SpeakingDetector] Stopped detecting');
  }

  /**
   * Update detection parameters
   */
  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  setMinDuration(duration: number): void {
    this.minDuration = duration;
  }

  setCooldown(cooldown: number): void {
    this.cooldown = cooldown;
  }
}
