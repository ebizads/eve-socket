import { Namespace, Server, Socket } from "socket.io";
import { clients } from "../server.js";
import { createTripSchema } from "../schemas/tripSchema.js";

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

    // FROM DRIVER NAMESPACE
    socket.on("registerDriver", (data) => {
      console.log("Driver registered:", data);
      // You can store driver info in memory or DB if needed
      socket.data.driverId = data.driverId;
      socket.join(`driver:${data.driverId}`);
    });

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

    socket.on("acceptBooking", (data) => {
      console.log("Booking accepted by driver:", data);
      // Emit to booking room or update booking status
      ns.emit("bookingAccepted", data);

      // Optionally, notify passenger namespace or booking namespace
    });

    socket.on("updateBookingStatus", async (data) => {
      const { booking_id, statusUpdate, confirming_driver } = data;

      const response = await clients.eveApiTest.patch(
        `/booking/booking/${booking_id}/status`,
        { confirming_driver, status: statusUpdate }
      );

      // add driver to the booking room
      if (statusUpdate == "Accepted" && confirming_driver) {
        socket.join(`booking:${booking_id}`);
        console.log(`📲 joined booking:${booking_id} room `)
      }
      handleDriverStatusUpdate(ns, response.data.booking);
    });

    socket.on("etaUpdate", (data) => {
      console.log("ETA update from driver:", data);
      // Forward ETA to passenger or booking namespace
      ns.emit("etaUpdated", data);
    });

    socket.on("rejectBooking", (data) => {
      console.log("Booking rejected by driver:", data);
      ns.emit("bookingRejected", data);
    });

    socket.on("driverAvailability", (data) => {
      console.log("Driver availability changed:", data);
      // Update driver availability status
      ns.emit("driverAvailabilityChanged", data);
    });

    // pass the booking ID in data 
    socket.on("driverOnTheWay", (data) => {
      if (data.bookingId) {
        ns.to(`booking:${data.bookingId}`).emit("notifyPassengerDriverOnTheWay", data);
        console.log(`💬 notified booking:${data.bookingId} that driver is on the way`)
      }
    });

    // pass the booking ID in data
    socket.on("driverArrivedAtPickup", (data) => {
      if (data.bookingId) {
        ns.to(`booking:${data.bookingId}`).emit("readyToPickupPassenger", data);
        console.log(`💬 notified booking:${data.bookingId} that driver has arrived at pickup`)
      }
    });

    socket.on("startTrip", async (data) => {
      const tripData = createTripSchema.parse(data)

      const startTripResponse = await clients.eveApiTest.post(
        `/trip/trip-create`,
        tripData
      );
      console.log(`🚗💨 Starting Trip # ${startTripResponse.data.trip.id}`)

      socket.join(`trip:${startTripResponse.data.trip.id}`)
      // listener for passenger
      ns.to(`booking:${data.booking_id}`).emit("tripStarted", { tripId: startTripResponse.data.trip.id });
    });

    // passenger should join trip room
    socket.on("joinTripRoom", (data) => {
      console.log(`👤 Passenger joining trip:${data.tripId}`);
      const tripId = data.tripId;
      socket.join(`trip:${tripId}`);
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
