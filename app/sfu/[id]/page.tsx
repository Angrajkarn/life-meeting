"use client";

import { useEffect, useRef, useState } from 'react';
import { useSFU } from '../../../hooks/useSFU';
import { useParams } from 'next/navigation';

export default function SFUPage() {
    const params = useParams();
    const id = params?.id as string;
    // Ensure stable peerId across renders
    const [peerId] = useState(() => 'user-' + Math.floor(Math.random() * 1000));

    const { connected, produce, remoteTracks, localWebcamStream } = useSFU(id, peerId);
    
    const videoRef = useRef<HTMLVideoElement>(null);

    // Effect to attach local stream to video element
    useEffect(() => {
        if (videoRef.current && localWebcamStream) {
            videoRef.current.srcObject = localWebcamStream;
        }
    }, [localWebcamStream]);

    const startCamera = async () => {
        await produce();
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
                     <div className="flex gap-2 mt-2">
                        <button 
                            onClick={() => produce('webcam')}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                            Start Camera
                        </button>
                        <button 
                            onClick={() => produce('screen')}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                            Share Screen
                        </button>
                     </div>
                 </div>
                 
                 <div className="border p-4 rounded">
                     <h2 className="mb-2 font-semibold">Remote Participants ({remoteTracks.length})</h2>
                     <div className="grid gap-2">
                        {remoteTracks.map((t) => (
                           t.track.kind === 'video' ? (
                                <RemoteVideo 
                                    key={t.producerId} 
                                    track={t.track} 
                                    isScreen={t.appData?.source === 'screen'} 
                                />
                           ) : (
                                <RemoteAudio key={t.producerId} track={t.track} />
                           )
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

function RemoteVideo({ track, isScreen }: { track: MediaStreamTrack, isScreen?: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = new MediaStream([track]);
        }
    }, [track]);

    return (
        <div className={`relative ${isScreen ? 'col-span-2 row-span-2' : ''}`}> 
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted // Critical for autoplay policy on video
                controls 
                className={`w-full bg-black ${isScreen ? 'aspect-video object-contain' : 'aspect-video object-cover'}`}
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
                <span>{track.id.slice(0, 8)}... ({track.readyState})</span>
                {isScreen && <span className="bg-green-500 text-white px-1 rounded text-[10px] font-bold">SCREEN</span>}
            </div>
        </div>
    );
}

function RemoteAudio({ track }: { track: MediaStreamTrack }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [autoPlayError, setAutoPlayError] = useState(false);

    useEffect(() => {
        if (audioRef.current) {
            const stream = new MediaStream([track]);
            audioRef.current.srcObject = stream;
            // Attempt to play
            audioRef.current.play().catch(e => {
                console.error("Audio autoplay blocked:", e);
                setAutoPlayError(true);
            });
        }
    }, [track]);

    return (
        <>
            <audio ref={audioRef} autoPlay />
            {autoPlayError && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button 
                        onClick={() => {
                            audioRef.current?.play();
                            setAutoPlayError(false);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded shadow-lg hover:bg-red-700 transition-colors"
                    >
                        Click to Enable Audio from {track.id.slice(0,4)}
                    </button>
                </div>
            )}
        </>
    );
}
