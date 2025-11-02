import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import registerSocketEvents from "./socket.js";
import { Config } from "./config.js";
import { loadVaultSecrets } from "./lib/vault.js";
import type { AxiosInstance } from "axios";
import { createClients } from "./lib/clients.js";

// IMPORT NAMESPACES
import { registerChatNamespace } from "./namespaces/chat.js";
import { registerLocationNamespace } from "./namespaces/location.js";

interface Clients {
  frappe: AxiosInstance;
  mapbox: AxiosInstance;
}

export const clients = {} as Clients; // global
dotenv.config();
const app = express();

async function init() {
  // Fetch secrets once at startup
  Config.vault = await loadVaultSecrets();

  // Assign clients for external API endpoints
  Object.assign(clients, createClients());
  console.log("✅ Vault + API clients loaded");
}

await init();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});


// Create namespaces
const chatNS = io.of("/chat");
const locationNS = io.of("/location");

// Register logic
registerChatNamespace(chatNS);
registerLocationNamespace(locationNS);
registerSocketEvents(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Socket.IO server running on port ${PORT}`);
});
