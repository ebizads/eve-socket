import { Server, Socket } from "socket.io";

export function onConnection(io: Server, socket: Socket) {
  console.log(`Client connected: ${socket.id}`);

  socket.emit("welcome", {
    message: "Connected to TypeScript Socket.IO skeleton!",
  });

  socket.on("pingServer", (data: string) => {
    console.log("Received from client:", data);
    socket.emit("serverPong", { status: "ok" });
  });

  socket.on("broadcastMessage", (msg: string) => {
    socket.broadcast.emit("globalMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
}
