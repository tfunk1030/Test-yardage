export interface EnvironmentalConditions {
    temperature: number;      // Fahrenheit
    pressure: number;         // inHg
    humidity: number;         // percentage
    windSpeed: number;        // mph
    windDirection: number;    // degrees (0-360, 0 = North)
    elevation: number;        // feet above sea level
}

export interface WeatherData extends EnvironmentalConditions {
    timestamp: number;        // Unix timestamp
    location: {
        latitude: number;
        longitude: number;
    };
    source: string;          // Weather data provider
}

export interface AltitudeAdjustment {
    distanceFactor: number;  // Multiplier for total distance
    trajectoryFactor: number;// Multiplier for max height
}

export interface WindAdjustment {
    distance: number;        // Yards added/subtracted
    direction: number;       // Degrees of curve
    apex: number;           // Change in maximum height
}

export interface EnvironmentalAdjustments {
    altitude: AltitudeAdjustment;
    wind: WindAdjustment;
    temperature: number;     // Percentage adjustment
    humidity: number;        // Percentage adjustment
    total: number;          // Total percentage adjustment
}
