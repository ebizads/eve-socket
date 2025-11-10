import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis"; // Redis client
import { Config } from "./config.js";
import { loadVaultSecrets } from "./lib/vault.js";
import type { AxiosInstance } from "axios";
import { createClients } from "./lib/clients.js";
import { registerChatNamespace } from "./namespaces/chat.js";
import { registerLocationNamespace } from "./namespaces/location.js";
import { registerBookingNamespace } from "./namespaces/booking.js";
import { registerDriverNamespace } from "./namespaces/driver.js";

interface Clients {
  frappe: AxiosInstance;
  mapbox: AxiosInstance;
  eveApiTest: AxiosInstance;
}

export const clients = {} as Clients;
dotenv.config();

const app = express();

app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.post("/api/webhook/booking-update", (req, res) => {
  console.log("📦 Frappe Webhook received:", req.body);

  try {
    const { booking_id, booking_status, driver_id } = req.body;

    console.log("📦 Processed booking update:", {
      booking_id,
      booking_status,
      driver_id,
    });

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        error: "Missing booking_id",
      });
    }
    const hasDriver = driver_id && driver_id !== "None";
    const hasStatusChange = booking_status && booking_status !== "None";

    if (hasDriver && hasStatusChange) {
      if (io && io.of) {
        const bookingNS = io.of("/booking");

        // Emit to the specific booking room
        bookingNS.to(`booking:${booking_id}`).emit("statusChanged", {
          booking_id,
          status: booking_status, // Map booking_status to status for clients
          driver_id: driver_id,
          timestamp: new Date().toISOString(),
          message: `Driver ${driver_id} has ${booking_status.toLowerCase()} your booking`,
          source: "frappe_webhook",
        });

        // If status is "Accepted", also emit bookingAccepted event
        if (booking_status === "Accepted") {
          bookingNS.emit("bookingAccepted", {
            booking_id,
            driver_id: driver_id,
            timestamp: new Date().toISOString(),
          });
        }

        console.log(
          `✅ Booking ${booking_id} ${booking_status} by driver ${driver_id}`
        );
      }
    } else if (hasDriver && !hasStatusChange) {
      console.log(
        `ℹ️  Driver assigned (${driver_id}) but booking_status still None for ${booking_id}`
      );
    } else if (hasStatusChange && !hasDriver) {
      console.log(
        `ℹ️  Booking_status changed to ${booking_status} but no driver assigned for ${booking_id}`
      );
    } else {
      console.log(`ℹ️  No meaningful changes for ${booking_id}`);
    }

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      booking_id,
      booking_status: booking_status,
      driver_id: driver_id,
      processed: hasDriver && hasStatusChange,
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

async function init() {
  Config.vault = await loadVaultSecrets();
  Object.assign(clients, createClients());
  console.log("✅ Vault + API clients loaded");
}

await init();

// -----------------------------
// Redis Adapter Setup
// -----------------------------
const pubClient = new Redis();
const subClient = pubClient.duplicate();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient),
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Create HTTP + Socket.IO server
console.log("✅ Redis adapter initialized");

pubClient.on("error", (err) => console.error("Redis pubClient error:", err));
subClient.on("error", (err) => console.error("Redis subClient error:", err));

// -----------------------------
// Register Namespaces
// -----------------------------

registerChatNamespace(io.of("/chat"));
registerLocationNamespace(io.of("/location"));
registerBookingNamespace(io); // booking namespace uses default io
registerDriverNamespace(io.of("/driver"), io.of("/booking"));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  const addr = httpServer.address();
  const host = typeof addr === "object" && addr ? addr.address : "localhost";
  const port = typeof addr === "object" && addr ? addr.port : PORT;

  console.log(`✅ Socket.IO server running on port ${port}`);
  console.log(`✅ HTTP routes available on port ${port}`);
  console.log(
    `✅ Webhook endpoint: http://${host}:${port}/api/webhook/booking-update`
  );
});
