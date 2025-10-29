const { Server } = require("socket.io");

//port declaration
const port = 5000;

//allowed cors
const io = new Server(port, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//logging
console.log("Server started on port " + port);

//initial connection handler
io.on("connection", (socket) => {
  console.log("New client connected: " + socket.id);
  socket.emit("welcome", "Welcome to the Socket.io server!");

  //sample event listener for booking
  socket.on("booking", (data) => {
    BookingConfirmed(data);
  });

  //handle disconnection
  socket.on("disconnect", () => {
    SocketDisconnect(socket);
  });
});

//function to handle booking confirmation
async function BookingConfirmed(data) {
  console.log("Booking received:", data);
  //emit confirmation back to all clients
  //Same usage for clients listening for 'bookingConfirmed' event
  io.emit("bookingConfirmed", { status: "confirmed", details: data });
}

async function SocketDisconnect(socket) {
  console.log("Handling disconnection for socket: " + socket.id);
  // Perform any cleanup or logging needed on disconnection
}
