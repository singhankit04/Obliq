/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
console.log(user)
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!user || !userId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      query: { userId },
      auth: { userId },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log(`🔌 [Socket.IO] Connected: ${socketInstance.id} (User Room: user:${userId})`);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 [Socket.IO] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.IO] Connection error:', err.message);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
