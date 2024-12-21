import { WindAdjustment } from '../types/environment';
import { ClubType } from '../types/club';
import { PGA_CLUB_DATA } from '../data/club-data';

interface WindVector {
    speed: number;
    direction: number;
}

interface ShotParameters {
    clubType: ClubType;
    initialVelocity: number;
    launchAngle: number;
    backSpin: number;
    sideSpin: number;
}

export class WindCalculator {
    private readonly AIR_DENSITY: number = 0.0765;  // lb/ft³ at sea level
    private readonly GRAVITY: number = 32.174;      // ft/s²
    private readonly MAGNUS_COEFFICIENT: number = 0.25;
    private readonly WIND_GRADIENT_POWER: number = 0.143;

    public calculateWindEffect(
        wind: WindVector,
        shot: ShotParameters,
        elevation: number = 0
    ): WindAdjustment {
        const clubData = PGA_CLUB_DATA[shot.clubType];
        const flightTime = this.estimateFlightTime(shot.initialVelocity, shot.launchAngle);
        const maxHeight = this.estimateMaxHeight(shot.initialVelocity, shot.launchAngle);
        
        // Adjust wind speed for altitude
        const altitudeFactor = Math.exp(-elevation / 29000);
        const effectiveWindSpeed = wind.speed * altitudeFactor;
        
        // Calculate crosswind and headwind components
        const windRad = (wind.direction * Math.PI) / 180;
        const headwind = effectiveWindSpeed * Math.cos(windRad);
        const crosswind = effectiveWindSpeed * Math.sin(windRad);
        
        // Calculate distance adjustment
        const distanceAdjustment = this.calculateDistanceAdjustment(
            headwind,
            shot.initialVelocity,
            shot.launchAngle,
            clubData.spinFactor
        );
        
        // Calculate direction adjustment
        const directionAdjustment = this.calculateDirectionAdjustment(
            crosswind,
            shot.initialVelocity,
            flightTime,
            shot.backSpin
        );
        
        // Calculate apex adjustment
        const apexAdjustment = this.calculateApexAdjustment(
            headwind,
            maxHeight,
            shot.launchAngle
        );
        
        return {
            distance: distanceAdjustment,
            direction: directionAdjustment,
            apex: apexAdjustment
        };
    }
    
    private estimateFlightTime(velocity: number, launchAngle: number): number {
        const verticalVelocity = velocity * Math.sin(launchAngle * Math.PI / 180);
        return (2 * verticalVelocity) / this.GRAVITY;
    }
    
    private estimateMaxHeight(velocity: number, launchAngle: number): number {
        const verticalVelocity = velocity * Math.sin(launchAngle * Math.PI / 180);
        return (verticalVelocity * verticalVelocity) / (2 * this.GRAVITY);
    }
    
    private calculateDistanceAdjustment(
        headwind: number,
        velocity: number,
        launchAngle: number,
        spinFactor: number
    ): number {
        // Convert headwind to ft/s
        const headwindFts = headwind * 1.467;
        
        // Basic distance adjustment due to wind resistance
        const basicAdjustment = -headwindFts * this.estimateFlightTime(velocity, launchAngle);
        
        // Additional adjustment for spin effect
        const spinAdjustment = spinFactor * headwindFts * Math.sin(launchAngle * Math.PI / 180);
        
        // Convert to yards
        return (basicAdjustment + spinAdjustment) / 3;
    }
    
    private calculateDirectionAdjustment(
        crosswind: number,
        velocity: number,
        flightTime: number,
        backSpin: number
    ): number {
        // Convert crosswind to ft/s
        const crosswindFts = crosswind * 1.467;
        
        // Basic lateral movement
        const basicLateral = crosswindFts * flightTime;
        
        // Magnus effect adjustment
        const magnusAdjustment = this.MAGNUS_COEFFICIENT * backSpin * crosswindFts * flightTime;
        
        // Convert to degrees
        const totalLateral = basicLateral + magnusAdjustment;
        return Math.atan2(totalLateral, velocity * flightTime) * 180 / Math.PI;
    }
    
    private calculateApexAdjustment(
        headwind: number,
        maxHeight: number,
        launchAngle: number
    ): number {
        // Convert headwind to ft/s
        const headwindFts = headwind * 1.467;
        
        // Adjust max height based on wind
        const heightAdjustment = headwindFts * Math.sin(launchAngle * Math.PI / 180) * 0.1;
        
        return (maxHeight + heightAdjustment) - maxHeight;
    }
    
    public getWindGradient(windSpeed: number, height: number): number {
        // Calculate wind speed at given height using power law
        const referenceHeight = 6; // feet (typical measurement height)
        return windSpeed * Math.pow(height / referenceHeight, this.WIND_GRADIENT_POWER);
    }
}
