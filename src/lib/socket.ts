// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(token: string) {
  if (socket && currentToken === token) return socket;

  // If there is an old socket with a different token, kill it
  if (socket && currentToken !== token) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch {}
    socket = null;
  }

  currentToken = token;
  socket = io("http://localhost:8080", {
    autoConnect: true,
    reconnection: true,
    transports: ["websocket"],
    auth: { token },
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.removeAllListeners();
    socket.disconnect();
  } catch {}
  socket = null;
  currentToken = null;
}
