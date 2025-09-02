// src/lib/socket.ts
import { io, Socket } from "socket.io-client";
import { API_URL } from "./apiClient";

let socket: Socket | null = null;

export function connectSocket() {
  if (socket) return socket;
  socket = io(API_URL, {
    transports: ["websocket"], // avoids long-polling flakiness locally
    auth: { token: localStorage.getItem("token") || "" },
  });
  // optional: simple log hooks
  socket.on("connect", () => console.log("socket connected", socket?.id));
  socket.on("disconnect", (reason) =>
    console.log("socket disconnected", reason)
  );
  return socket;
}

export function getSocket() {
  return socket ?? connectSocket();
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
