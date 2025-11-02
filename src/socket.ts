import { Server, Socket } from "socket.io";
import { onConnection } from "./events.js";

export default function registerSocketEvents(io: Server) {
  io.on("connection", (socket: Socket) => onConnection(io, socket));
}
