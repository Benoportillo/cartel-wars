'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useGame } from './GameContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useGame();

    useEffect(() => {
        // Initialize Socket
        const socketInstance = io({
            path: '/socket.io', // Default path for socket.io
            reconnectionAttempts: 5,
        });

        socketInstance.on('connect', () => {
            console.log('⚡ Socket Connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('🔌 Socket Disconnected');
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // Join User Room when user is available
    useEffect(() => {
        if (socket && user?.telegramId) {
            socket.emit('join_user', user.telegramId);
            console.log(`Joined room: user_${user.telegramId}`);
        }
    }, [socket, user?.telegramId]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
