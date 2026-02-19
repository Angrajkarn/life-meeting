"use client";

import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export type HardwareStatus = "ready" | "limited" | "blocked";

interface DeviceStatus {
    label: string;
    status: HardwareStatus;
    message: string;
}

interface HardwareStatusProps {
    cameraStatus: HardwareStatus;
    microphoneStatus: HardwareStatus;
    cameraMessage?: string;
    microphoneMessage?: string;
}

export function HardwareStatus({
    cameraStatus,
    microphoneStatus,
    cameraMessage = "",
    microphoneMessage = "",
}: HardwareStatusProps) {
    const devices: DeviceStatus[] = [
        {
            label: "Camera",
            status: cameraStatus,
            message: cameraMessage,
        },
        {
            label: "Microphone",
            status: microphoneStatus,
            message: microphoneMessage,
        },
    ];

    const getStatusIcon = (status: HardwareStatus) => {
        switch (status) {
            case "ready":
                return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
            case "limited":
                return <AlertCircle className="h-5 w-5 text-amber-600" />;
            case "blocked":
                return <XCircle className="h-5 w-5 text-red-600" />;
        }
    };

    const getStatusColor = (status: HardwareStatus) => {
        switch (status) {
            case "ready":
                return "bg-emerald-50 border-emerald-200";
            case "limited":
                return "bg-amber-50 border-amber-200";
            case "blocked":
                return "bg-red-50 border-red-200";
        }
    };

    const getStatusText = (status: HardwareStatus) => {
        switch (status) {
            case "ready":
                return "Ready";
            case "limited":
                return "Limited";
            case "blocked":
                return "Blocked";
        }
    };

    const overallStatus: HardwareStatus = 
        cameraStatus === "blocked" || microphoneStatus === "blocked"
            ? "blocked"
            : cameraStatus === "limited" || microphoneStatus === "limited"
            ? "limited"
            : "ready";

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Hardware Check</h3>
                <div className="flex items-center gap-2">
                    {getStatusIcon(overallStatus)}
                    <span className="text-sm font-medium text-slate-700">
                        {getStatusText(overallStatus)}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                {devices.map((device) => (
                    <div
                        key={device.label}
                        className={`p-3 rounded-lg border ${getStatusColor(device.status)}`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">
                                {device.label}
                            </span>
                            {getStatusIcon(device.status)}
                        </div>
                        {device.message && (
                            <p className="text-xs text-slate-600 mt-1">{device.message}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
