import { Namespace, Socket } from "socket.io";
import { updateFrappeLocation } from "../services/frappe.js";

export function registerLocationNamespace(ns: Namespace) {
  ns.on("connection", (socket: Socket) => {
    console.log("Chat user connected:", socket.id);

    socket.on("updateLocation", async (data) => {
      const { driver_id, lat, lng } = data;

      try {
        // Update Frappe database
        await updateFrappeLocation(driver_id, lat, lng);

        // Broadcast update to dispatchers
        ns.emit("driverLocationUpdated", { driver_id, lat, lng });

      } catch (err) {
        console.error("Frappe error:", err);
        socket.emit("errorUpdate", { message: "Failed to update location." });
      }
    });

    socket.on("disconnect", () => {
      console.log("Chat user disconnected:", socket.id);
    });
  });
}
