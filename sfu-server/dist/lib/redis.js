"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisAdapter = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const events_1 = require("events");
// 1. Real Redis Implementation
class RedisSignalingAdapter {
    constructor(connectionString) {
        this.keyPrefix = 'meet:';
        this.channelPrefix = 'channel:meet:';
        this.pub = new ioredis_1.default(connectionString);
        this.sub = new ioredis_1.default(connectionString);
        this.cmd = new ioredis_1.default(connectionString);
        // Error handling to prevent crash
        const onError = (err) => console.warn('[Redis] Connection Error (Switching to Mock not implemented automatically):', err.message);
        this.pub.on('error', onError);
        this.sub.on('error', onError);
        this.cmd.on('error', onError);
    }
    async addParticipant(meetingId, participant) {
        const key = `${this.keyPrefix}${meetingId}:participants`;
        await this.cmd.hset(key, participant.id, JSON.stringify(participant));
        await this.cmd.expire(key, 86400);
    }
    async removeParticipant(meetingId, participantId) {
        const key = `${this.keyPrefix}${meetingId}:participants`;
        await this.cmd.hdel(key, participantId);
    }
    async getParticipants(meetingId) {
        const key = `${this.keyPrefix}${meetingId}:participants`;
        const data = await this.cmd.hgetall(key);
        return Object.values(data).map(s => JSON.parse(s));
    }
    async publishRoomEvent(meetingId, type, payload) {
        const channel = `${this.channelPrefix}${meetingId}`;
        const message = JSON.stringify({ type, ...payload });
        await this.pub.publish(channel, message);
    }
    async subscribeToRoom(meetingId, callback) {
        const channel = `${this.channelPrefix}${meetingId}`;
        await this.sub.subscribe(channel);
        this.sub.on('message', (chan, msg) => {
            if (chan === channel)
                callback(JSON.parse(msg));
        });
    }
    async unsubscribeFromRoom(meetingId) {
        const channel = `${this.channelPrefix}${meetingId}`;
        await this.sub.unsubscribe(channel);
    }
    async updateParticipantHeartbeat(meetingId, participantId, timestamp) {
        const key = `${this.keyPrefix}${meetingId}:participants`;
        const dataStr = await this.cmd.hget(key, participantId);
        if (dataStr) {
            const data = JSON.parse(dataStr);
            data.lastSeen = timestamp;
            await this.cmd.hset(key, participantId, JSON.stringify(data));
        }
    }
}
// 2. In-Memory Mock Implementation (Fallback)
class InMemorySignalingAdapter {
    constructor() {
        this.participants = new Map(); // meetingId -> participantId -> data
        this.emitter = new events_1.EventEmitter();
        console.warn('⚠️ [Signaling] Using In-Memory Mock Adapter (Redis not available)');
    }
    getMeetingMap(meetingId) {
        if (!this.participants.has(meetingId)) {
            this.participants.set(meetingId, new Map());
        }
        return this.participants.get(meetingId);
    }
    async addParticipant(meetingId, participant) {
        this.getMeetingMap(meetingId).set(participant.id, participant);
    }
    async removeParticipant(meetingId, participantId) {
        const map = this.participants.get(meetingId);
        if (map)
            map.delete(participantId);
    }
    async getParticipants(meetingId) {
        const map = this.participants.get(meetingId);
        return map ? Array.from(map.values()) : [];
    }
    async publishRoomEvent(meetingId, type, payload) {
        this.emitter.emit(`room:${meetingId}`, { type, ...payload });
    }
    async subscribeToRoom(meetingId, callback) {
        this.emitter.on(`room:${meetingId}`, callback);
    }
    async unsubscribeFromRoom(meetingId) {
        this.emitter.removeAllListeners(`room:${meetingId}`);
    }
    async updateParticipantHeartbeat(meetingId, participantId, timestamp) {
        const map = this.participants.get(meetingId);
        if (map && map.has(participantId)) {
            const participant = map.get(participantId);
            participant.lastSeen = timestamp;
        }
    }
}
// Export Singleton (Defaulting to Mock for stability if no env var)
// In real app, check process.env.REDIS_URL
const useRedis = process.env.USE_REDIS === 'true';
exports.redisAdapter = useRedis
    ? new RedisSignalingAdapter('redis://localhost:6379')
    : new InMemorySignalingAdapter();
