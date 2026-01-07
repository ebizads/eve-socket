// src/socket/middlewares/auth.ts
import { verifySocketToken } from "../lib/jwt.js";
import { Socket } from "socket.io";

export function socketAuthMiddleware(
//   allowedRoles: ("driver" | "operator")[]
) {
  return (socket: Socket, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("AUTH_REQUIRED"));
      }

      const payload = verifySocketToken(token);

    //   if (!allowedRoles.includes(payload.role)) {
    //     return next(new Error("FORBIDDEN"));
    //   }

      socket.user = {
        userId: payload.userId,
        // role: payload.role,
        // driverId: payload.role === "driver" ? payload.sub : undefined,
        // operatorId: payload.role === "operator" ? payload.sub : undefined,
        // fleetIds: payload.fleetIds,
      };

      next();
    } catch {
      next(new Error("INVALID_TOKEN"));
    }
  };
}
