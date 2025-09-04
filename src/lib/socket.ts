// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(token: string) {
  // Reuse if the token didn't change
  if (socket && currentToken === token) return socket;

  // Tear down old socket if token changed
  if (socket && currentToken !== token) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch {}
    socket = null;
  }

  currentToken = token || null;

  // Create socket with token in handshake auth
  socket = io("http://localhost:8080", {
    path: "/socket.io",
    transports: ["websocket", "polling"], // allow polling fallback
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    auth: token ? { token } : {},
  });

  // ===== DEBUG LOGS =====
  socket.on("connect", () => {
    console.log("[socket] connected", socket?.id, { authed: Boolean(token) });
  });
  socket.on("connect_error", (err: any) => {
    console.warn("[socket] connect_error", err?.message || err);
  });
  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected:", reason);
  });

  // Log ALL events we receive from server
  socket.onAny((event, ...args) => {
    try {
      const preview =
        args && args.length ? JSON.stringify(args[0]).slice(0, 200) : "";
      console.log(`[socket] -> ${event}`, preview);
    } catch {
      console.log(`[socket] -> ${event}`, args?.[0]);
    }
  });
  // ===== /DEBUG LOGS =====

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

// Optional: call this anywhere in the app (e.g., open Matches tab) to test round-trip
export function debugPing() {
  const s = socket;
  if (!s) {
    console.warn("[socket] debugPing: no socket yet");
    return;
  }
  s.emit("debug:ping", { t: Date.now() });
}
