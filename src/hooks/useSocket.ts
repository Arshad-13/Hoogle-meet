'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_URL || 'http://localhost:3001';

export const useSocket = (roomId?: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const socketInstance = io(SIGNALING_SERVER, {
            transports: ['websocket', 'polling'],
        });

        socketInstance.on('connect', () => {
            console.log('✅ Connected to signaling server', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ Disconnected from signaling server');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setError('Connection failed. Please try again.');
        });

        socketInstance.on('room-full', () => {
            console.error('Room is full');
            setError('This room is full (max 4 participants).');
            socketInstance.disconnect();
        });

        socketInstance.on('server-busy', () => {
            console.error('Server is busy');
            setError('Server is at capacity (1 active meeting max). Please try again later.');
            socketInstance.disconnect();
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return { socket, isConnected, error };
};
