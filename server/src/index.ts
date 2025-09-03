import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { CORS_ORIGINS, PORT } from "./config";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import matchRoutes from "./routes/matches";
import messageRoutes from "./routes/messages";
import { initSocket } from "./realtime/socket";
import path from "path";
import uploadRouter from "./routes/upload";

const app = express();

// Build a permissive allowlist for local dev (both 5173/5174 + any localhost port)
const DEV_ALLOW = new Set([
  ...CORS_ORIGINS,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
]);

app.use(
  cors({
    origin(origin, cb) {
      // allow server-to-server / curl (no Origin header)
      if (!origin) return cb(null, true);
      // allow any localhost:* to avoid Vite port shuffle during dev
      const isLocalhost =
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
        DEV_ALLOW.has(origin);
      if (isLocalhost) return cb(null, true);
      console.warn("[CORS] blocked Origin:", origin);
      cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Quick health/diagnostics route
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    at: new Date().toISOString(),
    corsOrigins: Array.from(DEV_ALLOW),
  });
});

// REST routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", matchRoutes);
app.use("/api", messageRoutes);

// Socket.IO
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`API + Socket.IO listening on :${PORT}`);
});

// AFTER you create your express app:
app.use("/uploads", (req, res, next) => {
  // serve files from /uploads
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require("express");
  express.static(path.join(process.cwd(), "uploads"))(req, res, next);
});

// And register the upload API:
app.use("/api/upload", uploadRouter);

import messagesRouter from "./routes/messages";
app.use("/api/messages", messagesRouter);
