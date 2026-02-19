import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { createWorker } from './lib/mediasoupWorker';
import * as mediasoup from 'mediasoup';
import { types } from 'mediasoup';
import { redisAdapter } from './lib/redis';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let worker: types.Worker;
let router: types.Router;

// Local transport map (still needed for direct access to C++ objects)
// Redis stores metadata, but we need the actual Transport object to call .produce()/.consume()
// In a real multi-node setup, we'd check if the transport is on *this* node.
const localTransports = new Map<string, types.Transport>();
const localProducers = new Map<string, types.Producer>();
const localConsumers = new Map<string, types.Consumer>();

async function run() {
  try {
    worker = await createWorker();
    
    // Create a Router (media room)
    // For prototype, we use one global router
    router = await worker.createRouter({ mediaCodecs: config.mediasoup.router.mediaCodecs });
    console.log('[Mediasoup] Router created:', router.id);

    // Subscribe to global room events (Redis Pub/Sub)
    // For prototype, we assume one room 'demo-room'
    const DEMO_ROOM_ID = 'demo-room';
    
    await redisAdapter.subscribeToRoom(DEMO_ROOM_ID, (msg) => {
        console.log('[Redis] Received:', msg);
        if (msg.type === 'newProducer') {
            // Broadcast to all local clients in this room
            io.to(DEMO_ROOM_ID).emit('newProducer', msg);
        }
    });

    io.on('connection', async (socket) => {
        console.log('Client connected:', socket.id);
        const { roomId, peerId } = socket.handshake.query;
        
        // Join the Socket.IO room for broadcasting
        const activeRoomId = (roomId as string) || DEMO_ROOM_ID;
        socket.join(activeRoomId);

        // Add to Redis Participant Registry
        const pId = (peerId as string) || socket.id;
        const participantData = {
            id: pId,
            socketId: socket.id,
            joinedAt: Date.now()
        };
        await redisAdapter.addParticipant(activeRoomId, participantData);
        
        // Broadcast Join Event
        await redisAdapter.publishRoomEvent(activeRoomId, 'participantJoined', { participant: participantData });

        socket.on('disconnect', async () => {
            console.log('Client disconnected:', socket.id);
            await redisAdapter.removeParticipant(activeRoomId, pId);
            
            // Cleanup Transports
            localTransports.forEach((transport) => {
                // Check custom appData we added
                if ((transport.appData as any).socketId === socket.id) {
                    transport.close();
                    localTransports.delete(transport.id);
                }
            });

            // Cleanup Producers (Remove closed ones)
            localProducers.forEach((producer, id) => {
                if (producer.closed) {
                    localProducers.delete(id);
                    // Notify others
                    redisAdapter.publishRoomEvent(activeRoomId, 'producerClosed', { producerId: id });
                }
            });

            // Cleanup Consumers
            localConsumers.forEach((consumer, id) => {
                if (consumer.closed) localConsumers.delete(id);
            });

            // Broadcast Leave Event
            await redisAdapter.publishRoomEvent(activeRoomId, 'participantLeft', { participantId: pId });
        });

        // 1. Get Router Capabilities
        socket.on('getRouterRtpCapabilities', (_data, callback) => {
            callback(router.rtpCapabilities);
        });

        // 1.5 Get Existing Producers
        socket.on('getProducers', (_data, callback) => {
            const producerList: any[] = [];
            localProducers.forEach((producer) => {
                producerList.push({ producerId: producer.id });
            });
            callback(producerList);
        });

        // 2. Create Transport (Producer/Consumer)
        socket.on('createWebRtcTransport', async ({ sender }, callback) => {
             try {
                const transport = await router.createWebRtcTransport({
                    ...config.mediasoup.webRtcTransport,
                    appData: { socketId: socket.id, peerId: pId }
                });
                
                callback({
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                });

                // Debug Logs
                transport.on('icestatechange', (state) => {
                    console.log(`[Transport ${transport.id}] ICE State: ${state}`);
                });

                transport.on('dtlsstatechange', (state) => {
                    console.log(`[Transport ${transport.id}] DTLS State: ${state}`);
                    if (state === 'closed') transport.close();
                });
                
                // Detailed debug
                transport.observer.on('newproducer', (producer) => {
                    console.log('Transport new producer:', producer.id);
                });

                 // Store local reference
                 localTransports.set(transport.id, transport);

             } catch (err) {
                 console.error(err);
                 callback({ error: (err as any).message });
             }
        });

        // 3. Connect Transport
        socket.on('connectTransport', async ({ transportId, dtlsParameters }: any, callback: any) => {
            const transport = localTransports.get(transportId);
            if (transport) {
                await transport.connect({ dtlsParameters });
                callback();
            }
        });

        // 4. Produce
        socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
             const transport = localTransports.get(transportId);
             if (transport) {
                 const producer = await transport.produce({ kind, rtpParameters });
                 
                 localProducers.set(producer.id, producer);
                 
                 callback({ id: producer.id });
                 
                 // Publish to Redis so OTHER nodes know about this producer
                 await redisAdapter.publishRoomEvent(activeRoomId, 'newProducer', {
                     producerId: producer.id,
                     producerPeerId: pId,
                     kind: producer.kind
                 });
             }
        });
        
        // 5. Consume
        socket.on('consume', async ({ transportId, producerId, rtpCapabilities }, callback) => {
            const transport = localTransports.get(transportId);
             if (transport && router.canConsume({ producerId, rtpCapabilities })) {
                 const consumer = await transport.consume({
                     producerId,
                     rtpCapabilities,
                     paused: true,
                 });
                 
                 localConsumers.set(consumer.id, consumer);

                 callback({
                     id: consumer.id,
                     producerId,
                     kind: consumer.kind,
                     rtpParameters: consumer.rtpParameters,
                 });
                 
                 // Resume consumer
                 await consumer.resume();
             } else {
                 callback({ error: 'Transport not found or cannot consume' });
             }
        });
    });

    server.listen(config.listenPort, () => {
      console.log(`SFU Server listening on port ${config.listenPort}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

run();
