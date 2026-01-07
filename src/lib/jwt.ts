// src/lib/jwt.ts
import jwt from "jsonwebtoken";

export function verifySocketToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string;
    // role: "driver" | "operator";
    // fleetIds?: string[];
  };
}