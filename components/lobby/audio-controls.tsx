"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioLevel } from "@/lib/audioMeter";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MediaDevice } from "@/lib/hooks/useMediaDevices";

interface AudioControlsProps {
    stream: MediaStream | null;
    isMuted: boolean;
    onToggleMute: () => void;
    microphones: MediaDevice[];
    speakers: MediaDevice[];
    selectedMicrophone: string | null;
    selectedSpeaker: string | null;
    onSelectMicrophone: (deviceId: string) => void;
    onSelectSpeaker: (deviceId: string) => void;
    isDisabled?: boolean;
    disabledReason?: string;
}

export function AudioControls({
    stream,
    isMuted,
    onToggleMute,
    microphones,
    speakers,
    selectedMicrophone,
    selectedSpeaker,
    onSelectMicrophone,
    onSelectSpeaker,
    isDisabled = false,
    disabledReason,
}: AudioControlsProps) {
    const audioLevel = useAudioLevel(isMuted ? null : stream);
    const [testingAudio, setTestingAudio] = useState(false);

    const playTestSound = () => {
        setTestingAudio(true);
        
        // Play a test beep using Web Audio API
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 440; // A4 note
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        setTimeout(() => {
            setTestingAudio(false);
            audioContext.close();
        }, 500);
    };

    return (
        <div className="space-y-4" role="region" aria-label="Audio controls">
            {/* Microphone Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Microphone</label>
                    <Button
                        onClick={onToggleMute}
                        size="sm"
                        variant={isMuted ? "destructive" : "default"}
                        className="h-8 w-8 p-0"
                        disabled={isDisabled}
                        title={isDisabled ? disabledReason : isMuted ? "Unmute (Ctrl+M)" : "Mute (Ctrl+M)"}
                        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                        aria-pressed={!isMuted}
                    >
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Microphone Selector */}
                <Select
                    value={selectedMicrophone || undefined}
                    onValueChange={onSelectMicrophone}
                    disabled={microphones.length === 0}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select microphone..." />
                    </SelectTrigger>
                    <SelectContent>
                        {microphones.map((mic) => (
                            <SelectItem key={mic.deviceId} value={mic.deviceId}>
                                {mic.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Audio Level Meter */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Input Level</span>
                        {!isMuted && audioLevel > 0 && (
                            <span className="text-emerald-600 font-medium">
                                {Math.round(audioLevel * 100)}%
                            </span>
                        )}
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-75 ${
                                audioLevel > 0.7
                                    ? "bg-red-500"
                                    : audioLevel > 0.4
                                    ? "bg-yellow-500"
                                    : "bg-emerald-500"
                            }`}
                            style={{ width: `${isMuted ? 0 : audioLevel * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Speaker Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Speaker</label>
                    <Button
                        onClick={playTestSound}
                        size="sm"
                        variant="outline"
                        className="h-8 gap-2"
                        disabled={testingAudio || speakers.length === 0}
                    >
                        <Volume2 className="h-4 w-4" />
                        <span className="text-xs">Test</span>
                    </Button>
                </div>

                {/* Speaker Selector */}
                <Select
                    value={selectedSpeaker || undefined}
                    onValueChange={onSelectSpeaker}
                    disabled={speakers.length === 0}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select speaker..." />
                    </SelectTrigger>
                    <SelectContent>
                        {speakers.map((speaker) => (
                            <SelectItem key={speaker.deviceId} value={speaker.deviceId}>
                                {speaker.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Disabled Reason */}
            {isDisabled && disabledReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-xs text-amber-800">{disabledReason}</p>
                </div>
            )}
        </div>
    );
}
