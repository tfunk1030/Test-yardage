import { ClubType, ClubStats } from '../types/club';

export const PGA_CLUB_DATA: Record<ClubType, ClubStats> = {
    'driver': {
        spinFactor: 1.0,
        averageDistance: 275,
        launchAngleRange: { min: 8, max: 12 },
        spinRateRange: { min: 2200, max: 3000 },
        ballSpeedRange: { min: 150, max: 175 }
    },
    '3-wood': {
        spinFactor: 1.2,
        averageDistance: 243,
        launchAngleRange: { min: 11, max: 15 },
        spinRateRange: { min: 3000, max: 3700 },
        ballSpeedRange: { min: 140, max: 160 }
    },
    '5-wood': {
        spinFactor: 1.3,
        averageDistance: 230,
        launchAngleRange: { min: 12, max: 16 },
        spinRateRange: { min: 3300, max: 4000 },
        ballSpeedRange: { min: 135, max: 155 }
    },
    '4-iron': {
        spinFactor: 1.4,
        averageDistance: 210,
        launchAngleRange: { min: 13, max: 17 },
        spinRateRange: { min: 3500, max: 4200 },
        ballSpeedRange: { min: 130, max: 145 }
    },
    '5-iron': {
        spinFactor: 1.5,
        averageDistance: 195,
        launchAngleRange: { min: 14, max: 18 },
        spinRateRange: { min: 3800, max: 4500 },
        ballSpeedRange: { min: 125, max: 140 }
    },
    '6-iron': {
        spinFactor: 1.6,
        averageDistance: 183,
        launchAngleRange: { min: 15, max: 19 },
        spinRateRange: { min: 4100, max: 4800 },
        ballSpeedRange: { min: 120, max: 135 }
    },
    '7-iron': {
        spinFactor: 1.7,
        averageDistance: 172,
        launchAngleRange: { min: 16, max: 20 },
        spinRateRange: { min: 4400, max: 5100 },
        ballSpeedRange: { min: 115, max: 130 }
    },
    '8-iron': {
        spinFactor: 1.8,
        averageDistance: 160,
        launchAngleRange: { min: 17, max: 21 },
        spinRateRange: { min: 4700, max: 5400 },
        ballSpeedRange: { min: 110, max: 125 }
    },
    '9-iron': {
        spinFactor: 1.9,
        averageDistance: 148,
        launchAngleRange: { min: 18, max: 22 },
        spinRateRange: { min: 5000, max: 5700 },
        ballSpeedRange: { min: 105, max: 120 }
    },
    'pw': {
        spinFactor: 2.0,
        averageDistance: 136,
        launchAngleRange: { min: 19, max: 23 },
        spinRateRange: { min: 5300, max: 6000 },
        ballSpeedRange: { min: 100, max: 115 }
    },
    'gw': {
        spinFactor: 2.1,
        averageDistance: 123,
        launchAngleRange: { min: 20, max: 24 },
        spinRateRange: { min: 5600, max: 6300 },
        ballSpeedRange: { min: 95, max: 110 }
    },
    'sw': {
        spinFactor: 2.2,
        averageDistance: 110,
        launchAngleRange: { min: 22, max: 26 },
        spinRateRange: { min: 5900, max: 6600 },
        ballSpeedRange: { min: 90, max: 105 }
    },
    'lw': {
        spinFactor: 2.3,
        averageDistance: 97,
        launchAngleRange: { min: 24, max: 28 },
        spinRateRange: { min: 6200, max: 6900 },
        ballSpeedRange: { min: 85, max: 100 }
    }
};
