import type { Namespace, Socket } from "socket.io";
import { handleBookingStatusUpdateListeners } from "./booking.js";
import { clients } from "../server.js";
import { createTripSchema } from "../schemas/tripSchema.js";

export function registerDriverNamespace(driverNS: Namespace, bookingNS: Namespace) {
  driverNS.on("connection", (socket: Socket) => {
    console.log(`🚗 Driver connected: ${socket.id}`);

    socket.on("registerDriver", (data) => {
      console.log("Driver registered:", data);
      // You can store driver info in memory or DB if needed
      socket.data.driverId = data.driverId;
      socket.join(`driver:${data.driverId}`);
    });

    socket.on("acceptBooking", (data) => {
      console.log("Booking accepted by driver:", data);
      // Emit to booking room or update booking status
      driverNS.emit("bookingAccepted", data);
      // Optionally, notify passenger namespace or booking namespace
    });

    socket.on("updateBookingStatus", async (data) => {
      console.log("Booking status updated by driver:", data);
      const { booking_id, statusUpdate, confirming_driver } = data;
      console.log("Driver status update for booking:", booking_id);
      console.log("Driver status updated to:", statusUpdate);

      const response = await clients.eveApiTest.patch(`/booking/booking/${booking_id}/status`, {
        confirming_driver,
        status: statusUpdate
      });
      // console.log(response.data.booking)
      // Forward status update to relevant booking/passenger
      // driverNS.emit("bookingStatusUpdated", data);
      handleBookingStatusUpdateListeners(bookingNS, response.data.booking);
    });

    socket.on("etaUpdate", (data) => {
      console.log("ETA update from driver:", data);
      // Forward ETA to passenger or booking namespace
      driverNS.emit("etaUpdated", data);
    });

    socket.on("rejectBooking", (data) => {
      console.log("Booking rejected by driver:", data);
      driverNS.emit("bookingRejected", data);
    });

    socket.on("driverAvailability", (data) => {
      console.log("Driver availability changed:", data);
      // Update driver availability status
      driverNS.emit("driverAvailabilityChanged", data);
    });

    socket.on("startTrip", async (data) => {
      const tripData = createTripSchema.parse(data)

      const startTripResponse = await clients.eveApiTest.post(
        `/trip/trip-create`,
        tripData
      );

      console.log(`🚗💨 Starting Trip # ${startTripResponse.data.trip.id}`)

      // listener for passenger
      driverNS.emit("tripStarted", data);
    });

    socket.on("driverLocationUpdate", async (data) => {
      console.log(`Updating driver location `)
      // listener for passenger
      driverNS.to(`driver:${data.driverId}`).emit("driverLocationHasBeenUpdated", data);
    });

    socket.on("joinRoom", ({ driverId }) => {
      socket.join(`driver:${driverId}`);
      console.log(`${socket.id} joined room: ${driverId}`);
    });
    // socket.on("confirmPickup", (data) => {

    //   bookingNS.emit()
    // });

    socket.on("disconnect", () => {
      console.log(`Driver disconnected: ${socket.id}`);
    });
  });
}
