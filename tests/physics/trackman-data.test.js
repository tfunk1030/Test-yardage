import { TRACKMAN_CLUB_DATA, getNormalizedClubData } from '../../src/data/trackman-data.js';

describe('TrackMan Data Tests', () => {
    test('Driver data matches TrackMan 2024 specifications', () => {
        const driver = TRACKMAN_CLUB_DATA.driver;
        expect(driver.ballSpeed).toBeCloseTo(167, 1);
        expect(driver.launchAngle).toBeCloseTo(10.9, 1);
        expect(driver.backSpin).toBeCloseTo(2686, 0);
        expect(driver.carryDistance).toBeCloseTo(275.2, 1);
    });

    test('Club progression follows expected patterns', () => {
        const clubs = ['driver', 'three_wood', 'five_wood', 'four_iron'];
        for (let i = 1; i < clubs.length; i++) {
            expect(TRACKMAN_CLUB_DATA[clubs[i]].ballSpeed)
                .toBeLessThan(TRACKMAN_CLUB_DATA[clubs[i-1]].ballSpeed);
            expect(TRACKMAN_CLUB_DATA[clubs[i]].launchAngle)
                .toBeGreaterThan(TRACKMAN_CLUB_DATA[clubs[i-1]].launchAngle);
        }
    });

    test('Skill level normalization works correctly', () => {
        const proDriver = getNormalizedClubData('driver', 100);
        const amateurDriver = getNormalizedClubData('driver', 70);
        const beginnerDriver = getNormalizedClubData('driver', 40);

        expect(amateurDriver.ballSpeed).toBeLessThan(proDriver.ballSpeed);
        expect(beginnerDriver.ballSpeed).toBeLessThan(amateurDriver.ballSpeed);
        expect(beginnerDriver.backSpin).toBeGreaterThan(proDriver.backSpin);
    });

    test('Invalid club type throws error', () => {
        expect(() => getNormalizedClubData('invalid_club')).toThrow();
    });

    test('Spin rates increase with shorter clubs', () => {
        const clubs = ['driver', 'seven_iron', 'pitching_wedge'];
        for (let i = 1; i < clubs.length; i++) {
            expect(TRACKMAN_CLUB_DATA[clubs[i]].backSpin)
                .toBeGreaterThan(TRACKMAN_CLUB_DATA[clubs[i-1]].backSpin);
        }
    });
});
