import type { Namespace, Socket } from "socket.io";
import { handleBookingStatusUpdateListeners } from "./booking.js";
import { clients } from "../server.js";
import { createTripSchema } from "../schemas/tripSchema.js";


export function registerOperatorNamespace(operatorNS: Namespace) {
    // operatorNS.use(authMiddleware); // JWT validation
    operatorNS.on("connection", async (socket: Socket) => {
        console.log(`🎧 Operator connected: ${socket.id}`);
        // const operatorId = socket.user.operatorId;
        const operatorId = socket.user?.userId;

        // 1️⃣ Determine what this operator is allowed to see
        // const fleetIds = await getOperatorFleets(operatorId);

        // 2️⃣ Use operatorId as room identifier for Operator's fleet
        socket.join(`fleet:${operatorId}`)
        // fleetIds.forEach((fleetId) => {
        //     socket.join(`fleet:${fleetId}`);
        // });

        // 3️⃣ Optional: send initial snapshot
        const initialDrivers = await getLiveDriversForFleets(fleetIds);
        socket.emit("fleet:snapshot", initialDrivers);

        // 4️⃣ Optional operator actions
        socket.on("operator:requestDriver", async (driverId) => {
            if (!isDriverVisibleToOperator(driverId, fleetIds)) return;

            const driver = await getDriverDetails(driverId);
            socket.emit("operator:driverDetails", driver);
        });

        socket.on("disconnect", () => {
            console.log(`Operator ${operatorId} disconnected`);
        });
    });
}