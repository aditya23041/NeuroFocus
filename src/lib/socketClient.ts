"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// ============================================================
// Socket.io client hook for real-time updates on Monitor page
// ============================================================

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io({
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });
  }
  return globalSocket;
}

export function useSocket(sessionId: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("join_session", sessionId);

    return () => {
      socket.emit("leave_session", sessionId);
    };
  }, [sessionId]);

  const onEvent = useCallback((event: string, handler: (data: unknown) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, []);

  return { socket: socketRef.current, onEvent };
}
