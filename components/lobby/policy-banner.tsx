"use client";

import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface MeetingPolicy {
    mute_on_entry: boolean;
    camera_on_entry: boolean;
    audio_locked: boolean;
    video_locked: boolean;
    waiting_room_enabled: boolean;
}

interface PolicyBannerProps {
    policy: MeetingPolicy | null;
    isLoading?: boolean;
}

export function PolicyBanner({ policy, isLoading = false }: PolicyBannerProps) {
    if (isLoading) {
        return (
            <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                    Loading meeting settings...
                </AlertDescription>
            </Alert>
        );
    }

    if (!policy) return null;

    const restrictions = [];
    
    if (policy.mute_on_entry) {
        restrictions.push("You will join muted");
    }
    
    if (policy.camera_on_entry === false) {
        restrictions.push("Camera will be off");
    }
    
    if (policy.audio_locked) {
        restrictions.push("Host has locked audio controls");
    }
    
    if (policy.video_locked) {
        restrictions.push("Host has locked video controls");
    }
    
    if (policy.waiting_room_enabled) {
        restrictions.push("You'll join the waiting room first");
    }

    if (restrictions.length === 0) return null;

    return (
        <Alert className="bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
                <span className="font-medium">Meeting Restrictions:</span>{" "}
                {restrictions.join(" • ")}
            </AlertDescription>
        </Alert>
    );
}
