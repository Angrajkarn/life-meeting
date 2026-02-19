"use client";

import { useEffect, useRef, useState } from 'react';
import { useSFU } from '../../../hooks/useSFU';
import { useParams } from 'next/navigation';

export default function SFUPage() {
    const params = useParams();
    const id = params?.id as string;
    // Ensure stable peerId across renders
    const [peerId] = useState(() => 'user-' + Math.floor(Math.random() * 1000));

    const { connected, produce, remoteTracks } = useSFU(id, peerId);
    
    const videoRef = useRef<HTMLVideoElement>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            const track = stream.getVideoTracks()[0];
            await produce(track);
        } catch (err) {
            console.error('Camera Error:', err);
        }
    };

    return (
        <div className="p-8">
             <h1 className="text-2xl font-bold mb-4">SFU Test Room: {id}</h1>
             <div className="mb-4">
                 Status: <span className={connected ? 'text-green-500' : 'text-red-500'}>
                     {connected ? 'Connected to SFU' : 'Disconnected'}
                 </span>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                 <div className="border p-4 rounded">
                     <h2 className="mb-2 font-semibold">Local Video</h2>
                     <video ref={videoRef} autoPlay playsInline muted className="w-full bg-black aspect-video" />
                     <button 
                        onClick={startCamera}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                     >
                         Start Camera & Produce
                     </button>
                 </div>
                 
                 <div className="border p-4 rounded">
                     <h2 className="mb-2 font-semibold">Remote Participants ({remoteTracks.length})</h2>
                     <div className="grid gap-2">
                        {remoteTracks.map((item) => (
                            <RemoteVideo key={item.producerId} track={item.track} />
                        ))}
                        {remoteTracks.length === 0 && (
                            <div className="text-gray-500 italic">
                                No remote streams yet. Open this page in a second tab to test!
                            </div>
                        )}
                     </div>
                 </div>
             </div>
        </div>
    );
}

function RemoteVideo({ track }: { track: MediaStreamTrack }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = new MediaStream([track]);
        }
    }, [track]);

    return (
        <div className="relative">
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted // Critical for autoplay policy
                controls // Helpful for debugging
                className="w-full bg-black aspect-video object-cover" 
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Track: {track.id.slice(0, 8)}... ({track.readyState})
            </div>
        </div>
    );
}
