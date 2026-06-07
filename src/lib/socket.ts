import { Server as SocketIOServer } from "socket.io";

// ============================================================
// Socket.io server singleton
// Attached to the custom HTTP server in server.ts
// API routes use getIO() to broadcast events.
// ============================================================

let io: SocketIOServer | null = null;

export function initIO(server: import("http").Server): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socketio",
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on("join_session", (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      console.log(`[Socket.io] ${socket.id} joined session:${sessionId}`);
    });

    socket.on("leave_session", (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Broadcast an event to all clients in a session room.
 */
export function broadcastToSession(sessionId: string, event: string, data: unknown): void {
  const server = getIO();
  if (server) {
    server.to(`session:${sessionId}`).emit(event, data);
  }
}

/**
 * Broadcast an event to all connected clients.
 */
export function broadcastGlobal(event: string, data: unknown): void {
  const server = getIO();
  if (server) {
    server.emit(event, data);
  }
}
