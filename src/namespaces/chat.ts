import { Namespace, Socket } from "socket.io";

export function registerChatNamespace(ns: Namespace) {
  ns.on("connection", (socket: Socket) => {
    console.log("Chat user connected:", socket.id);

    socket.on("message", (msg: string) => {
      ns.emit("message", msg); // broadcast to everyone inside /chat
    });

    socket.on("disconnect", () => {
      console.log("Chat user disconnected:", socket.id);
    });
  });
}
