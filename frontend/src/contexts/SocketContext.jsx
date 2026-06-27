import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to local proxy (proxies socket.io requests to 5000)
    const newSocket = io(window.location.origin, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected with ID:', newSocket.id);
      newSocket.emit('register', user._id);
    });

    // Handle generic real-time notifications
    newSocket.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      
      // Dynamic audio cue if supported by browser
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {}
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  const clearNotifications = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{ socket, notifications, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
