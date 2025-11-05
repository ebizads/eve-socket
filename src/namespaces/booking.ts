import { Namespace, Server, Socket } from "socket.io";

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
    socket.on("driverStatusUpdate", (data: any) => {
      console.log("Driver status update:", data);
      handleDriverStatusUpdate(ns, data);
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

function handleDriverStatusUpdate(ns: Namespace, data: any) {
  const { booking_id, status, driver_id, confirming_driver } = data;
  if (status === "Accepted") {
    ns.to(`booking:${booking_id}`).emit("statusChanged", {
      booking_id: booking_id,
      status: status,
      driver_id: driver_id,
      confirming_driver: confirming_driver,
      timestamp: new Date().toISOString(),
      message: "Driver has accepted your booking",
    });
    ns.emit("bookingAccepted", {
      booking_id: booking_id,
      driver_id: driver_id,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Handle other status updates
    ns.to(`booking:${booking_id}`).emit("statusChanged", {
      booking_id: booking_id,
      status: status,
      driver_id: driver_id,
      confirming_driver: confirming_driver,
      timestamp: new Date().toISOString(),
      message: `Booking status updated to: ${status}`,
    });
  }
}
