// const { Server } = require("socket.io");
// const { createServer } = require("http");
// const express = require("express");

// const app = express();
// const server = createServer(app);
// const port = 5000;

// // Socket.io setup
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Allow all origins, or specify your Flutter app origins
//     methods: ["GET", "POST"],
//   },
// });

// // Register namespaces
// // If running with ts-node, you can import TypeScript directly:
// const { registerBookingNamespace } = require("./src/namespaces/booking.ts");
// registerBookingNamespace(io);

// // HTTP endpoint for API server to notify about status changes
// app.use(express.json());

// // Webhook endpoint for Frappe to call when status changes
// app.post("/api/webhook/booking-update", (req, res) => {
//   try {
//     const webhookData = req.body;
//     console.log("Frappe webhook received:", webhookData);

//     // Frappe webhook sends the entire document
//     const bookingData = webhookData.data;
//     const bookingId = bookingData.name;
//     const status = bookingData.booking_status;
//     const confirmingDriver = bookingData.confirming_driver;

//     if (status === "Accepted" && confirmingDriver) {
//       console.log(
//         `Booking ${bookingId} accepted by driver ${confirmingDriver}`
//       );

//       // Notify all clients interested in this booking
//       io.to(`booking:${bookingId}`).emit("statusChanged", {
//         booking_id: bookingId,
//         status: status,
//         driver_id: confirmingDriver,
//         confirming_driver: confirmingDriver,
//         timestamp: new Date().toISOString(),
//         message: "Driver has accepted your booking",
//         source: "frappe_webhook",
//       });
//     }

//     // Broadcast to all connected clients (for web dashboard)
//     io.emit("booking-update", {
//       ...webhookData,
//       server_timestamp: new Date().toISOString(),
//       connected_clients: io.engine.clientsCount,
//     });

//     res.json({ success: true, message: "Webhook processed" });
//   } catch (error) {
//     console.error("Error processing webhook:", error);
//     res.status(500).json({
//       success: false,
//       error: "Webhook processing failed",
//     });
//   }
// });

// // Alternative manual trigger endpoint (for testing)
// app.post("/api/manual-status-update", (req, res) => {
//   const { booking_id, status, confirming_driver } = req.body;

//   if (status === "Accepted" && confirming_driver) {
//     io.to(`booking:${booking_id}`).emit("statusChanged", {
//       booking_id: booking_id,
//       status: status,
//       driver_id: confirming_driver,
//       confirming_driver: confirming_driver,
//       timestamp: new Date().toISOString(),
//       message: "Driver has accepted your booking",
//       source: "manual_update",
//     });
//   }

//   res.json({ success: true, message: "Manual update processed" });
// });

// // Health check
// app.get("/health", (req, res) => {
//   res.json({
//     status: "OK",
//     timestamp: new Date().toISOString(),
//   });
// });

// // Simple status page with live connection count and messages
// app.get("/", (req, res) => {
//   res.send(`
//     <html>
//       <head>
//         <title>Socket Server</title>
//         <script src="/socket.io/socket.io.js"></script>
//       </head>
//       <body>
//         <h1>Socket Server is Running!</h1>
//         <p>Server is active on port 5000</p>
//         <p>WebSocket connections: <span id="count">0</span></p>
//         <div id="status">Disconnected</div>
//         <div id="messages"></div>
//         <script>
//           const socket = io();
//           function updateCount(count) {
//             document.getElementById('count').textContent = count;
//           }
//           socket.on('connect', () => {
//             document.getElementById('status').textContent = 'Connected: ' + socket.id;
//             document.getElementById('status').style.color = 'green';
//           });
//           socket.on('disconnect', (reason) => {
//             document.getElementById('status').textContent = 'Disconnected: ' + reason;
//             document.getElementById('status').style.color = 'red';
//           });
//           socket.on('clientCount', updateCount);
//           socket.on('booking-update', (data) => {
//             const messages = document.getElementById('messages');
//             messages.innerHTML += '<p><strong>Booking Update:</strong> ' + JSON.stringify(data) + '</p>';
//           });
//         </script>
//       </body>
//     </html>
//   `);
// });

// server.listen(port, () => {
//   console.log("Socket server started on port " + port);
// });

// module.exports = { app, io, server };
