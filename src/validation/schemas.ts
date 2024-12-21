import { z } from 'zod';

// Club type validation
export const clubTypeSchema = z.enum([
    'driver', '3-wood', '5-wood',
    '4-iron', '5-iron', '6-iron', '7-iron', '8-iron', '9-iron',
    'pw', 'gw', 'sw', 'lw'
]);

// Vector3D validation
export const vector3DSchema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
});

// Environmental conditions validation
export const environmentalConditionsSchema = z.object({
    temperature: z.number().min(-50).max(150),
    pressure: z.number().min(20).max(40),
    humidity: z.number().min(0).max(100),
    windSpeed: z.number().min(0).max(100),
    windDirection: z.number().min(0).max(360),
    elevation: z.number().min(-1000).max(15000)
});

// Initial conditions validation
export const initialConditionsSchema = z.object({
    velocity: vector3DSchema,
    spinRate: z.number().min(0).max(10000)
});

// Club data validation
export const clubDataSchema = z.object({
    type: clubTypeSchema,
    loft: z.number().min(0).max(90),
    spinFactor: z.number().min(0).max(5)
});

// Shot parameters validation
export const shotParametersSchema = z.object({
    clubType: clubTypeSchema,
    initialVelocity: z.number().min(0).max(200),
    launchAngle: z.number().min(0).max(90),
    backSpin: z.number().min(0).max(10000),
    sideSpin: z.number().min(-5000).max(5000)
});

// Weather data validation
export const weatherDataSchema = environmentalConditionsSchema.extend({
    timestamp: z.number(),
    location: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180)
    }),
    source: z.string()
});

// Calculation request validation
export const calculationRequestSchema = z.object({
    initialConditions: initialConditionsSchema,
    environmentalConditions: environmentalConditionsSchema,
    club: clubDataSchema
});

// API error response
export const apiErrorSchema = z.object({
    error: z.string(),
    code: z.number(),
    details: z.any().optional()
});
