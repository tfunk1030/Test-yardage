import { Request, Response, NextFunction } from 'express';

interface ValidationError {
    field: string;
    message: string;
}

/**
 * Validate environmental conditions in request body
 */
export const validateEnvironmentalConditions = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: ValidationError[] = [];
    const conditions = req.body;

    // Required fields
    if (!conditions.temperature) {
        errors.push({ field: 'temperature', message: 'Temperature is required' });
    } else if (conditions.temperature < -40 || conditions.temperature > 120) {
        errors.push({ field: 'temperature', message: 'Temperature must be between -40°F and 120°F' });
    }

    if (!conditions.pressure) {
        errors.push({ field: 'pressure', message: 'Pressure is required' });
    } else if (conditions.pressure < 25 || conditions.pressure > 32) {
        errors.push({ field: 'pressure', message: 'Pressure must be between 25 and 32 inHg' });
    }

    if (!conditions.humidity) {
        errors.push({ field: 'humidity', message: 'Humidity is required' });
    } else if (conditions.humidity < 0 || conditions.humidity > 100) {
        errors.push({ field: 'humidity', message: 'Humidity must be between 0 and 100%' });
    }

    if (!conditions.windSpeed && conditions.windSpeed !== 0) {
        errors.push({ field: 'windSpeed', message: 'Wind speed is required' });
    } else if (conditions.windSpeed < 0) {
        errors.push({ field: 'windSpeed', message: 'Wind speed cannot be negative' });
    }

    if (!conditions.windDirection && conditions.windDirection !== 0) {
        errors.push({ field: 'windDirection', message: 'Wind direction is required' });
    } else if (conditions.windDirection < 0 || conditions.windDirection >= 360) {
        errors.push({ field: 'windDirection', message: 'Wind direction must be between 0 and 359 degrees' });
    }

    // Optional fields with validation
    if (conditions.elevation !== undefined && conditions.elevation < 0) {
        errors.push({ field: 'elevation', message: 'Elevation cannot be negative' });
    }

    if (conditions.groundHardness !== undefined && 
        (conditions.groundHardness < 0 || conditions.groundHardness > 1)) {
        errors.push({ field: 'groundHardness', message: 'Ground hardness must be between 0 and 1' });
    }

    if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
    }

    next();
};

/**
 * Validate club data in request body
 */
export const validateClubData = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: ValidationError[] = [];
    const clubData = req.body;

    if (!clubData.type) {
        errors.push({ field: 'type', message: 'Club type is required' });
    }

    if (!clubData.loft && clubData.loft !== 0) {
        errors.push({ field: 'loft', message: 'Club loft is required' });
    } else if (clubData.loft < 0 || clubData.loft > 64) {
        errors.push({ field: 'loft', message: 'Club loft must be between 0 and 64 degrees' });
    }

    if (!clubData.spinFactor && clubData.spinFactor !== 0) {
        errors.push({ field: 'spinFactor', message: 'Spin factor is required' });
    } else if (clubData.spinFactor < 0 || clubData.spinFactor > 2) {
        errors.push({ field: 'spinFactor', message: 'Spin factor must be between 0 and 2' });
    }

    // Optional fields with validation
    if (clubData.quality !== undefined && 
        (clubData.quality < 0 || clubData.quality > 1)) {
        errors.push({ field: 'quality', message: 'Club quality must be between 0 and 1' });
    }

    if (clubData.impact !== undefined && 
        !['center', 'toe', 'heel', 'high', 'low'].includes(clubData.impact)) {
        errors.push({ field: 'impact', message: 'Invalid impact location' });
    }

    if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
    }

    next();
};
