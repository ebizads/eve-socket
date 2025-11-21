// schemas/rideRequestSchema.ts
import { z } from "zod";

export const createTripSchema = z.object({
    vehicle_type: z.string().default("driving-car"),
    status: z.string().default("Ongoing"),

    trip_timestamp: z.string().optional(),
    trip_distance: z.number(),
    fare: z.number(),

    booking_id: z.string(),
    passenger_id: z.string(),
    vehicle_id: z.string(),
    driver_id: z.string(),
    shift_id: z.string(),
    completion_timestamp: z.string().optional(),
    rating: z.number().optional(),
    passenger_notes: z.string().optional(),

    pickup_coordinates: z.array(z.number()).optional(),
    pickup_location: z.string().optional(),
    pickup_latitude: z.number().optional(),
    pickup_longitude: z.number().optional(),
    pickup_timestamp: z.date().optional(),

    destination_coordinates: z.array(z.number()).optional(),
    destination_location: z.string().optional(),
    destination_latitude: z.number().optional(),
    destination_longitude: z.number().optional(),

    payment_type: z.string().default("Cash"),
    cash_payment: z.number().optional(),
    non_cash_payment: z.number().optional(),
    non_cash_payment_reference: z.number().optional(),
    voucher_payment_applied: z.number().optional(),
    passenger_voucher_id: z.string().optional(),
});
