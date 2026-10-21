import { Server } from "socket.io";
import { logger } from "./LogTool.js";

let ioInstance = null;

export const initSocket = (httpServer) => {
  if (ioInstance) {
    return ioInstance;
  }

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 50 * 1024 * 1024, // 50MB
  });

  io.on("connection", (socket) => {
    logger.debug(`Socket client connected: ${socket.id}`);

    // Join session-specific room
    socket.on("joinSession", (token) => {
      if (token) {
        socket.join(`session_${token}`);
        logger.debug(`Socket ${socket.id} joined room: session_${token}`);
      }
    });

    // Leave session-specific room
    socket.on("leaveSession", (token) => {
      if (token) {
        socket.leave(`session_${token}`);
        logger.debug(`Socket ${socket.id} left room: session_${token}`);
      }
    });

    socket.on("disconnect", () => {
      logger.debug(`Socket client disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return ioInstance;
};

export const getIo = () => ioInstance;

export const emitToSession = (sessionToken, event, data) => {
  if (!ioInstance) return;
  // Emit to specific session room and to all clients
  ioInstance.to(`session_${sessionToken}`).emit(event, data);
  ioInstance.emit(`global_${event}`, { sessionToken, ...data });
};

export const emitGlobal = (event, data) => {
  if (!ioInstance) return;
  ioInstance.emit(event, data);
};
