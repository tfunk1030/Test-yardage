// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Export configuration
export const config = {
    TOMORROW_IO_API_KEY: process.env.TOMORROW_IO_API_KEY || 'jG9onLuVeiR4NWlVIO85EWWLCtQ2Uzqv',
    API_BASE_URL: 'https://api.tomorrow.io/v4',
    ENDPOINTS: {
        CURRENT: 'weather/realtime',
        FORECAST: 'weather/forecast',
        MARINE: 'weather/marine'
    },
    FIELDS: {
        current: [
            'temperature',
            'humidity',
            'windSpeed',
            'windDirection',
            'pressureSeaLevel',
            'precipitationProbability',
            'cloudCover',
            'visibility',
            'uvIndex',
            'windGust',
            'dewPoint'
        ],
        forecast: [
            'temperature',
            'temperatureMax',
            'temperatureMin',
            'windSpeed',
            'precipitationProbability',
            'visibility',
            'humidity',
            'cloudCover',
            'uvIndex'
        ],
        marine: [
            'waveSignificantHeight',
            'waveDirection',
            'wavePeriod'
        ],
        astro: [
            'sunrise',
            'sunset',
            'is_sun_up'
        ]
    },
    // Reserved for future pro features
    FUTURE_PRO_FIELDS: {
        wind: [
            'windSpeed10m',
            'windDirection10m',
            'windSpeed80m',
            'windDirection80m',
            'windGust',
            'solarRadiationShort',
            'solarRadiationDiffuse'
        ]
    }
};

// Validate API key
if (!config.TOMORROW_IO_API_KEY) {
    console.error('Tomorrow.io API key is not set. Please add it to your .env file.');
}

export const ENV_CONSTANTS = {
    STANDARD_CONDITIONS: {
        TEMPERATURE: 70, // °F
        PRESSURE: 29.92, // inHg
        HUMIDITY: 50, // %
        WIND_SPEED: 0, // mph
        WIND_DIRECTION: 'N'
    },
    ADJUSTMENTS: {
        ALTITUDE: {
            PRESSURE_COEFFICIENT: 0.0000375, // per foot
            DISTANCE_COEFFICIENT: 0.001 // per 50 feet
        },
        WIND: {
            HEAD_TAIL: 0.025, // per mph
            CROSSWIND: 0.01 // per mph
        },
        TEMPERATURE: {
            DISTANCE_COEFFICIENT: 0.001 // per degree F
        },
        HUMIDITY: {
            DENSITY_COEFFICIENT: 0.0024 // per percent
        }
    }
};
