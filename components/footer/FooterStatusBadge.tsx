"use client";

import React, { useEffect, useState } from "react";

type SystemStatus = "operational" | "degraded" | "outage" | "loading";

export function FooterStatusBadge() {
  const [status, setStatus] = useState<SystemStatus>("loading");

  useEffect(() => {
    // Production: fetch from https://status.lifemeeting.com/api/v2/status.json
    // Mocked here as always operational
    const timer = setTimeout(() => setStatus("operational"), 600);
    return () => clearTimeout(timer);
  }, []);

  const config = {
    operational: {
      dot: "bg-emerald-500",
      pulse: "animate-pulse",
      text: "All systems operational",
      textColor: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
    },
    degraded: {
      dot: "bg-amber-500",
      pulse: "",
      text: "Degraded performance",
      textColor: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
    },
    outage: {
      dot: "bg-red-500",
      pulse: "animate-pulse",
      text: "System outage",
      textColor: "text-red-700",
      bg: "bg-red-50 border-red-200",
    },
    loading: {
      dot: "bg-slate-300",
      pulse: "animate-pulse",
      text: "Checking status…",
      textColor: "text-slate-500",
      bg: "bg-slate-50 border-slate-200",
    },
  }[status];

  return (
    <a
      href="https://status.lifemeeting.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-opacity hover:opacity-80 ${config.bg} ${config.textColor}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot} ${config.pulse}`} />
      {config.text}
    </a>
  );
}
