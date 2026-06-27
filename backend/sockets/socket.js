import { Server } from 'socket.io';
import logger from '../utils/logger.js';

let io = null;
const userSockets = new Map(); // Maps userId -> Set of socketIds

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    // Register User to Socket mappings
    socket.on('register', (userId) => {
      if (userId) {
        socket.userId = userId;
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);
        logger.debug(`User registered: ${userId} on socket: ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
      if (socket.userId && userSockets.has(socket.userId)) {
        const sockets = userSockets.get(socket.userId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    });
  });

  return io;
};

// Send real-time events to specific user
export const sendToUser = (userId, eventName, data) => {
  if (io && userSockets.has(userId)) {
    const socketIds = userSockets.get(userId);
    socketIds.forEach((socketId) => {
      io.to(socketId).emit(eventName, data);
    });
    logger.debug(`Realtime event '${eventName}' pushed to User: ${userId}`);
    return true;
  }
  return false;
};

// Broadcast event to all sockets
export const broadcast = (eventName, data) => {
  if (io) {
    io.emit(eventName, data);
    logger.debug(`Realtime broadcast: ${eventName}`);
  }
};
