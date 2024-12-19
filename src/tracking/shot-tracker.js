/**
 * Shot Tracking System
 * Records and analyzes shot data for validation and improvement
 */

/**
 * Shot data structure for storage
 */
class ShotData {
    constructor(data) {
        this.timestamp = new Date().toISOString();
        this.clubType = data.clubType;
        this.conditions = {
            temperature: data.temperature,
            humidity: data.humidity,
            pressure: data.pressure,
            altitude: data.altitude,
            windSpeed: data.windSpeed,
            windDirection: data.windDirection
        };
        this.actual = {
            carryDistance: data.actualCarry,
            totalDistance: data.actualTotal,
            direction: data.actualDirection
        };
        this.calculated = {
            carryDistance: data.calculatedCarry,
            totalDistance: data.calculatedTotal,
            direction: data.calculatedDirection
        };
        this.error = {
            carry: this.calculated.carryDistance - this.actual.carryDistance,
            total: this.calculated.totalDistance - this.actual.totalDistance,
            direction: this.calculated.direction - this.actual.direction
        };
    }
}

/**
 * Shot tracking database
 */
class ShotTracker {
    constructor() {
        this.shots = this.loadShots();
    }

    /**
     * Load shots from localStorage
     */
    loadShots() {
        const stored = localStorage.getItem('shotData');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Save shots to localStorage
     */
    saveShots() {
        localStorage.setItem('shotData', JSON.stringify(this.shots));
    }

    /**
     * Add new shot data
     * @param {Object} shotData - Shot data to record
     */
    recordShot(shotData) {
        const shot = new ShotData(shotData);
        this.shots.push(shot);
        this.saveShots();
        return this.analyzeShot(shot);
    }

    /**
     * Analyze individual shot
     * @param {Object} shot - Shot to analyze
     * @returns {Object} Shot analysis
     */
    analyzeShot(shot) {
        const carryError = (shot.error.carry / shot.actual.carryDistance) * 100;
        const totalError = (shot.error.total / shot.actual.totalDistance) * 100;
        
        return {
            accuracy: {
                carry: Math.abs(carryError),
                total: Math.abs(totalError),
                direction: Math.abs(shot.error.direction)
            },
            isAccurate: Math.abs(carryError) < 5 && Math.abs(totalError) < 5,
            conditions: shot.conditions
        };
    }

    /**
     * Get statistics for a specific club
     * @param {string} clubType - Club to analyze
     * @returns {Object} Club statistics
     */
    getClubStats(clubType) {
        const clubShots = this.shots.filter(shot => shot.clubType === clubType);
        if (clubShots.length === 0) return null;

        const stats = {
            totalShots: clubShots.length,
            averageCarry: 0,
            averageTotal: 0,
            accuracy: 0,
            consistency: 0
        };

        // Calculate averages
        stats.averageCarry = clubShots.reduce((sum, shot) => 
            sum + shot.actual.carryDistance, 0) / clubShots.length;
        stats.averageTotal = clubShots.reduce((sum, shot) => 
            sum + shot.actual.totalDistance, 0) / clubShots.length;

        // Calculate accuracy (% of shots within 5% of calculated)
        const accurateShots = clubShots.filter(shot => 
            Math.abs(shot.error.carry / shot.actual.carryDistance) < 0.05);
        stats.accuracy = (accurateShots.length / clubShots.length) * 100;

        // Calculate consistency (standard deviation of carry distances)
        const carries = clubShots.map(shot => shot.actual.carryDistance);
        stats.consistency = this.calculateStandardDeviation(carries);

        return stats;
    }

    /**
     * Calculate standard deviation
     * @param {Array} values - Array of numbers
     * @returns {number} Standard deviation
     */
    calculateStandardDeviation(values) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
    }

    /**
     * Get environmental impact analysis
     * @returns {Object} Environmental impact analysis
     */
    analyzeEnvironmentalImpact() {
        const analysis = {
            temperature: {},
            altitude: {},
            wind: {}
        };

        // Group shots by temperature ranges
        const tempRanges = this.groupShots(shot => 
            Math.floor(shot.conditions.temperature / 10) * 10);
        
        // Analyze each temperature range
        for (const [temp, shots] of Object.entries(tempRanges)) {
            analysis.temperature[temp] = this.calculateAverageError(shots);
        }

        // Group shots by altitude ranges
        const altRanges = this.groupShots(shot => 
            Math.floor(shot.conditions.altitude / 1000) * 1000);
        
        // Analyze each altitude range
        for (const [alt, shots] of Object.entries(altRanges)) {
            analysis.altitude[alt] = this.calculateAverageError(shots);
        }

        // Group shots by wind speed ranges
        const windRanges = this.groupShots(shot => 
            Math.floor(shot.conditions.windSpeed / 5) * 5);
        
        // Analyze each wind range
        for (const [wind, shots] of Object.entries(windRanges)) {
            analysis.wind[wind] = this.calculateAverageError(shots);
        }

        return analysis;
    }

    /**
     * Group shots by condition
     * @param {Function} groupingFunction - Function to determine group
     * @returns {Object} Grouped shots
     */
    groupShots(groupingFunction) {
        const groups = {};
        this.shots.forEach(shot => {
            const group = groupingFunction(shot);
            if (!groups[group]) groups[group] = [];
            groups[group].push(shot);
        });
        return groups;
    }

    /**
     * Calculate average error for a group of shots
     * @param {Array} shots - Array of shots
     * @returns {Object} Average errors
     */
    calculateAverageError(shots) {
        const totalError = shots.reduce((sum, shot) => sum + Math.abs(shot.error.carry), 0);
        const averageError = totalError / shots.length;
        return {
            averageError,
            numberOfShots: shots.length,
            standardDeviation: this.calculateStandardDeviation(
                shots.map(shot => shot.error.carry)
            )
        };
    }
}

export const shotTracker = new ShotTracker();
