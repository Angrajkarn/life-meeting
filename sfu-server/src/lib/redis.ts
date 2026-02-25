import Redis from 'ioredis';
import { EventEmitter } from 'events';

// Interface for swapping implementations
export interface SignalingAdapter {
    addParticipant(meetingId: string, participant: any): Promise<void>;
    removeParticipant(meetingId: string, participantId: string): Promise<void>;
    getParticipants(meetingId: string): Promise<any[]>;
    publishRoomEvent(meetingId: string, type: string, payload: any): Promise<void>;
    subscribeToRoom(meetingId: string, callback: (message: any) => void): Promise<void>;
    unsubscribeFromRoom(meetingId: string): Promise<void>;
    updateParticipantHeartbeat(meetingId: string, participantId: string, timestamp: number): Promise<void>;
}

// 1. Real Redis Implementation
class RedisSignalingAdapter implements SignalingAdapter {
    private pub: Redis;
    private sub: Redis;
    private cmd: Redis;
    private keyPrefix = 'meet:';
    private channelPrefix = 'channel:meet:';

    constructor(connectionString: string) {
        this.pub = new Redis(connectionString);
        this.sub = new Redis(connectionString);
        this.cmd = new Redis(connectionString);
        
        // Error handling to prevent crash
        const onError = (err: any) => console.warn('[Redis] Connection Error (Switching to Mock not implemented automatically):', err.message);
        this.pub.on('error', onError);
        this.sub.on('error', onError);
        this.cmd.on('error', onError);
    }

    async addParticipant(meetingId: string, participant: any) {
        const key = `${this.keyPrefix}${meetingId}:participants`;
        await this.cmd.hset(key, participant.id, JSON.stringify(participant));
        await this.cmd.expire(key, 86400); 
    }

    async removeParticipant(meetingId: string, participantId: string) {
        const key = `${this.keyPrefix}${meetingId}:participants`;
        await this.cmd.hdel(key, participantId);
    }

    async getParticipants(meetingId: string): Promise<any[]> {
        const key = `${this.keyPrefix}${meetingId}:participants`;
        const data = await this.cmd.hgetall(key);
        return Object.values(data).map(s => JSON.parse(s));
    }

    async publishRoomEvent(meetingId: string, type: string, payload: any) {
        const channel = `${this.channelPrefix}${meetingId}`;
        const message = JSON.stringify({ type, ...payload });
        await this.pub.publish(channel, message);
    }

    async subscribeToRoom(meetingId: string, callback: (message: any) => void) {
        const channel = `${this.channelPrefix}${meetingId}`;
        await this.sub.subscribe(channel);
        this.sub.on('message', (chan, msg) => {
            if (chan === channel) callback(JSON.parse(msg));
        });
    }
    
    async unsubscribeFromRoom(meetingId: string) {
        const channel = `${this.channelPrefix}${meetingId}`;
        await this.sub.unsubscribe(channel);
    }

    async updateParticipantHeartbeat(meetingId: string, participantId: string, timestamp: number) {
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
class InMemorySignalingAdapter implements SignalingAdapter {
    private participants = new Map<string, Map<string, any>>(); // meetingId -> participantId -> data
    private emitter = new EventEmitter();

    constructor() {
        console.warn('⚠️ [Signaling] Using In-Memory Mock Adapter (Redis not available)');
    }

    private getMeetingMap(meetingId: string) {
        if (!this.participants.has(meetingId)) {
            this.participants.set(meetingId, new Map());
        }
        return this.participants.get(meetingId)!;
    }

    async addParticipant(meetingId: string, participant: any) {
        this.getMeetingMap(meetingId).set(participant.id, participant);
    }

    async removeParticipant(meetingId: string, participantId: string) {
        const map = this.participants.get(meetingId);
        if (map) map.delete(participantId);
    }

    async getParticipants(meetingId: string): Promise<any[]> {
        const map = this.participants.get(meetingId);
        return map ? Array.from(map.values()) : [];
    }

    async publishRoomEvent(meetingId: string, type: string, payload: any) {
        this.emitter.emit(`room:${meetingId}`, { type, ...payload });
    }

    async subscribeToRoom(meetingId: string, callback: (message: any) => void) {
        this.emitter.on(`room:${meetingId}`, callback);
    }
    
    async unsubscribeFromRoom(meetingId: string) {
        this.emitter.removeAllListeners(`room:${meetingId}`);
    }

    async updateParticipantHeartbeat(meetingId: string, participantId: string, timestamp: number) {
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
export const redisAdapter = useRedis 
    ? new RedisSignalingAdapter('redis://localhost:6379') 
    : new InMemorySignalingAdapter();
