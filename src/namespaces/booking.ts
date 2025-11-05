import { Namespace, Server, Socket } from "socket.io";
import { clients } from "../server.js";

export function registerBookingNamespace(io: Server) {
  const ns = io.of("/booking");
  ns.on("connection", (socket: Socket) => {
    console.log("Booking user connected:", socket.id);

    socket.on(
      "register",
      (data: { userType: string; userId: string; bookingId: string }) => {
        const { userType, userId, bookingId } = data;
        console.log(
          `Client registered: ${userType} - ${userId} for booking ${bookingId}`
        );
        if (bookingId) {
          socket.join(`booking:${bookingId}`);
        }
      }
    );

    // Listen for booking creation from Flutter app
    socket.on("bookingCreated", (data: any) => {
      console.log("New booking created:", data);
      ns.emit("newBookingAvailable", data);
    });

    // Listen for driver status updates
    socket.on("driverStatusUpdate", async (data: any) => {
      const { booking_id, statusUpdate } = data;
      console.log("Driver status update for booking:", booking_id);
      console.log("Driver status updated to:", statusUpdate);

      const response = await clients.eveApiTest.patch(`/booking/booking/${booking_id}/status`, {
        status: statusUpdate
      });
      console.log(response.data.booking)
      handleDriverStatusUpdate(ns, response.data.booking);
    });

    // ✅ ADD HANDLER FOR WEBHOOK EVENTS VIA SOCKET
    socket.on("webhookBookingUpdate", (data: any) => {
      console.log("Webhook booking update via socket:", data);
      handleDriverStatusUpdate(ns, data);
    });

    socket.on("disconnect", () => {
      console.log("Booking user disconnected:", socket.id);
    });
  });
}

export function handleDriverStatusUpdate(ns: Namespace, data: any) {
  const { name, booking_status, driver_id, confirming_driver } = data;

  if (booking_status === "Accepted") {
    ns.to(`booking:${name}`).emit("statusChanged", {
      booking_id: name,
      status: booking_status,
      driver_id: driver_id,
      confirming_driver: confirming_driver,
      timestamp: new Date().toISOString(),
      message: "Driver has accepted your booking",
    });
    ns.emit("bookingAccepted", {
      booking_id: name,
      driver_id: driver_id,
      timestamp: new Date().toISOString(),
    });
    console.log("DUMAAN NG EMIT")
  } else {
    // Handle other status updates
    ns.to(`booking:${name}`).emit("statusChanged", {
      booking_id: name,
      status: booking_status,
      driver_id: driver_id,
      confirming_driver: confirming_driver,
      timestamp: new Date().toISOString(),
      message: `Booking status updated to: ${booking_status}`,
    });
  }
}
