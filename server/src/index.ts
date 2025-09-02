import http from "http";
import express from "express";
import cors from "cors";
import { CORS_ORIGIN, PORT } from "./config";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import matchRoutes from "./routes/matches";
import messageRoutes from "./routes/messages";
import { initSocket } from "./realtime/socket";

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

// REST
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", matchRoutes);
app.use("/api", messageRoutes);

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`API + Socket.IO listening on :${PORT}`);
});
