import { BallFlightCalculator } from '../ball-flight-calculator';
import { 
    InitialConditions, 
    EnvironmentalConditions, 
    ClubData 
} from '../../types/physics';

describe('BallFlightCalculator', () => {
    let calculator: BallFlightCalculator;

    beforeEach(() => {
        calculator = new BallFlightCalculator();
    });

    describe('calculateTrajectory', () => {
        const standardInitialConditions: InitialConditions = {
            velocity: { x: 150, y: 30, z: 0 },
            spinRate: 2500
        };

        const standardEnvironmentalConditions: EnvironmentalConditions = {
            temperature: 70,
            pressure: 29.92,
            humidity: 50,
            windSpeed: 0,
            windDirection: 0,
            elevation: 0,
            groundHardness: 0.7
        };

        const standardClubData: ClubData = {
            type: 'driver',
            loft: 10.5,
            spinFactor: 1.0,
            quality: 1.0
        };

        test('should calculate basic trajectory without wind', () => {
            const trajectory = calculator.calculateTrajectory(
                standardInitialConditions,
                standardEnvironmentalConditions,
                standardClubData
            );

            // Verify trajectory starts at origin
            expect(trajectory[0].position.x).toBe(0);
            expect(trajectory[0].position.y).toBe(0);
            expect(trajectory[0].position.z).toBe(0);

            // Verify reasonable trajectory length
            expect(trajectory.length).toBeGreaterThan(10);

            // Verify ball comes down
            const finalPosition = trajectory[trajectory.length - 1].position;
            expect(finalPosition.y).toBeLessThanOrEqual(0.1);

            // Verify reasonable total distance
            expect(finalPosition.x).toBeGreaterThan(200);
            expect(finalPosition.x).toBeLessThan(400);
        });

        test('should handle headwind correctly', () => {
            const headwindConditions: EnvironmentalConditions = {
                ...standardEnvironmentalConditions,
                windSpeed: 10,
                windDirection: 180
            };

            const noWindTrajectory = calculator.calculateTrajectory(
                standardInitialConditions,
                standardEnvironmentalConditions,
                standardClubData
            );

            const headwindTrajectory = calculator.calculateTrajectory(
                standardInitialConditions,
                headwindConditions,
                standardClubData
            );

            // Headwind should reduce total distance
            const noWindDistance = noWindTrajectory[noWindTrajectory.length - 1].position.x;
            const headwindDistance = headwindTrajectory[headwindTrajectory.length - 1].position.x;
            expect(headwindDistance).toBeLessThan(noWindDistance);
        });

        test('should handle ground effects', () => {
            const hardGroundConditions: EnvironmentalConditions = {
                ...standardEnvironmentalConditions,
                groundHardness: 0.9
            };

            const softGroundConditions: EnvironmentalConditions = {
                ...standardEnvironmentalConditions,
                groundHardness: 0.5
            };

            const hardGroundTrajectory = calculator.calculateTrajectory(
                standardInitialConditions,
                hardGroundConditions,
                standardClubData
            );

            const softGroundTrajectory = calculator.calculateTrajectory(
                standardInitialConditions,
                softGroundConditions,
                standardClubData
            );

            // Hard ground should result in more total distance due to more roll
            const hardGroundDistance = hardGroundTrajectory[hardGroundTrajectory.length - 1].position.x;
            const softGroundDistance = softGroundTrajectory[softGroundTrajectory.length - 1].position.x;
            expect(hardGroundDistance).toBeGreaterThan(softGroundDistance);

            // Verify ground phase exists
            const groundPhasePoints = hardGroundTrajectory.filter(p => p.position.y <= 0.1);
            expect(groundPhasePoints.length).toBeGreaterThan(1);
        });

        test('should handle spin effects', () => {
            const highSpinConditions: InitialConditions = {
                ...standardInitialConditions,
                spinRate: 4000
            };

            const lowSpinConditions: InitialConditions = {
                ...standardInitialConditions,
                spinRate: 1000
            };

            const highSpinTrajectory = calculator.calculateTrajectory(
                highSpinConditions,
                standardEnvironmentalConditions,
                standardClubData
            );

            const lowSpinTrajectory = calculator.calculateTrajectory(
                lowSpinConditions,
                standardEnvironmentalConditions,
                standardClubData
            );

            // High spin should result in higher maximum height
            const highSpinMaxHeight = Math.max(...highSpinTrajectory.map(p => p.position.y));
            const lowSpinMaxHeight = Math.max(...lowSpinTrajectory.map(p => p.position.y));
            expect(highSpinMaxHeight).toBeGreaterThan(lowSpinMaxHeight);
        });

        test('should handle altitude effects', () => {
            const seaLevelConditions = standardEnvironmentalConditions;
            const altitudeConditions: EnvironmentalConditions = {
                ...standardEnvironmentalConditions,
                elevation: 5000
            };

            const seaLevelTrajectory = calculator.calculateTrajectory(
                standardInitialConditions,
                seaLevelConditions,
                standardClubData
            );

            const altitudeTrajectory = calculator.calculateTrajectory(
                standardInitialConditions,
                altitudeConditions,
                standardClubData
            );

            // Higher altitude should result in longer distance due to less air resistance
            const seaLevelDistance = seaLevelTrajectory[seaLevelTrajectory.length - 1].position.x;
            const altitudeDistance = altitudeTrajectory[altitudeTrajectory.length - 1].position.x;
            expect(altitudeDistance).toBeGreaterThan(seaLevelDistance);
        });
    });
});
