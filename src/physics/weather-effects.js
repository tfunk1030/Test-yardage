/**
 * Advanced Weather Effects
 * Implements sophisticated weather effects on ball flight
 */

class WeatherEffects {
    constructor() {
        this.constants = {
            g: 9.81,            // Gravitational acceleration (m/s²)
            rho0: 1.225,        // Sea level air density (kg/m³)
            p0: 101325,         // Sea level pressure (Pa)
            T0: 288.15,         // Sea level temperature (K)
            L: 0.0065,          // Temperature lapse rate (K/m)
            R: 287.05,          // Gas constant for air (J/(kg·K))
            M: 0.0289644,       // Molar mass of air (kg/mol)
            Rv: 461.5,          // Gas constant for water vapor (J/(kg·K))
            cp: 1004.68,        // Specific heat at constant pressure (J/(kg·K))
            gamma: 1.4          // Heat capacity ratio
        };
    }

    /**
     * Calculate all weather effects
     * @param {Object} conditions - Weather conditions
     * @param {Object} ball - Ball parameters
     * @returns {Object} Weather effects
     */
    calculateEffects(conditions, ball) {
        const atmosphere = this.calculateAtmosphericProperties(conditions);
        const wind = this.calculateWindEffects(conditions, ball);
        const moisture = this.calculateMoistureEffects(conditions, ball);
        const thermal = this.calculateThermalEffects(conditions, ball);
        
        return {
            atmosphere,
            wind,
            moisture,
            thermal,
            combined: this.combineEffects([
                atmosphere,
                wind,
                moisture,
                thermal
            ])
        };
    }

    /**
     * Calculate atmospheric properties
     * @param {Object} conditions - Weather conditions
     * @returns {Object} Atmospheric properties
     */
    calculateAtmosphericProperties(conditions) {
        const { temperature, pressure, altitude } = conditions;
        
        // Temperature variation with altitude
        const T = this.calculateTemperatureProfile(temperature, altitude);
        
        // Pressure variation with altitude
        const P = this.calculatePressureProfile(pressure, temperature, altitude);
        
        // Density variation with altitude
        const rho = this.calculateDensityProfile(P, T);
        
        // Speed of sound
        const a = this.calculateSpeedOfSound(T);
        
        return {
            temperature: T,
            pressure: P,
            density: rho,
            speedOfSound: a,
            reynoldsNumber: this.calculateReynoldsNumber(rho, ball)
        };
    }

    /**
     * Calculate wind effects
     * @param {Object} conditions - Weather conditions
     * @param {Object} ball - Ball parameters
     * @returns {Object} Wind effects
     */
    calculateWindEffects(conditions, ball) {
        const { windSpeed, windDirection, altitude } = conditions;
        
        // Wind gradient with height
        const gradient = this.calculateWindGradient(
            windSpeed,
            windDirection,
            altitude
        );
        
        // Wind shear effects
        const shear = this.calculateWindShear(gradient, ball);
        
        // Turbulence effects
        const turbulence = this.calculateTurbulence(
            gradient,
            conditions.temperature
        );
        
        return {
            gradient,
            shear,
            turbulence,
            effectiveWind: this.calculateEffectiveWind(gradient, shear, turbulence)
        };
    }

    /**
     * Calculate moisture effects
     * @param {Object} conditions - Weather conditions
     * @param {Object} ball - Ball parameters
     * @returns {Object} Moisture effects
     */
    calculateMoistureEffects(conditions, ball) {
        const { humidity, temperature, pressure } = conditions;
        
        // Vapor pressure
        const e = this.calculateVaporPressure(temperature, humidity);
        
        // Air density correction
        const rhoMoist = this.calculateMoistAirDensity(
            temperature,
            pressure,
            e
        );
        
        // Surface tension effects
        const tension = this.calculateSurfaceTension(
            temperature,
            humidity,
            ball
        );
        
        return {
            vaporPressure: e,
            density: rhoMoist,
            surfaceTension: tension,
            dragModifier: this.calculateMoistureDrag(humidity, temperature)
        };
    }

    /**
     * Calculate thermal effects
     * @param {Object} conditions - Weather conditions
     * @param {Object} ball - Ball parameters
     * @returns {Object} Thermal effects
     */
    calculateThermalEffects(conditions, ball) {
        const { temperature, solarRadiation } = conditions;
        
        // Thermal boundary layer
        const boundary = this.calculateThermalBoundary(
            temperature,
            ball.velocity
        );
        
        // Heat transfer
        const transfer = this.calculateHeatTransfer(
            temperature,
            solarRadiation,
            ball
        );
        
        // Thermal expansion
        const expansion = this.calculateThermalExpansion(
            temperature,
            ball.material
        );
        
        return {
            boundary,
            transfer,
            expansion,
            effectiveTemperature: this.calculateEffectiveTemperature(
                temperature,
                transfer
            )
        };
    }

    /**
     * Calculate temperature profile with altitude
     * @param {number} T0 - Surface temperature
     * @param {number} h - Altitude
     * @returns {number} Temperature at altitude
     */
    calculateTemperatureProfile(T0, h) {
        return T0 - this.constants.L * h;
    }

