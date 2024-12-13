// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Export configuration
export const config = {
    WEATHERAPI_KEY: process.env.WEATHERAPI_KEY || '',
    API_BASE_URL: 'https://api.weatherapi.com/v1',
    ENDPOINTS: {
        CURRENT: 'current.json',
        FORECAST: 'forecast.json',
        MARINE: 'marine.json'
    },
    FIELDS: {
        current: [
            'temp_f',
            'humidity',
            'wind_mph',
            'wind_degree',
            'wind_dir',
            'pressure_mb',
            'pressure_in',
            'precip_in',
            'cloud',
            'feelslike_f',
            'vis_miles',
            'uv',
            'gust_mph',
            'windchill_f',
            'heatindex_f',
            'dewpoint_f'
        ],
        forecast: [
            'maxtemp_f',
            'mintemp_f',
            'avgtemp_f',
            'maxwind_mph',
            'totalprecip_in',
            'avgvis_miles',
            'avghumidity',
            'daily_chance_of_rain',
            'uv'
        ],
        marine: [
            'sig_ht_mt',
            'swell_dir',
            'swell_period_secs'
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
            'wind_speed_10m',
            'wind_direction_10m',
            'wind_speed_80m',
            'wind_direction_80m',
            'wind_gust',
            'short_rad',
            'diff_rad'
        ]
    }
};

// Validate API key
if (!config.WEATHERAPI_KEY) {
    console.error('WeatherAPI.com API key is not set. Please add it to your .env file.');
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
