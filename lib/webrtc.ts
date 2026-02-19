import SimplePeer from 'simple-peer';
import { getWebRTCConfig } from './webrtc-config';

export interface PeerSignalData {
    type: 'offer' | 'answer';
    sdp: any;
}

export interface PeerConnectionOptions {
    userId: string;
    initiator: boolean;
    stream?: MediaStream;
    onSignal: (signal: any) => void;
    onStream: (stream: MediaStream) => void;
    onError: (error: Error) => void;
    onClose: () => void;
}

export class PeerConnectionManager {
    private peers: Map<string, SimplePeer.Instance> = new Map();
    private readonly config = getWebRTCConfig();

    /**
     * Create or get a peer connection for a specific user
     */
    createPeer(options: PeerConnectionOptions): SimplePeer.Instance {
        const { userId, initiator, stream, onSignal, onStream, onError, onClose } = options;

        // If peer already exists, destroy it first
        if (this.peers.has(userId)) {
            this.destroyPeer(userId);
        }

        const peer = new SimplePeer({
            initiator,
            trickle: true,
            config: this.config,
            stream: stream || undefined,
        });

        // Handle signaling
        peer.on('signal', (signal) => {
            console.log(`[WebRTC] Signal for peer ${userId}:`, signal.type);
            onSignal(signal);
        });

        // Handle incoming stream
        peer.on('stream', (remoteStream) => {
            console.log(`[WebRTC] Received stream from peer ${userId}`);
            onStream(remoteStream);
        });

        // Handle errors
        peer.on('error', (err) => {
            console.error(`[WebRTC] Error with peer ${userId}:`, err);
            onError(err);
        });

        // Handle close
        peer.on('close', () => {
            console.log(`[WebRTC] Connection closed with peer ${userId}`);
            this.peers.delete(userId);
            onClose();
        });

        this.peers.set(userId, peer);
        return peer;
    }

    /**
     * Handle incoming signal from remote peer
     */
    handleSignal(userId: string, signal: any) {
        const peer = this.peers.get(userId);
        if (peer) {
            try {
                // Check if the signal type matches the expected state
                const peerConnection = (peer as any)._pc;
                
                if (signal.type === 'answer' && peerConnection?.signalingState !== 'have-local-offer') {
                    console.warn(`[WebRTC] Ignoring answer from ${userId}, connection in wrong state: ${peerConnection?.signalingState}`);
                    return;
                }
                
                if (signal.type === 'offer' && peerConnection?.signalingState !== 'stable') {
                    console.warn(`[WebRTC] Ignoring offer from ${userId}, connection in wrong state: ${peerConnection?.signalingState}`);
                    return;
                }
                
                peer.signal(signal);
            } catch (err: any) {
                // Handle specific WebRTC state errors gracefully
                if (err.name === 'InvalidStateError') {
                    console.warn(`[WebRTC] Invalid state for ${userId}, ignoring signal:`, err.message);
                } else if (err.name === 'OperationError' && (err.message?.includes('addIceCandidate') || err.message?.includes('processing ICE candidate'))) {
                    console.warn(`[WebRTC] ICE candidate race condition for ${userId} (safely ignored):`, err.message);
                } else {
                    console.error(`[WebRTC] Error handling signal from ${userId}:`, err);
                }
            }
        } else {
            console.warn(`[WebRTC] No peer found for ${userId} to handle signal`);
        }
    }

    /**
     * Add a stream to an existing peer connection
     */
    addStream(userId: string, stream: MediaStream) {
        const peer = this.peers.get(userId);
        if (peer) {
            try {
                peer.addStream(stream);
                console.log(`[WebRTC] Added stream to peer ${userId}`);
            } catch (err) {
                console.error(`[WebRTC] Error adding stream to ${userId}:`, err);
            }
        }
    }

    /**
     * Remove a stream from a peer connection
     */
    removeStream(userId: string, stream: MediaStream) {
        const peer = this.peers.get(userId);
        if (peer) {
            try {
                peer.removeStream(stream);
                console.log(`[WebRTC] Removed stream from peer ${userId}`);
            } catch (err) {
                console.error(`[WebRTC] Error removing stream from ${userId}:`, err);
            }
        }
    }

    /**
     * Replace a stream on a peer connection
     */
    replaceStream(userId: string, oldStream: MediaStream | null, newStream: MediaStream) {
        const peer = this.peers.get(userId);
        if (peer) {
            try {
                if (oldStream) {
                    peer.removeStream(oldStream);
                }
                peer.addStream(newStream);
                console.log(`[WebRTC] Replaced stream for peer ${userId}`);
            } catch (err) {
                console.error(`[WebRTC] Error replacing stream for ${userId}:`, err);
            }
        }
    }

    /**
     * Destroy a specific peer connection
     */
    destroyPeer(userId: string) {
        const peer = this.peers.get(userId);
        if (peer) {
            peer.destroy();
            this.peers.delete(userId);
            console.log(`[WebRTC] Destroyed peer ${userId}`);
        }
    }

    /**
     * Destroy all peer connections
     */
    destroyAll() {
        this.peers.forEach((peer, userId) => {
            peer.destroy();
            console.log(`[WebRTC] Destroyed peer ${userId}`);
        });
        this.peers.clear();
    }

    /**
     * Get a peer instance
     */
    getPeer(userId: string): SimplePeer.Instance | undefined {
        return this.peers.get(userId);
    }

    /**
     * Get all peer IDs
     */
    getPeerIds(): string[] {
        return Array.from(this.peers.keys());
    }
}
