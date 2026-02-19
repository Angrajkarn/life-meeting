"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type PermissionState = "prompt" | "granted" | "denied" | "unknown";

export interface MediaDevice {
    deviceId: string;
    kind: MediaDeviceKind;
    label: string;
    groupId: string;
}

export interface MediaDevicesState {
    cameras: MediaDevice[];
    microphones: MediaDevice[];
    speakers: MediaDevice[];
    selectedCamera: string | null;
    selectedMicrophone: string | null;
    selectedSpeaker: string | null;
    cameraPermission: PermissionState;
    microphonePermission: PermissionState;
    isEnumerating: boolean;
    error: string | null;
}

export interface UseMediaDevicesResult extends MediaDevicesState {
    enumerateDevices: () => Promise<void>;
    requestCameraPermission: () => Promise<boolean>;
    requestMicrophonePermission: () => Promise<boolean>;
    selectCamera: (deviceId: string) => void;
    selectMicrophone: (deviceId: string) => void;
    selectSpeaker: (deviceId: string) => void;
    hasCamera: boolean;
    hasMicrophone: boolean;
}

export function useMediaDevices(): UseMediaDevicesResult {
    const [state, setState] = useState<MediaDevicesState>({
        cameras: [],
        microphones: [],
        speakers: [],
        selectedCamera: null,
        selectedMicrophone: null,
        selectedSpeaker: null,
        cameraPermission: "unknown",
        microphonePermission: "unknown",
        isEnumerating: false,
        error: null,
    });

    const permissionCheckRef = useRef<boolean>(false);

    // Check existing permissions on mount
    useEffect(() => {
        const checkPermissions = async () => {
            if (permissionCheckRef.current) return;
            permissionCheckRef.current = true;

            try {
                // Check camera permission
                if (navigator.permissions) {
                    try {
                        const cameraPermission = await navigator.permissions.query({ name: "camera" as PermissionName });
                        const micPermission = await navigator.permissions.query({ name: "microphone" as PermissionName });
                        
                        setState(prev => ({
                            ...prev,
                            cameraPermission: cameraPermission.state as PermissionState,
                            microphonePermission: micPermission.state as PermissionState,
                        }));

                        // Listen for permission changes
                        cameraPermission.addEventListener("change", () => {
                            setState(prev => ({
                                ...prev,
                                cameraPermission: cameraPermission.state as PermissionState,
                            }));
                        });

                        micPermission.addEventListener("change", () => {
                            setState(prev => ({
                                ...prev,
                                microphonePermission: micPermission.state as PermissionState,
                            }));
                        });
                    } catch (err) {
                        console.log("[useMediaDevices] Permission API not fully supported, will check on request");
                    }
                }

                // Enumerate devices (labels will be empty without permission)
                await enumerateDevices();
            } catch (error) {
                console.error("[useMediaDevices] Error checking permissions:", error);
            }
        };

        checkPermissions();
    }, []);

    const enumerateDevices = useCallback(async () => {
        console.log("[useMediaDevices] Enumerating devices...");
        setState(prev => ({ ...prev, isEnumerating: true, error: null }));

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            console.log(`[useMediaDevices] Found ${devices.length} devices`);

            const cameras: MediaDevice[] = [];
            const microphones: MediaDevice[] = [];
            const speakers: MediaDevice[] = [];

            devices.forEach((device) => {
                const mediaDevice: MediaDevice = {
                    deviceId: device.deviceId,
                    kind: device.kind,
                    label: device.label || `${device.kind} (${device.deviceId.slice(0, 8)})`,
                    groupId: device.groupId,
                };

                if (device.kind === "videoinput") {
                    cameras.push(mediaDevice);
                } else if (device.kind === "audioinput") {
                    microphones.push(mediaDevice);
                } else if (device.kind === "audiooutput") {
                    speakers.push(mediaDevice);
                }
            });

            setState(prev => ({
                ...prev,
                cameras,
                microphones,
                speakers,
                selectedCamera: prev.selectedCamera || (cameras[0]?.deviceId ?? null),
                selectedMicrophone: prev.selectedMicrophone || (microphones[0]?.deviceId ?? null),
                selectedSpeaker: prev.selectedSpeaker || (speakers[0]?.deviceId ?? null),
                isEnumerating: false,
            }));

            console.log(`[useMediaDevices] Cameras: ${cameras.length}, Mics: ${microphones.length}, Speakers: ${speakers.length}`);
        } catch (error) {
            console.error("[useMediaDevices] Enumeration error:", error);
            setState(prev => ({
                ...prev,
                isEnumerating: false,
                error: "Failed to enumerate devices",
            }));
        }
    }, []);

    const requestCameraPermission = useCallback(async (): Promise<boolean> => {
        console.log("[useMediaDevices] Requesting camera permission...");
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log("[useMediaDevices] Camera permission granted");
            
            // Stop the stream immediately - this was just for permission
            stream.getTracks().forEach(track => track.stop());
            
            setState(prev => ({ ...prev, cameraPermission: "granted" }));
            
            // Re-enumerate to get device labels
            await enumerateDevices();
            
            return true;
        } catch (error: any) {
            console.error("[useMediaDevices] Camera permission denied:", error);
            
            setState(prev => ({
                ...prev,
                cameraPermission: error.name === "NotAllowedError" ? "denied" : "unknown",
                error: error.name === "NotAllowedError" 
                    ? "Camera permission denied" 
                    : "Camera not available",
            }));
            
            return false;
        }
    }, [enumerateDevices]);

    const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
        console.log("[useMediaDevices] Requesting microphone permission...");
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("[useMediaDevices] Microphone permission granted");
            
            // Stop the stream immediately
            stream.getTracks().forEach(track => track.stop());
            
            setState(prev => ({ ...prev, microphonePermission: "granted" }));
            
            // Re-enumerate to get device labels
            await enumerateDevices();
            
            return true;
        } catch (error: any) {
            console.error("[useMediaDevices] Microphone permission denied:", error);
            
            setState(prev => ({
                ...prev,
                microphonePermission: error.name === "NotAllowedError" ? "denied" : "unknown",
                error: error.name === "NotAllowedError" 
                    ? "Microphone permission denied" 
                    : "Microphone not available",
            }));
            
            return false;
        }
    }, [enumerateDevices]);

    const selectCamera = useCallback((deviceId: string) => {
        console.log(`[useMediaDevices] Selected camera: ${deviceId}`);
        setState(prev => ({ ...prev, selectedCamera: deviceId }));
    }, []);

    const selectMicrophone = useCallback((deviceId: string) => {
        console.log(`[useMediaDevices] Selected microphone: ${deviceId}`);
        setState(prev => ({ ...prev, selectedMicrophone: deviceId }));
    }, []);

    const selectSpeaker = useCallback((deviceId: string) => {
        console.log(`[useMediaDevices] Selected speaker: ${deviceId}`);
        setState(prev => ({ ...prev, selectedSpeaker: deviceId }));
    }, []);

    // Listen for device changes
    useEffect(() => {
        const handleDeviceChange = () => {
            console.log("[useMediaDevices] Device change detected");
            enumerateDevices();
        };

        navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

        return () => {
            navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
        };
    }, [enumerateDevices]);

    return {
        ...state,
        enumerateDevices,
        requestCameraPermission,
        requestMicrophonePermission,
        selectCamera,
        selectMicrophone,
        selectSpeaker,
        hasCamera: state.cameras.length > 0,
        hasMicrophone: state.microphones.length > 0,
    };
}
