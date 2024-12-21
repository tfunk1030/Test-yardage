export interface ClubData {
    type: string;
    loft: number;
    spinFactor: number;
    launchAngle: number;
    ballSpeed: number;
}

export interface ClubStats {
    spinFactor: number;
    averageDistance: number;
    launchAngleRange: {
        min: number;
        max: number;
    };
    spinRateRange: {
        min: number;
        max: number;
    };
    ballSpeedRange: {
        min: number;
        max: number;
    };
}

export type ClubType = 
    | 'driver'
    | '3-wood'
    | '5-wood'
    | '4-iron'
    | '5-iron'
    | '6-iron'
    | '7-iron'
    | '8-iron'
    | '9-iron'
    | 'pw'
    | 'gw'
    | 'sw'
    | 'lw';
