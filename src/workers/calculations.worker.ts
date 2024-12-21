import { BallFlightCalculator } from '../ball-flight-physics';
import { ClubData, ClubType } from '../types/club';
import { PGA_CLUB_DATA } from '../data/club-data';

interface WorkerMessage {
    type: 'calculate';
    data: {
        initialConditions: {
            velocity: {
                x: number;
                y: number;
                z: number;
            };
            spinRate: number;
        };
        environmentalConditions: {
            temperature: number;
            pressure: number;
            humidity: number;
            windSpeed: number;
            windDirection: number;
            elevation: number;
        };
        club: {
            type: ClubType;
            loft: number;
            spinFactor: number;
        };
    };
}

const calculator = new BallFlightCalculator();

self.addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
    if (e.data.type === 'calculate') {
        const { initialConditions, environmentalConditions, club } = e.data.data;
        
        try {
            const trajectory = calculator.calculateTrajectory(
                initialConditions,
                environmentalConditions,
                club
            );

            self.postMessage({
                type: 'result',
                data: trajectory
            });
        } catch (error) {
            self.postMessage({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        }
    }
});
