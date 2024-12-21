import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Environment variables validation
const envSchema = z.object({
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRATION: z.string().regex(/^\d+[hdwmy]$/),
    API_KEY_HEADER: z.string().default('X-API-Key')
});

// Validate environment variables
const env = envSchema.parse({
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '24h',
    API_KEY_HEADER: process.env.API_KEY_HEADER
});

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header(env.API_KEY_HEADER);

    if (!apiKey) {
        return res.status(401).json({
            error: 'Missing API key',
            code: 401
        });
    }

    // In a real application, validate against a database of API keys
    // For now, we'll use a simple environment variable
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({
            error: 'Invalid API key',
            code: 401
        });
    }

    next();
};

export const validateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Missing or invalid authorization header',
            code: 401
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = decoded as { id: string; role: string };
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Invalid or expired token',
            code: 401
        });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 401
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                code: 403
            });
        }

        next();
    };
};

export const generateToken = (userId: string, role: string): string => {
    return jwt.sign(
        { id: userId, role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRATION }
    );
};
