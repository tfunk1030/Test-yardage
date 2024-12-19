import {
    calculateReynoldsNumber,
    calculateDragCoefficient,
    calculateMagnusCoefficient,
    calculateLiftCoefficient,
    calculateAerodynamicForces
} from '../../src/physics/ball-aerodynamics.js';

const STANDARD_CONDITIONS = {
    velocity: 44.704, // 100 mph in m/s
    spinRate: 2500,   // rpm
    airDensity: 1.225, // kg/m³ at sea level
    launchAngle: 12   // degrees
};

function getTestConditions(overrides = {}) {
    return { ...STANDARD_CONDITIONS, ...overrides };
}

describe('Ball Aerodynamics Tests', () => {
    describe('Reynolds Number', () => {
        test('calculation is accurate for standard conditions', () => {
            const reynolds = calculateReynoldsNumber(
                STANDARD_CONDITIONS.velocity,
                STANDARD_CONDITIONS.airDensity
            );
            
            expect(reynolds).toBeGreaterThan(100000);
            expect(reynolds).toBeLessThan(120000);
        });
    });

    describe('Drag Coefficient', () => {
        test.each([
            [30000, 2500, 0.4, Infinity],
            [100000, 2500, 0, 0.3]
        ])('varies with Reynolds number %i', (reynolds, spinRate, min, max) => {
            const coefficient = calculateDragCoefficient(reynolds, spinRate);
            
            expect(coefficient).toBeGreaterThan(min);
            expect(coefficient).toBeLessThan(max);
        });
    });

    describe('Magnus Coefficient', () => {
        test('increases proportionally with spin rate', () => {
            const { velocity } = STANDARD_CONDITIONS;
            const lowSpin = calculateMagnusCoefficient(2000, velocity);
            const highSpin = calculateMagnusCoefficient(4000, velocity);
            
            expect(highSpin).toBeGreaterThan(lowSpin);
            expect(highSpin / lowSpin).toBeCloseTo(2, 1);
        });
    });

    describe('Lift Coefficient', () => {
        test('responds proportionally to spin rate', () => {
            const reynolds = 100000;
            const lowSpin = calculateLiftCoefficient(reynolds, 2000);
            const highSpin = calculateLiftCoefficient(reynolds, 4000);
            
            expect(highSpin).toBeGreaterThan(lowSpin);
            expect(highSpin / lowSpin).toBeCloseTo(2, 1);
        });
    });

    describe('Aerodynamic Forces', () => {
        test('calculates all forces correctly for standard conditions', () => {
            const forces = calculateAerodynamicForces(getTestConditions());
            
            expect(forces).toEqual(expect.objectContaining({
                dragForce: expect.any(Number),
                liftForce: expect.any(Number),
                magnusForce: expect.any(Number),
                dragCoefficient: expect.any(Number)
            }));

            expect(forces.dragForce).toBeGreaterThan(0);
            expect(forces.liftForce).toBeGreaterThan(0);
            expect(forces.magnusForce).toBeGreaterThan(0);
            expect(forces.dragCoefficient).toBeLessThan(0.5);
        });

        test('forces scale quadratically with velocity', () => {
            const lowSpeed = calculateAerodynamicForces(getTestConditions({ 
                velocity: 22.352 // 50 mph
            }));

            const highSpeed = calculateAerodynamicForces(getTestConditions({ 
                velocity: 44.704 // 100 mph
            }));

            // Forces should follow v² relationship (factor of 4)
            expect(highSpeed.dragForce).toBeCloseTo(lowSpeed.dragForce * 4, 1);
            expect(highSpeed.liftForce).toBeCloseTo(lowSpeed.liftForce * 4, 1);
            expect(highSpeed.magnusForce).toBeCloseTo(lowSpeed.magnusForce * 4, 1);
        });
    });
});