    /**
     * Calculate pressure profile with altitude
     * @param {number} P0 - Surface pressure
     * @param {number} T0 - Surface temperature
     * @param {number} h - Altitude
     * @returns {number} Pressure at altitude
     */
    calculatePressureProfile(P0, T0, h) {
        const exponent = -this.constants.g * this.constants.M /
                        (this.constants.R * this.constants.L);
        const ratio = this.calculateTemperatureProfile(T0, h) / T0;
        
        return P0 * Math.pow(ratio, exponent);
    }

    /**
     * Calculate density profile with altitude
     * @param {number} P - Pressure
     * @param {number} T - Temperature
     * @returns {number} Density
     */
    calculateDensityProfile(P, T) {
        return P / (this.constants.R * T);
    }

    /**
     * Calculate speed of sound
     * @param {number} T - Temperature
     * @returns {number} Speed of sound
     */
    calculateSpeedOfSound(T) {
        return Math.sqrt(this.constants.gamma * this.constants.R * T);
    }

    /**
     * Calculate Reynolds number
     * @param {number} rho - Air density
     * @param {Object} ball - Ball parameters
     * @returns {number} Reynolds number
     */
    calculateReynoldsNumber(rho, ball) {
        const mu = 1.81e-5; // Dynamic viscosity of air
        return (rho * ball.velocity * ball.diameter) / mu;
    }

    /**
     * Calculate wind gradient
     * @param {number} V0 - Surface wind speed
     * @param {number} direction - Wind direction
     * @param {number} h - Altitude
     * @returns {Object} Wind gradient
     */
    calculateWindGradient(V0, direction, h) {
        const alpha = 0.143; // Power law exponent for open terrain
        const href = 10; // Reference height
        
        const speed = V0 * Math.pow(h / href, alpha);
        const theta = direction + this.calculateDirectionShift(h);
        
        return {
            speed,
            direction: theta,
            components: {
                x: speed * Math.cos(theta),
                y: speed * Math.sin(theta)
            }
        };
    }

    /**
     * Calculate wind shear
     * @param {Object} gradient - Wind gradient
     * @param {Object} ball - Ball parameters
     * @returns {Object} Wind shear effects
     */
    calculateWindShear(gradient, ball) {
        const shearCoefficient = 0.1; // Typical value for golf ball
        const relativeVelocity = this.calculateRelativeVelocity(
            gradient,
            ball.velocity
        );
        
        return {
            force: shearCoefficient * relativeVelocity * relativeVelocity,
            moment: this.calculateShearMoment(gradient, ball)
        };
    }

    /**
     * Calculate turbulence
     * @param {Object} gradient - Wind gradient
     * @param {number} temperature - Temperature
     * @returns {Object} Turbulence effects
     */
    calculateTurbulence(gradient, temperature) {
        const intensityFactor = 0.15; // Typical value for open terrain
        const lengthScale = this.calculateTurbulenceLengthScale(gradient.speed);
        
        return {
            intensity: intensityFactor * gradient.speed,
            scale: lengthScale,
            spectrum: this.calculateTurbulenceSpectrum(gradient, lengthScale)
        };
    }

    /**
     * Calculate vapor pressure
     * @param {number} T - Temperature
     * @param {number} RH - Relative humidity
     * @returns {number} Vapor pressure
     */
    calculateVaporPressure(T, RH) {
        // Magnus formula
        const a = 17.27;
        const b = 237.7;
        const es = 611.2 * Math.exp((a * T) / (b + T));
        
        return (RH / 100) * es;
    }

    /**
     * Calculate moist air density
     * @param {number} T - Temperature
     * @param {number} P - Pressure
     * @param {number} e - Vapor pressure
     * @returns {number} Moist air density
     */
    calculateMoistAirDensity(T, P, e) {
        const Rd = this.constants.R;
        const Rv = this.constants.Rv;
        
        return (P - e) / (Rd * T) + e / (Rv * T);
    }

    /**
     * Calculate surface tension
     * @param {number} T - Temperature
     * @param {number} RH - Relative humidity
     * @param {Object} ball - Ball parameters
     * @returns {Object} Surface tension effects
     */
    calculateSurfaceTension(T, RH, ball) {
        const sigma0 = 0.072; // Surface tension of water at 20°C
        const dSigma = -0.00015; // Temperature coefficient
        
        const sigma = sigma0 + dSigma * (T - 20);
        const contact = this.calculateContactAngle(RH, ball.material);
        
        return {
            tension: sigma,
            contactAngle: contact,
            force: this.calculateTensionForce(sigma, contact, ball)
        };
    }

    /**
     * Calculate thermal boundary layer
     * @param {number} T - Temperature
     * @param {number} V - Velocity
     * @returns {Object} Boundary layer properties
     */
    calculateThermalBoundary(T, V) {
        const Pr = 0.71; // Prandtl number for air
        const Re = this.calculateReynoldsNumber(this.constants.rho0, { velocity: V, diameter: 0.0427 });
        
        return {
            thickness: this.calculateBoundaryThickness(Re, Pr),
            profile: this.calculateTemperatureProfile(T, Re),
            heat: this.calculateBoundaryHeat(T, V, Re, Pr)
        };
    }

    /**
     * Combine all effects
     * @param {Array} effects - Individual effects
     * @returns {Object} Combined effects
     */
    combineEffects(effects) {
        return {
            forces: this.combineForcesAndMoments(effects),
            coefficients: this.combineAerodynamicCoefficients(effects),
            trajectory: this.calculateModifiedTrajectory(effects)
        };
    }
}

export const weatherEffects = new WeatherEffects();
