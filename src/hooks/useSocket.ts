'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_URL || 'http://localhost:3001';

export const useSocket = (roomId?: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Prevent double-connection in React Strict Mode
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Guard against Strict Mode double-invocation
        if (socketRef.current) return;

        const socketInstance = io(SIGNALING_SERVER, {
            transports: ['websocket', 'polling'],
            // Reconnect automatically — handles Railway free tier cold starts
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = socketInstance;

        socketInstance.on('connect', () => {
            console.log('✅ Connected to signaling server', socketInstance.id);
            setIsConnected(true);
            setError(null); // Clear any previous connection errors on reconnect
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('❌ Disconnected from signaling server:', reason);
            setIsConnected(false);
        });

        socketInstance.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Reconnected to signaling server (attempt ${attemptNumber})`);
            // Note: isConnected is set to true by the 'connect' event above,
            // which fires after every reconnect. The room page listens to
            // isConnected to re-emit join-room, so reconnects are handled there.
        });

        socketInstance.on('reconnect_attempt', (attemptNumber) => {
            console.log(`⏳ Reconnecting... attempt ${attemptNumber}`);
        });

        socketInstance.on('reconnect_error', (err) => {
            console.error('Reconnect error:', err);
        });

        socketInstance.on('reconnect_failed', () => {
            setError('Connection lost. Please refresh the page.');
        });

        socketInstance.on('connect_error', (err) => {
            console.error('Connection error:', err);
            setError('Connection failed. Please try again.');
        });

        socketInstance.on('room-full', () => {
            console.error('Room is full');
            setError('This room is full (max 4 participants).');
            socketInstance.disconnect();
        });

        socketInstance.on('server-busy', () => {
            console.error('Server is busy');
            setError('Server is at capacity (1 active meeting). Please try again later.');
            socketInstance.disconnect();
        });

        setSocket(socketInstance);

        return () => {
            console.log('🛑 Cleaning up socket');
            socketInstance.disconnect();
            socketRef.current = null;
        };
    }, []); // Empty deps — create socket once on mount

    return { socket, isConnected, error };
};
