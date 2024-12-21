// Wind effect calculations

export function calculateWindEffect({
    windSpeed,
    windDirection,
    shotDistance = 200,  // Default values for testing
    shotHeight = 30,
    shotDirection = 0
}) {
    // Input validation
    if (typeof windSpeed !== 'number' || windSpeed < 0) {
        throw new Error('Wind speed must be non-negative');
    }
    if (typeof windDirection !== 'number') {
        throw new Error('Wind direction must be a number');
    }
    if (typeof shotDistance !== 'number' || shotDistance <= 0) {
        shotDistance = 200; // Use default if invalid
    }
    if (typeof shotHeight !== 'number' || shotHeight <= 0) {
        shotHeight = 30; // Use default if invalid
    }

    // Convert angles to radians
    const windAngleRad = (windDirection * Math.PI) / 180;
    const shotAngleRad = (shotDirection * Math.PI) / 180;

    // Calculate wind components relative to shot direction
    const relativeAngle = windAngleRad - shotAngleRad;
    const crossWind = windSpeed * Math.sin(relativeAngle);
    const headWind = windSpeed * Math.cos(relativeAngle);

    // Calculate effect on distance (simplified model)
    const distanceEffect = -headWind * 0.5; // Headwind reduces distance

    // Calculate lateral displacement
    const lateralEffect = crossWind * (shotDistance / 100) * 0.3;

    // Calculate points for trajectory visualization
    const points = [];
    const numPoints = 50;
    const maxHeight = shotHeight;

    for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * (shotDistance + distanceEffect);
        const progress = i / (numPoints - 1);
        const height = maxHeight * Math.sin(Math.PI * progress);
        const lateral = lateralEffect * (progress * progress); // Quadratic effect

        points.push({
            x: x,
            y: height,
            z: lateral
        });
    }

    return {
        distanceEffect,
        lateralEffect,
        points,
        finalDistance: shotDistance + distanceEffect,
        maxHeight: shotHeight,
        maxLateral: lateralEffect
    };
}
