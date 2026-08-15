import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Authenticate socket connection or join user room
    const userId = socket.handshake.query.userId || socket.handshake.auth?.userId;

    if (userId) {
      const userRoom = `user:${userId}`;
      socket.join(userRoom);
      console.log(`🔌 [Socket.IO] Client connected: ${socket.id} joined room ${userRoom}`);

      socket.on('join_user_room', (id) => {
        if (id) {
          socket.join(`user:${id}`);
          console.log(`🔌 [Socket.IO] Client manually joined room user:${id}`);
        }
      });
    }

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn('⚠️ [Socket.IO] Socket.IO instance has not been initialized yet.');
  }
  return io;
};
