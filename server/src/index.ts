import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs/promises";

import { CORS_ORIGINS, PORT } from "./config";

// REST routes (your originals)
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import matchRoutes from "./routes/matches";
import messageRoutes from "./routes/messages";

// Realtime (your original Socket.IO bootstrap)
import { initSocket } from "./realtime/socket";

// Avatar & Upload (the new pieces we added)
import uploadRouter from "./routes/upload";
import avatarRouter from "./routes/avatar";

const app = express();
const server = http.createServer(app);

// ---------- CORS ----------
/**
 * Use your original config-driven CORS.
 * If CORS_ORIGINS is set (comma-separated), only allow those.
 * If not set, reflect the origin for local dev.
 */
const corsOptions: cors.CorsOptions = CORS_ORIGINS.length
  ? {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // same-origin / curl
        if (CORS_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }
  : {
      origin: true, // reflect request origin for dev
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    };

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ---------- Body parsing ----------
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ---------- Static /uploads ----------
const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
async function ensureUploads() {
  try {
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  } catch (e) {
    console.error("[server] ensure uploads dir failed", e);
  }
}
ensureUploads();

// Serve uploaded files (so /uploads/... works)
app.use("/uploads", express.static(UPLOAD_ROOT));
// Convenience when FE proxies /api → BE: also serve under /api/uploads
app.use("/api/uploads", express.static(UPLOAD_ROOT));

// ---------- Health ----------
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ---------- REST routes (original wiring) ----------
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", matchRoutes);
app.use("/api", messageRoutes);

// ---------- Upload & Avatar (new) ----------
app.use("/api/upload", uploadRouter); // POST /api/upload/avatar?persist=1&max=512
app.use("/avatar", avatarRouter); // if your FE hits this path directly

// ---------- Socket.IO (original wiring) ----------
/**
 * IMPORTANT:
 * Your Matches tab depended on the original initSocket behavior
 * (events, rooms, auth hookup). We call your original initializer here
 * and pass the HTTP server so it attaches to the same port & path.
 */
initSocket(server);

// ---------- Start ----------
server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] uploads served from ${UPLOAD_ROOT}`);
});
