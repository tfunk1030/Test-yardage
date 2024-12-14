// Bundled JavaScript for browser compatibility
(function() {
    'use strict';

    // Constants
    const WIND_DIRECTIONS = {
        'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
        'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
        'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
        'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };

    // Core calculation functions
    const golfApp = {
        calculateWindEffect(windSpeed, windDirection, shotHeight = 'medium') {
            console.log('Calculating wind effect:', { windSpeed, windDirection, shotHeight });
            const speed = Math.abs(Number(windSpeed) || 0);
            const heightMultipliers = {
                'low': 0.65,
                'medium': 1.0,
                'high': 1.35
            };
            
            let heightMultiplier = heightMultipliers[shotHeight] || 1.0;
            
            if (shotHeight === 'low' && speed > 10) {
                heightMultiplier *= 1 - ((speed - 10) * 0.015);
            }
            
            const angle = WIND_DIRECTIONS[windDirection] || 0;
            const headwindComponent = Math.cos(angle * Math.PI / 180) * speed;
            const crosswindComponent = Math.sin(angle * Math.PI / 180) * speed;
            
            const baseWindEffect = 0.0078;
            const crosswindFactor = 0.0052;
            
            const headwindPower = Math.pow(Math.abs(headwindComponent), 0.92);
            const crosswindPower = Math.pow(Math.abs(crosswindComponent), 0.92);
            
            let headwindMultiplier = 1.0;
            let crosswindMultiplier = 1.0;
            
            if (Math.abs(headwindComponent) > 10) {
                headwindMultiplier = 1.0 + (Math.abs(headwindComponent) - 10) * 0.02;
            }
            if (Math.abs(crosswindComponent) > 10) {
                crosswindMultiplier = 1.0 + (Math.abs(crosswindComponent) - 10) * 0.015;
            }
            
            return {
                distanceEffect: -Math.sign(headwindComponent) * headwindPower * baseWindEffect * heightMultiplier * headwindMultiplier,
                lateralEffect: Math.sign(crosswindComponent) * crosswindPower * crosswindFactor * heightMultiplier * crosswindMultiplier
            };
        },

        calculateAltitudeEffect(altitude = 0) {
            console.log('Calculating altitude effect:', { altitude });
            const alt = Number(altitude) || 0;
            const baseEffect = Math.log(alt / 1000 + 1) * 0.045;
            
            let progressiveEffect = 0;
            if (alt > 2000) progressiveEffect += (alt - 2000) / 120000;
            if (alt > 4000) progressiveEffect += (alt - 4000) / 110000;
            if (alt > 6000) progressiveEffect += (alt - 6000) / 100000;
            
            const densityEffect = Math.exp(-alt / 30000);
            const spinEffect = Math.min(alt / 120000, 0.065);
            const empiricalFactor = 1.15;
            
            const rawEffect = (baseEffect + progressiveEffect) * empiricalFactor;
            const total = 1 + (rawEffect * densityEffect);
            
            return {
                total,
                components: {
                    base: baseEffect,
                    progressive: progressiveEffect,
                    spin: spinEffect,
                    density: densityEffect,
                    empirical: empiricalFactor
                }
            };
        },

        calculateAirDensityRatio(conditions) {
            console.log('Calculating air density ratio:', conditions);
            const standardTemp = 59;
            const standardPressure = 29.92;
            const standardHumidity = 50;
            
            const tempRankine = (conditions.temp || standardTemp) + 459.67;
            const standardTempRankine = standardTemp + 459.67;
            
            const pressureRatio = Math.pow((conditions.pressure || standardPressure) / standardPressure, 0.45);
            const temperatureRatio = Math.pow(standardTempRankine / tempRankine, 0.5);
            
            const humidity = conditions.humidity || standardHumidity;
            const humidityFactor = 1 - ((humidity - standardHumidity) / 100 * 0.008);
            
            return Math.pow(pressureRatio * temperatureRatio * humidityFactor, 1.0);
        },

        handleWeatherSubmit(event) {
            console.log('Weather form submitted');
            event.preventDefault();
            
            const conditions = {
                temp: Number(document.getElementById('temperature').value),
                humidity: Number(document.getElementById('humidity').value),
                altitude: Number(document.getElementById('altitude').value),
                pressure: Number(document.getElementById('pressure').value)
            };
            
            console.log('Form values:', conditions);
            
            const densityRatio = this.calculateAirDensityRatio(conditions);
            const altitudeEffect = this.calculateAltitudeEffect(conditions.altitude);
            const totalEffect = densityRatio * altitudeEffect.total;
            
            console.log('Calculation results:', {
                densityRatio,
                altitudeEffect,
                totalEffect
            });
            
            // Update results display
            document.getElementById('densityEffect').textContent = 
                `${((densityRatio - 1) * 100).toFixed(1)}%`;
            document.getElementById('altitudeEffect').textContent = 
                `${((altitudeEffect.total - 1) * 100).toFixed(1)}%`;
            document.getElementById('totalEffect').textContent = 
                `${((totalEffect - 1) * 100).toFixed(1)}%`;
            
            // Show results section
            const resultsSection = document.getElementById('results');
            resultsSection.classList.add('visible');
        },

        handleWindSubmit(event) {
            console.log('Wind form submitted');
            event.preventDefault();
            
            const windSpeed = Number(document.getElementById('windSpeed').value);
            const windDirection = document.getElementById('windDirection').value;
            const shotHeight = document.getElementById('shotHeight').value;
            
            console.log('Form values:', { windSpeed, windDirection, shotHeight });
            
            const windEffect = this.calculateWindEffect(windSpeed, windDirection, shotHeight);
            
            console.log('Wind effect results:', windEffect);
            
            // Update results display
            document.getElementById('distanceEffect').textContent = 
                `${(windEffect.distanceEffect * 100).toFixed(1)}%`;
            document.getElementById('lateralEffect').textContent = 
                `${(windEffect.lateralEffect * 100).toFixed(1)}%`;
            
            // Show results section
            const resultsSection = document.getElementById('results');
            resultsSection.classList.add('visible');
        },

        init() {
            console.log('Initializing Golf Yardage Calculator');
            
            // Add form submit event listeners
            const weatherForm = document.getElementById('weatherForm');
            if (weatherForm) {
                console.log('Weather form found, attaching handler');
                weatherForm.addEventListener('submit', this.handleWeatherSubmit.bind(this));
            }

            const windForm = document.getElementById('windForm');
            if (windForm) {
                console.log('Wind form found, attaching handler');
                windForm.addEventListener('submit', this.handleWindSubmit.bind(this));
            }

            console.log('Golf Yardage Calculator initialized');
        }
    };

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM Content Loaded');
        golfApp.init();
    });

    // Make golfApp available globally
    window.golfApp = golfApp;
})();
