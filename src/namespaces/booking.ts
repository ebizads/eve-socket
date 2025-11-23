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
      handleBookingStatusUpdateListeners(ns, response.data.booking);
    });

    // ✅ ADD HANDLER FOR WEBHOOK EVENTS VIA SOCKET
    socket.on("webhookBookingUpdate", (data: any) => {
      console.log("Webhook booking update via socket:", data);
      handleBookingStatusUpdateListeners(ns, data);
    });

    socket.on("acceptBooking", (data) => {
      console.log("Booking accepted by driver:", data);
      // Emit to booking room or update booking status
      ns.emit("bookingAccepted", data);

      // Optionally, notify passenger namespace or booking namespace
    });

    socket.on("updateBookingStatus", async (data) => {
      console.log("update mo to 😠")
      // spread data from app
      const {
        booking_id,
        statusUpdate,
        confirming_driver,
        cancellation_reason,
        cancellation_reason_other } = data;

      let updatedBookingStatusURL;
      let dataToPass;
      switch (statusUpdate) {
        case 'Accepted':
          updatedBookingStatusURL = `/booking/booking/${booking_id}/status`
          dataToPass = { confirming_driver, status: statusUpdate }
          break;
        case 'Cancelled':
          updatedBookingStatusURL = `/booking/booking/${booking_id}/cancel`
          dataToPass = { cancellation_reason, status: statusUpdate, cancellation_reason_other }
          break;
        default:
          updatedBookingStatusURL = `/booking/booking/${booking_id}/status`
          dataToPass = { status: statusUpdate };
          break;
      }

      try {
        const response = await clients.eveApiTest.patch(
          updatedBookingStatusURL,
          dataToPass
        );

        handleBookingStatusUpdateListeners(ns, response.data.booking);

        // Add/remove driver from booking room based on status
        if (statusUpdate === "Accepted" && confirming_driver) {
          socket.join(`booking:${booking_id}`);
          console.log(`📲 Booking accepted by ${confirming_driver}, joined booking:${booking_id} room`);
        } else if (statusUpdate === "Cancelled") {
          socket.leave(`booking:${booking_id}`);
          console.log(`🔙 Leaving booking:${booking_id} room`);
        }

        // refire newBookingAvailable to refresh bookings nearby driver
        ns.emit("newBookingAvailable", { id: booking_id });


      } catch (error: any) {
        console.error(`❌ Error updating booking ${booking_id} status to ${statusUpdate}:`, error.response?.data || error.message);

        // Optionally, emit error back to client
        socket.emit('updateBookingStatusError', {
          booking_id,
          status: statusUpdate,
          message: error.response?.data?.error || error.message
        });
      }
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
      // send listener for passenger
      ns.to(`booking:${data.booking_id}`).emit("tripStarted", { tripId: startTripResponse.data.trip.id });
    });

    socket.on("completeTrip", async (data) => {
      console.log(`🚗✅ Completing Trip # ${data.name}`)

      socket.leave(`trip:${data.name}`)

      // send to listener for passenger
      ns.to(`trip:${data.name}`).emit("tripCompleted", { data });
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

// function for two way communication when status is updated
export function handleBookingStatusUpdateListeners(ns: Namespace, data: any) {
  const { name, booking_status, driver_id, confirming_driver, cancelllation_reason, cancellation_reason_other } = data;

  switch (booking_status) {
    // emit Accepted to status updated listeners
    case "Accepted":
      ns.to(`booking:${name}`).emit("statusChanged", {
        booking_id: name,
        status: booking_status,
        // driver_id: driver_id,
        confirming_driver: confirming_driver,
        timestamp: new Date().toISOString(),
        message: "Driver has accepted your booking",
      });
      break;
    // emit Cancelled to status update listeners
    case "Cancelled":
      ns.to(`booking:${name}`).emit("bookingCancelled", {
        booking_id: name,
        status: booking_status,
        // driver_id: driver_id,
        confirming_driver: confirming_driver,
        cancelllation_reason,
        cancellation_reason_other,
        timestamp: new Date().toISOString(),
        message: `Booking status updated to: ${booking_status}`,
      });
      console.log("🟥 bookingCancelled")
      break;
  }

  console.log("🎊 STATUS UPDATED FORWARDING TO LISTENERS")
}
