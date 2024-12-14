// Import required functions
importScripts('ball-physics.js');

// Handle calculation requests
self.onmessage = function(e) {
    const { conditions, id } = e.data;
    
    try {
        // Perform calculations
        const results = calculateBallFlightAdjustments(conditions);
        
        // Send results back to main thread
        self.postMessage({
            results,
            id,
            error: null
        });
    } catch (error) {
        self.postMessage({
            results: null,
            id,
            error: error.message
        });
    }
};

// Utility functions for calculations
function calculateBallFlightAdjustments(conditions) {
    const {
        temperature,
        humidity,
        altitude,
        windSpeed,
        windDirection,
        shotHeight
    } = conditions;
    
    // Calculate air density
    const airDensity = calculateAirDensity(temperature, humidity, altitude);
    
    // Calculate wind effect
    const windEffect = calculateWindEffect(windSpeed, windDirection, shotHeight);
    
    // Calculate trajectory adjustments
    const trajectory = calculateTrajectory(airDensity, windEffect);
    
    return {
        airDensityFactor: airDensity.factor,
        windEffect: windEffect,
        trajectory: trajectory,
        maxHeight: trajectory.maxHeight,
        landingAngle: trajectory.landingAngle,
        carryDistance: trajectory.carryDistance
    };
}

function calculateAirDensity(temperature, humidity, altitude) {
    // Constants
    const standardPressure = 1013.25; // hPa at sea level
    const standardTemperature = 288.15; // K at sea level
    const lapseRate = 0.0065; // K/m
    const gasConstant = 287.05; // J/(kg·K)
    
    // Convert inputs to proper units
    const tempK = (temperature + 32) * 5/9 + 273.15; // °F to K
    const altitudeM = altitude * 0.3048; // ft to m
    
    // Calculate pressure at altitude
    const pressure = standardPressure * Math.pow(
        1 - (lapseRate * altitudeM) / standardTemperature,
        5.2561
    );
    
    // Calculate vapor pressure
    const saturationVaporPressure = 6.11 * Math.exp(
        (17.27 * (tempK - 273.15)) / (237.3 + (tempK - 273.15))
    );
    const vaporPressure = (humidity / 100) * saturationVaporPressure;
    
    // Calculate air density
    const dryAirDensity = pressure / (gasConstant * tempK);
    const moistAirDensity = dryAirDensity * (1 - 0.378 * vaporPressure / pressure);
    
    return {
        density: moistAirDensity,
        factor: moistAirDensity / 1.225 // Ratio to standard air density
    };
}

function calculateWindEffect(windSpeed, windDirection, shotHeight) {
    // Convert inputs to vectors
    const windAngle = {
        'N': 0,
        'NE': 45,
        'E': 90,
        'SE': 135,
        'S': 180,
        'SW': 225,
        'W': 270,
        'NW': 315
    }[windDirection];
    
    const heightFactor = {
        'low': 0.7,
        'medium': 1.0,
        'high': 1.3
    }[shotHeight];
    
    const windRad = windAngle * Math.PI / 180;
    const windX = windSpeed * Math.sin(windRad);
    const windY = -windSpeed * Math.cos(windRad);
    
    return {
        headwind: windY * heightFactor,
        crosswind: windX * heightFactor,
        lateralEffect: (windX * heightFactor) / 5 // Simplified lateral movement
    };
}

function calculateTrajectory(airDensity, windEffect) {
    // Initial conditions
    const launchAngle = 15; // degrees
    const initialVelocity = 150; // mph
    const spinRate = 2500; // rpm
    
    // Convert to radians and m/s
    const theta = launchAngle * Math.PI / 180;
    const v0 = initialVelocity * 0.44704;
    const omega = spinRate * 2 * Math.PI / 60;
    
    // Calculate trajectory
    const dt = 0.01; // time step in seconds
    let x = 0, y = 0, vx = v0 * Math.cos(theta), vy = v0 * Math.sin(theta);
    let maxHeight = 0;
    let points = [];
    
    while (y >= 0) {
        // Update position
        x += vx * dt;
        y += vy * dt;
        
        // Track max height
        maxHeight = Math.max(maxHeight, y);
        
        // Store point
        points.push({ x, y });
        
        // Update velocities with drag and lift
        const v = Math.sqrt(vx * vx + vy * vy);
        const drag = 0.5 * airDensity.density * 0.3 * Math.PI * 0.021316 * v * v;
        const lift = 0.5 * airDensity.density * 0.3 * Math.PI * 0.021316 * v * omega;
        
        vx -= (drag * vx / v) * dt;
        vy -= (9.81 - lift) * dt;
    }
    
    // Calculate landing angle
    const lastTwoPoints = points.slice(-2);
    const landingAngle = Math.atan2(
        lastTwoPoints[1].y - lastTwoPoints[0].y,
        lastTwoPoints[1].x - lastTwoPoints[0].x
    ) * 180 / Math.PI;
    
    return {
        points,
        maxHeight: maxHeight * 3.28084, // convert to feet
        landingAngle: Math.abs(landingAngle),
        carryDistance: x * 1.09361 // convert to yards
    };
}
