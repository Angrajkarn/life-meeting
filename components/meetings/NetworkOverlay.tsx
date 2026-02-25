import React, { useEffect, useState } from 'react';
import { Activity, Wifi, Signal, Cpu, Server } from 'lucide-react';

interface NetworkStats {
  rtt: number; // ms
  packetLoss: number; // %
  bitrate: number; // kbps
  resolution: string;
  fps: number;
}

export function NetworkOverlay() {
  const [stats, setStats] = useState<NetworkStats>({
    rtt: 0,
    packetLoss: 0,
    bitrate: 0,
    resolution: 'Unknown',
    fps: 0
  });

  // Simulated WebRTC Stats polling
  // In a full implementation, this would hook into RTCPeerConnection.getStats()
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        rtt: Math.floor(Math.random() * 40) + 15, // 15-55ms
        packetLoss: Math.round(Math.random() * 2 * 10) / 10, // 0-2%
        bitrate: Math.floor(Math.random() * 1000) + 1500, // 1500-2500 kbps
        resolution: '1280x720',
        fps: Math.floor(Math.random() * 5) + 26, // 26-30 fps
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (rtt: number, loss: number) => {
    if (rtt > 100 || loss > 5) return 'text-red-500';
    if (rtt > 50 || loss > 2) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md rounded-lg p-3 w-64 border border-white/10 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 font-mono text-xs">
      <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
        <Activity className="w-4 h-4 text-indigo-400" />
        <span className="font-semibold text-white uppercase tracking-wider text-[10px]">Diagnostics</span>
        <div className={`ml-auto flex items-center gap-1 ${getStatusColor(stats.rtt, stats.packetLoss)}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-white">Live</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5" />
            <span>Ping (RTT)</span>
          </div>
          <span className={`font-semibold ${getStatusColor(stats.rtt, 0)}`}>{stats.rtt} ms</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5" />
            <span>Packet Loss</span>
          </div>
          <span className={`font-semibold ${getStatusColor(0, stats.packetLoss)}`}>{stats.packetLoss}%</span>
        </div>
        
        <div className="flex items-center justify-between text-slate-300 border-t border-white/5 pt-2 mt-2">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5" />
            <span>Bitrate</span>
          </div>
          <span className="font-semibold text-white">{stats.bitrate} kbps</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Video</span>
          </div>
          <span className="font-semibold text-white">{stats.resolution} @ {stats.fps}fps</span>
        </div>
      </div>
    </div>
  );
}
