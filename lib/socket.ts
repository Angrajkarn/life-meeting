"use client";

import { useEffect, useState, useRef, useCallback } from 'react';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseSocketReturn {
    socket: WebSocket | null;
    status: ConnectionStatus;
    sendMessage: (data: any) => void;
    lastMessage: any;
}

export function useSocket(meetingId: string, userId: string = "guest"): UseSocketReturn {
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 5;
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [lastMessage, setLastMessage] = useState<any>(null);
    const socketRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        // Prevent multiple connections or connecting if missing params
        if (!meetingId || !userId) {
            console.warn(`[WebSocket] Connection skipped - missing params:`, { 
                meetingId: meetingId || 'MISSING', 
                userId: userId || 'MISSING' 
            });
            return;
        }

        // Close existing connection if any
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        setStatus('connecting');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Use window.location.hostname directly - changing it to 127.0.0.1 might cause CORS/Origin mismatches in some browsers
        const hostname = window.location.hostname;
        const port = process.env.NEXT_PUBLIC_API_PORT || '8000';
        const wsUrl = `${protocol}//${hostname}:${port}/ws/${meetingId}/${userId}`;

        console.log(`[WebSocket] Connecting to: ${wsUrl}`);
        console.log(`[WebSocket] Origin: ${window.location.origin}`);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("[WebSocket] Connected successfully");
            setStatus('connected');
            setRetryCount(0); // Reset retries on success
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("[WebSocket] Message:", data);
                setLastMessage(data);
            } catch (err) {
                console.log("[WebSocket] Raw Message:", event.data);
                setLastMessage(event.data);
            }
        };

        ws.onclose = (event) => {
            console.log("[WebSocket] Disconnected", { code: event.code, reason: event.reason, wasClean: event.wasClean });
            setStatus('disconnected');
            socketRef.current = null;

            // Simple retry logic if not closed cleanly/manually
            if (!event.wasClean && retryCount < MAX_RETRIES) {
                const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
                console.log(`[WebSocket] Reconnecting in ${timeout}ms...`);
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, timeout);
            }
        };

        ws.onerror = (error: Event) => {
            // Note: error event is trusted and does not contain detailed info for security reasons in browsers
            console.error("[WebSocket] Error Event:", error);
            console.log("[WebSocket] readyState at error:", ws.readyState);
            
            // Only update status if the connection is definitely failed/closed
            if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
                setStatus('error');
            }
        };

    }, [meetingId, userId, retryCount]);

    useEffect(() => {
        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close(1000, "Component unmounting");
                socketRef.current = null;
            }
        };
    }, [connect]);

    const sendMessage = useCallback((data: any) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            socketRef.current.send(message);
        } else {
            console.warn("[WebSocket] Cannot send, socket not open");
        }
    }, []);

    return { socket: socketRef.current, status, sendMessage, lastMessage };
}
