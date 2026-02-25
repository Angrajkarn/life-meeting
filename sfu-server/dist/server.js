"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const mediasoupWorker_1 = require("./lib/mediasoupWorker");
const redis_1 = require("./lib/redis");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
let worker;
let router;
// Local transport map (still needed for direct access to C++ objects)
// Redis stores metadata, but we need the actual Transport object to call .produce()/.consume()
// In a real multi-node setup, we'd check if the transport is on *this* node.
const localTransports = new Map();
const localProducers = new Map();
const localConsumers = new Map();
async function run() {
    try {
        worker = await (0, mediasoupWorker_1.createWorker)();
        // Create a Router (media room)
        // For prototype, we use one global router
        router = await worker.createRouter({ mediaCodecs: config_1.config.mediasoup.router.mediaCodecs });
        console.log('[Mediasoup] Router created:', router.id);
        // Subscribe to global room events (Redis Pub/Sub)
        // For prototype, we assume one room 'demo-room'
        const DEMO_ROOM_ID = 'demo-room';
        await redis_1.redisAdapter.subscribeToRoom(DEMO_ROOM_ID, (msg) => {
            console.log('[Redis] Received:', msg);
            if (msg.type === 'newProducer') {
                // Broadcast to all local clients in this room
                io.to(DEMO_ROOM_ID).emit('newProducer', msg);
            }
            else if (msg.type === 'whiteboard:action') {
                io.to(DEMO_ROOM_ID).emit('whiteboard:action', msg.payload);
            }
            else if (msg.type === 'recording:status') {
                io.to(DEMO_ROOM_ID).emit('recording:status', msg.payload);
            }
        });
        io.on('connection', async (socket) => {
            console.log('Client connected:', socket.id);
            const { roomId, peerId } = socket.handshake.query;
            // Join the Socket.IO room for broadcasting
            const activeRoomId = roomId || DEMO_ROOM_ID;
            socket.join(activeRoomId);
            // Add to Redis Participant Registry
            const pId = peerId || socket.id;
            const participantData = {
                id: pId,
                socketId: socket.id,
                joinedAt: Date.now(),
                lastSeen: Date.now()
            };
            await redis_1.redisAdapter.addParticipant(activeRoomId, participantData);
            // Track heartbeat locally for cleanup
            socket.lastSeen = Date.now();
            socket.activeRoomId = activeRoomId;
            socket.pId = pId;
            // Broadcast Join Event
            await redis_1.redisAdapter.publishRoomEvent(activeRoomId, 'participantJoined', { participant: participantData });
            socket.on('disconnect', async () => {
                console.log('Client disconnected:', socket.id);
                await redis_1.redisAdapter.removeParticipant(activeRoomId, pId);
                // Cleanup Transports
                localTransports.forEach((transport) => {
                    // Check custom appData we added
                    if (transport.appData.socketId === socket.id) {
                        transport.close();
                        localTransports.delete(transport.id);
                    }
                });
                // Cleanup Producers (Remove closed ones)
                localProducers.forEach((producer, id) => {
                    if (producer.closed) {
                        localProducers.delete(id);
                        // Notify others
                        redis_1.redisAdapter.publishRoomEvent(activeRoomId, 'producerClosed', { producerId: id });
                    }
                });
                // Cleanup Consumers
                localConsumers.forEach((consumer, id) => {
                    if (consumer.closed)
                        localConsumers.delete(id);
                });
                // Broadcast Leave Event
                await redis_1.redisAdapter.publishRoomEvent(activeRoomId, 'participantLeft', { participantId: pId });
            });
            // 0. Heartbeat
            socket.on('heartbeat', async () => {
                const now = Date.now();
                socket.lastSeen = now;
                await redis_1.redisAdapter.updateParticipantHeartbeat(activeRoomId, pId, now);
            });
            // 0.5 Whiteboard & Recording Relay
            socket.on('whiteboard:action', async (payload) => {
                // Forward from one client to all others in the room via Redis
                await redis_1.redisAdapter.publishRoomEvent(activeRoomId, 'whiteboard:action', { payload });
            });
            socket.on('recording:status', async (payload) => {
                await redis_1.redisAdapter.publishRoomEvent(activeRoomId, 'recording:status', { payload });
            });
            // 1. Get Router Capabilities
            socket.on('getRouterRtpCapabilities', (_data, callback) => {
                callback(router.rtpCapabilities);
            });
            // 1.5 Get Existing Producers
            socket.on('getProducers', (_data, callback) => {
                const producerList = [];
                localProducers.forEach((producer) => {
                    producerList.push({
                        producerId: producer.id,
                        producerPeerId: producer.appData.peerId,
                        appData: producer.appData
                    });
                });
                callback(producerList);
            });
            // 2. Create Transport (Producer/Consumer)
            socket.on('createWebRtcTransport', async ({ sender }, callback) => {
                try {
                    const transport = await router.createWebRtcTransport({
                        ...config_1.config.mediasoup.webRtcTransport,
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
                        if (state === 'closed')
                            transport.close();
                    });
                    // Detailed debug
                    transport.observer.on('newproducer', (producer) => {
                        console.log('Transport new producer:', producer.id);
                    });
                    // Store local reference
                    localTransports.set(transport.id, transport);
                }
                catch (err) {
                    console.error(err);
                    callback({ error: err.message });
                }
            });
            // 3. Connect Transport
            socket.on('connectTransport', async ({ transportId, dtlsParameters }, callback) => {
                const transport = localTransports.get(transportId);
                if (transport) {
                    await transport.connect({ dtlsParameters });
                    callback();
                }
            });
            // 4. Produce
            socket.on('produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
                const transport = localTransports.get(transportId);
                if (transport) {
                    // Inject peerId from socket context into appData
                    const finalAppData = { ...appData, peerId: pId };
                    const producer = await transport.produce({ kind, rtpParameters, appData: finalAppData });
                    localProducers.set(producer.id, producer);
                    callback({ id: producer.id });
                    // Publish to Redis so OTHER nodes know about this producer
                    await redis_1.redisAdapter.publishRoomEvent(activeRoomId, 'newProducer', {
                        producerId: producer.id,
                        producerPeerId: pId,
                        kind: producer.kind,
                        appData: producer.appData // Pass source info
                    });
                }
            });
            // 5. Consume
            socket.on('consume', async ({ transportId, producerId, rtpCapabilities }, callback) => {
                const transport = localTransports.get(transportId);
                if (!transport) {
                    console.error(`[Consume Failed] Transport ${transportId} not found in localTransports`);
                    return callback({ error: 'Transport not found' });
                }
                try {
                    if (!router.canConsume({ producerId, rtpCapabilities })) {
                        console.error(`[Consume Failed] router.canConsume returned false for producer: ${producerId}`);
                        return callback({ error: 'Cannot consume (producer missing or capabilities mismatch)' });
                    }
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
                }
                catch (err) {
                    console.error('[Consume Failed] Exception during consume:', err);
                    callback({ error: err.message });
                }
            });
        });
        server.listen(config_1.config.listenPort, () => {
            console.log(`SFU Server listening on port ${config_1.config.listenPort}`);
        });
        // --- Peer Synchronization (Heartbeat Cleanup) ---
        setInterval(() => {
            const now = Date.now();
            const sockets = io.sockets.sockets;
            sockets.forEach((socket) => {
                const lastSeen = socket.lastSeen;
                if (lastSeen && now - lastSeen > 30000) { // 30 seconds timeout
                    const pId = socket.pId;
                    const roomId = socket.activeRoomId;
                    console.log(`[Heartbeat Timeout] Disconnecting zombie client: ${pId} (${socket.id})`);
                    // Forcefully disconnect socket (triggers disconnect event, cleaning up Mediasoup and Redis)
                    socket.disconnect(true);
                }
            });
        }, 15000); // Check every 15 seconds
    }
    catch (err) {
        console.error('Failed to start server:', err);
    }
}
run();
