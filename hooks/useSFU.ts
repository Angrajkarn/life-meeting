import { useEffect, useRef, useState } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import io, { Socket } from 'socket.io-client';

// Use LAN IP for better connectivity
const SFU_URL = 'http://10.29.85.198:4000';

// Promisified Socket Request Helper
const request = (socket: Socket, type: string, data: any = {}) => {
    return new Promise<any>((resolve, reject) => {
        socket.emit(type, data, (response: any) => {
             if (response?.error) reject(response.error);
             else resolve(response);
        });
    });
};

export const useSFU = (roomId: string, peerId: string) => {
    const [connected, setConnected] = useState(false);
    const [peers, setPeers] = useState<string[]>([]);
    
    // Mediasoup Refs
    const socketRef = useRef<Socket | null>(null);
    const deviceRef = useRef<mediasoupClient.types.Device | null>(null);
    const producerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const consumerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());

    useEffect(() => {
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

        socket.on('newProducer', async ({ producerId, producerPeerId }: any) => {
            console.log('New Producer:', producerId, 'from:', producerPeerId);
            await consumeStream(producerId, producerPeerId);
        });

        socket.on('producerClosed', ({ producerId }: any) => {
            console.log('Producer Closed:', producerId);
            setRemoteTracks(prev => prev.filter(t => t.producerId !== producerId));
        });
        
        // Cleanup
        return () => {
             socket.disconnect();
        };
    }, [roomId, peerId]);

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
        for (const { producerId } of existingProducers) {
            await consumeStream(producerId);
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



    const [remoteTracks, setRemoteTracks] = useState<{ producerId: string, track: MediaStreamTrack }[]>([]);

    const localProducerIdRef = useRef<string | null>(null);

    const consumeStream = async (producerId: string, producerPeerId?: string) => {
        // Prevent duplicate consumption
        if (remoteTracks.some(t => t.producerId === producerId)) return;
        
        // Prevent consuming self (Robust check using peerId)
        if (producerPeerId === peerId) return;
        // Fallback check (if peerId not provided or race condition handled differently)
        if (localProducerIdRef.current === producerId) return;

        const socket = socketRef.current!;
        const device = deviceRef.current!;
        const transport = consumerTransportRef.current!;

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
         });
         
         consumersRef.current.set(consumer.id, consumer);

         setRemoteTracks(prev => [...prev, { producerId, track: consumer.track }]);

         consumer.on('transportclose', () => {
            console.log('Consumer transport closed');
         });
    };

    const produce = async (track: MediaStreamTrack) => {
        if (!producerTransportRef.current) return;
        
        try {
            const producer = await producerTransportRef.current.produce({ 
                track,
                // Force simple encoding to ensure bits are sent
                encodings: [
                    { maxBitrate: 500000, scaleResolutionDownBy: 1 }
                ]
            });
            console.log('Producer created:', producer.id);
            localProducerIdRef.current = producer.id;
        } catch (err) {
            console.error('Produce Error:', err);
        }
    };

    return { connected, produce, remoteTracks };
};
