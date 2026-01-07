import "socket.io";

declare module "socket.io" {
    interface Socket {
        user?: {
            userId: string;
            //   driverId?: string;
            //   operatorId?: string;
            //   role: "driver" | "operator";
            //   fleetIds?: string[];
        };
    }
}