import { useEffect, useRef, useState, useCallback } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import io, { Socket } from 'socket.io-client';

// Use localhost for development
const SFU_URL = 'http://localhost:4000';

// Promisified Socket Request Helper
const request = (socket: Socket, type: string, data: any = {}) => {
    return new Promise<any>((resolve, reject) => {
        socket.emit(type, data, (response: any) => {
             if (response?.error) reject(response.error);
             else resolve(response);
        });
    });
};

export const useSFU = (roomId: string, peerId: string, options: { skip?: boolean } = {}) => {
    const [connected, setConnected] = useState(false);
    const [peers, setPeers] = useState<string[]>([]);
    const [localWebcamStream, setLocalWebcamStream] = useState<MediaStream | null>(null);
    const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
    
    // Legacy localStream getter (returns webcam if available, else screen)
    const localStream = localWebcamStream || localScreenStream; 
    
    // Mediasoup Refs
    const socketRef = useRef<Socket | null>(null);
    const deviceRef = useRef<mediasoupClient.types.Device | null>(null);
    const producerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const consumerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());

    // ... (useEffect and createTransport helpers remain same, skipping to produce)
    // NOTE: I am not replacing lines 30-160 here, assuming they are fine.
    // Wait, the tool requires me to match TargetContent.
    // I can't skip lines in ReplacementContent if I target a large block.
    // I will target specific blocks.

    // BLOCK 1: State
    
    // ...
    
    // BLOCK 2: produce/stopProducing/toggles


    useEffect(() => {
        if (options.skip) return;

        // Enable mediasoup-client logs (critical for debugging)
        // @ts-ignore
        window.localStorage.setItem('debug', 'mediasoup-client:*');

        // 1. Connect to Signal Server
        const socket = io(SFU_URL, {
            query: { roomId, peerId }
        });
        socketRef.current = socket;

        socket.on('connect', async () => {
            console.log('Connected to SFU');
            setConnected(true);
            await joinRoom();
        });

        // 1.5 Setup Heartbeat
        const heartbeatInterval = setInterval(() => {
            if (socket.connected) {
                socket.emit('heartbeat');
            }
        }, 10000); // 10 seconds

        socket.on('newProducer', async ({ producerId, producerPeerId, appData }: any) => {
            console.log('New Producer:', producerId, 'from:', producerPeerId, 'appData:', appData);
            await consumeStream(producerId, producerPeerId, appData);
        });

        socket.on('producerClosed', ({ producerId }: any) => {
            console.log('Producer Closed:', producerId);
            setRemoteTracks(prev => prev.filter(t => t.producerId !== producerId));
        });
        
         // Cleanup
        return () => {
             console.log('[SFU] Disconnecting and cleaning up resources');
             clearInterval(heartbeatInterval);
             socket.disconnect();
             
             if (producerTransportRef.current) producerTransportRef.current.close();
             if (consumerTransportRef.current) consumerTransportRef.current.close();
             
             producerTransportRef.current = null;
             consumerTransportRef.current = null;
             deviceRef.current = null;
             socketRef.current = null;
             localProducersRef.current.clear();
             consumersRef.current.clear();
             
             setConnected(false);
             setRemoteTracks([]);
        };
    }, [roomId, peerId, options.skip]);

    const joinRoom = async () => {
        const socket = socketRef.current!;

        // 2. Get Router Capabilities
        let routerRtpCapabilities;
        try {
            routerRtpCapabilities = await request(socket, 'getRouterRtpCapabilities');
        } catch (e) {
            console.error("Failed to get RTP caps", e);
            return;
        }
        
        
        // 3. Initialize Device
        // Force Chrome handler because Device Emulation in DevTools tricks mediasoup-client
        // into using Safari handler, which fails on Chrome.
        const device = new mediasoupClient.Device({ handlerName: 'Chrome74' });
        await device.load({ routerRtpCapabilities });
        deviceRef.current = device;

        // 4. Create Send Transport
        await createSendTransport();
        
        // 5. Create Recv Transport
        await createRecvTransport();

        // 6. Consume existing producers
        const existingProducers = await request(socket, 'getProducers');
        for (const { producerId, producerPeerId, appData } of existingProducers) {
            await consumeStream(producerId, producerPeerId, appData);
        }
    };

    const createSendTransport = async () => {
        const socket = socketRef.current!;
        const device = deviceRef.current!;

        const transportOptions = await request(socket, 'createWebRtcTransport', { sender: true });
        
        const transport = device.createSendTransport({
            ...transportOptions,
            iceServers: [ { urls: 'stun:stun.l.google.com:19302' } ]
        });
        producerTransportRef.current = transport;

        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await request(socket, 'connectTransport', {
                    transportId: transport.id,
                    dtlsParameters,
                });
                callback();
            } catch (err) {
                errback(err as Error);
            }
        });

        transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
            try {
                const { id } = await request(socket, 'produce', {
                    transportId: transport.id,
                    kind,
                    rtpParameters,
                });
                callback({ id });
            } catch (err) {
                errback(err as Error);
            }
        });
    };

    const createRecvTransport = async () => {
         const socket = socketRef.current!;
         const device = deviceRef.current!;

         const transportOptions = await request(socket, 'createWebRtcTransport', { sender: false });
         
         const transport = device.createRecvTransport({
            ...transportOptions,
            iceServers: [ { urls: 'stun:stun.l.google.com:19302' } ]
         });
         consumerTransportRef.current = transport;

         transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
             try {
                await request(socket, 'connectTransport', {
                    transportId: transport.id,
                    dtlsParameters,
                });
                callback();
            } catch (err) {
                errback(err as Error);
            }
         });
    };



    const [remoteTracks, setRemoteTracks] = useState<{ producerId: string, producerPeerId: string, track: MediaStreamTrack, appData?: any }[]>([]);

    const localProducersRef = useRef<Map<string, mediasoupClient.types.Producer>>(new Map()); // source -> Producer
    const localProducerIdRef = useRef<string | null>(null); // Legacy, to be removed or mapped to 'webcam'

    const consumeStream = async (producerId: string, producerPeerId?: string, appData?: any) => {
        try {
            // Prevent duplicate consumption
            if (remoteTracks.some(t => t.producerId === producerId)) return;
            
            // Prevent consuming self (Robust check using peerId)
            if (producerPeerId === peerId) return;
            // Fallback check (if peerId not provided or race condition handled differently)
            if (localProducerIdRef.current === producerId) return;

            const socket = socketRef.current!;
            const device = deviceRef.current!;
            const transport = consumerTransportRef.current!;

            if (!device || !transport) {
                console.warn('[Consume] Device or Transport not ready');
                return;
            }

            if (transport.closed) {
                console.warn('[Consume] consumerTransport is closed – skipping');
                return;
            }

            const { rtpCapabilities } = device;

            const data = await request(socket, 'consume', {
                transportId: transport.id,
                producerId,
                rtpCapabilities
            });

            const { id, kind, rtpParameters } = data;

            const consumer = await transport.consume({
                id,
                producerId,
                kind,
                rtpParameters,
                appData // Pass appData to consumer
            });
            
            consumersRef.current.set(consumer.id, consumer);

            console.log('[Consume] Success:', consumer.id, 'Peer:', producerPeerId);
            setRemoteTracks(prev => [...prev, { producerId, producerPeerId: producerPeerId || 'unknown', track: consumer.track, appData }]);

            consumer.on('transportclose', () => {
                console.log('Consumer transport closed');
            });
        } catch (error) {
            console.error('[Consume] Failed to consume stream:', producerId, error);
        }
    };

    const produce = async (source: 'webcam' | 'screen' = 'webcam') => {
        const socket = socketRef.current!;
        const device = deviceRef.current!;
        const transport = producerTransportRef.current!;

        if (!socket || !device || !transport) return;
        
        // Guard against closed transport (can happen on React strict-mode double-mount
        // or if cleanup runs before this async call completes)
        if (transport.closed) {
            console.warn('[SFU] produce() called on closed transport – skipping');
            return;
        }

        try {
            let stream: MediaStream;
            
            if (source === 'screen') {
                stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                setLocalScreenStream(stream);
            } else {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalWebcamStream(stream);
            }

            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            // Produce Video
            if (videoTrack) {
                try {
                    const producer = await transport.produce({ 
                        track: videoTrack,
                        encodings: [{ maxBitrate: source === 'screen' ? 1500000 : 500000, scaleResolutionDownBy: 1 }],
                        appData: { source, mediaType: 'video' }
                    });

                    console.log(`${source} Video Producer created:`, producer.id);
                    
                    localProducersRef.current.set(`${source}-video`, producer); 
                    if (source === 'webcam') {
                        localProducerIdRef.current = producer.id;
                    }

                    producer.on('trackended', () => {
                        console.log('Producer track ended', producer.id);
                        stopProducing(source);
                    });

                    producer.on('transportclose', () => {
                       console.log('Producer transport closed', producer.id);
                       localProducersRef.current.delete(`${source}-video`);
                    });

                    // Handle native track stop (e.g. user clicks "Stop Sharing" in browser UI)
                    videoTrack.onended = () => {
                        console.log('Native track ended', videoTrack.id);
                        stopProducing(source);
                    };

                } catch (err) {
                    console.error('Produce Video Error:', err);
                }
            }

            // Produce Audio (only for webcam for now, or if screen has audio)
            if (audioTrack) {
                try {
                    const producer = await transport.produce({ 
                        track: audioTrack,
                        appData: { source, mediaType: 'audio' }
                    });
                    console.log('Audio Producer created:', producer.id);
                    localProducersRef.current.set(`${source}-audio`, producer);

                    producer.on('transportclose', () => {
                        localProducersRef.current.delete(`${source}-audio`);
                    });
                     
                } catch (err) {
                    console.error('Produce Audio Error:', err);
                }
            }

        } catch (err) {
            console.error('Failed to get media:', err);
        }
    };

    const stopProducing = async (source: 'webcam' | 'screen') => {
        // Stop Video Producer
        const videoProducer = localProducersRef.current.get(`${source}-video`);
        if (videoProducer) {
            videoProducer.close();
            localProducersRef.current.delete(`${source}-video`);
            if (socketRef.current) socketRef.current.emit('producerClosed', { producerId: videoProducer.id });
        }

        // Stop Audio Producer
        const audioProducer = localProducersRef.current.get(`${source}-audio`);
        if (audioProducer) {
            audioProducer.close();
            localProducersRef.current.delete(`${source}-audio`);
            if (socketRef.current) socketRef.current.emit('producerClosed', { producerId: audioProducer.id });
        }

        // Clean up streams
        if (source === 'webcam') {
            localProducerIdRef.current = null;
            if (localWebcamStream) {
                localWebcamStream.getTracks().forEach(t => t.stop());
                setLocalWebcamStream(null);
            }
        } else if (source === 'screen') {
            if (localScreenStream) {
                localScreenStream.getTracks().forEach(t => t.stop());
                setLocalScreenStream(null);
            }
        }
    };

    const toggleMic = useCallback(async (enabled: boolean) => {
        if (localWebcamStream) {
            localWebcamStream.getAudioTracks().forEach(t => {
                t.enabled = enabled;
            });
        }
        
        const producer = localProducersRef.current.get('webcam-audio');
        if (producer && socketRef.current) {
            try {
                if (enabled) {
                    producer.resume();
                    await request(socketRef.current, 'resumeProducer', { producerId: producer.id });
                } else {
                    producer.pause();
                    await request(socketRef.current, 'pauseProducer', { producerId: producer.id });
                }
                console.log(`[SFU] Mic ${enabled ? 'resumed' : 'paused'} successfully`);
            } catch (err) {
                console.error('[SFU] Failed to toggle mic producer:', err);
            }
        }
    }, [localWebcamStream]);

    const toggleVideo = useCallback(async (enabled: boolean) => {
         if (localWebcamStream) {
             localWebcamStream.getVideoTracks().forEach(t => {
                 t.enabled = enabled;
             });
         }

         const producer = localProducersRef.current.get('webcam-video');
         if (producer && socketRef.current) {
             try {
                 if (enabled) {
                     producer.resume();
                     await request(socketRef.current, 'resumeProducer', { producerId: producer.id });
                 } else {
                     producer.pause();
                     await request(socketRef.current, 'pauseProducer', { producerId: producer.id });
                 }
                 console.log(`[SFU] Video ${enabled ? 'resumed' : 'paused'} successfully`);
             } catch (err) {
                 console.error('[SFU] Failed to toggle video producer:', err);
             }
         }
    }, [localWebcamStream]);

    return { connected, produce, stopProducing, remoteTracks, localWebcamStream, localScreenStream, toggleMic, toggleVideo, sfuSocket: socketRef.current };
};
