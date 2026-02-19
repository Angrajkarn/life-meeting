/**
 * Audio Level Meter
 * Analyzes audio stream and provides volume levels for visualization
 */

export interface AudioLevelAnalyzer {
    start: () => void;
    stop: () => void;
    getLevel: () => number;
    isRunning: () => boolean;
}

export function createAudioLevelAnalyzer(
    stream: MediaStream,
    callback: (level: number) => void,
    smoothing: number = 0.8
): AudioLevelAnalyzer {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let dataArray: Uint8Array | null = null;
    let animationId: number | null = null;
    let currentLevel: number = 0;
    let running: boolean = false;

    const start = () => {
        if (running) return;

        try {
            // Create audio context
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = smoothing;

            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            // Connect stream to analyser
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);

            running = true;
            console.log("[AudioLevelAnalyzer] Started");

            // Start animation loop
            const updateLevel = () => {
                if (!running || !analyser || !dataArray) return;

                analyser.getByteFrequencyData(dataArray as any);

                // Calculate RMS (Root Mean Square) for more accurate volume
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i] * dataArray[i];
                }
                const rms = Math.sqrt(sum / dataArray.length);

                // Normalize to 0-1 range (assuming max value is 255)
                currentLevel = Math.min(rms / 128, 1);

                callback(currentLevel);

                animationId = requestAnimationFrame(updateLevel);
            };

            updateLevel();
        } catch (error) {
            console.error("[AudioLevelAnalyzer] Failed to start:", error);
            stop();
        }
    };

    const stop = () => {
        if (!running) return;

        running = false;

        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }

        if (analyser) {
            analyser.disconnect();
            analyser = null;
        }

        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        dataArray = null;
        currentLevel = 0;

        console.log("[AudioLevelAnalyzer] Stopped");
    };

    const getLevel = () => currentLevel;

    const isRunning = () => running;

    return {
        start,
        stop,
        getLevel,
        isRunning,
    };
}

/**
 * Hook for using audio level detection in React components
 */
import { useState, useEffect, useRef } from "react";

export function useAudioLevel(stream: MediaStream | null): number {
    const [level, setLevel] = useState(0);
    const analyzerRef = useRef<AudioLevelAnalyzer | null>(null);

    useEffect(() => {
        if (!stream) {
            analyzerRef.current?.stop();
            analyzerRef.current = null;
            setLevel(0);
            return;
        }

        // Create analyzer
        analyzerRef.current = createAudioLevelAnalyzer(
            stream,
            (newLevel) => setLevel(newLevel),
            0.8
        );

        analyzerRef.current.start();

        // Cleanup on unmount
        return () => {
            analyzerRef.current?.stop();
            analyzerRef.current = null;
        };
    }, [stream]);

    return level;
}
