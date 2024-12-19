/**
 * Shot Visualization System
 * Provides advanced visualization tools for shot analysis
 */

class ShotVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = {
            x: 0.5, // yards to pixels
            y: 0.5
        };
        this.origin = {
            x: 50,
            y: canvas.height - 50
        };
    }

    /**
     * Draw shot trajectory
     * @param {Array} trajectory - Trajectory points
     * @param {Object} options - Visualization options
     */
    drawTrajectory(trajectory, options = {}) {
        const {
            color = '#2196F3',
            lineWidth = 2,
            showPoints = false,
            showForces = false
        } = options;

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;

        trajectory.forEach((point, i) => {
            const screenX = this.origin.x + point.position.x * this.scale.x;
            const screenY = this.origin.y - point.position.z * this.scale.y;

            if (i === 0) {
                this.ctx.moveTo(screenX, screenY);
            } else {
                this.ctx.lineTo(screenX, screenY);
            }

            if (showPoints) {
                this.drawPoint(screenX, screenY, 3, color);
            }

            if (showForces && i % 10 === 0) {
                this.drawForces(point, screenX, screenY);
            }
        });

        this.ctx.stroke();
    }

    /**
     * Draw shot dispersion pattern
     * @param {Array} shots - Array of shots
     * @param {Object} options - Visualization options
     */
    drawDispersionPattern(shots, options = {}) {
        const {
            color = '#4CAF50',
            opacity = 0.2,
            showEllipse = true,
            showPoints = true
        } = options;

        // Calculate dispersion statistics
        const stats = this.calculateDispersionStats(shots);

        if (showEllipse) {
            this.drawDispersionEllipse(stats, color, opacity);
        }

        if (showPoints) {
            shots.forEach(shot => {
                const screenX = this.origin.x + shot.position.x * this.scale.x;
                const screenY = this.origin.y - shot.position.y * this.scale.y;
                this.drawPoint(screenX, screenY, 5, color);
            });
        }
    }

    /**
     * Draw shot heat map
     * @param {Array} shots - Array of shots
     * @param {Object} options - Visualization options
     */
    drawHeatMap(shots, options = {}) {
        const {
            resolution = 10,
            maxIntensity = 1,
            colorScale = ['#FFEBEE', '#F44336']
        } = options;

        // Create grid
        const grid = this.createHeatMapGrid(shots, resolution);
        
        // Draw heat map
        grid.forEach((row, i) => {
            row.forEach((intensity, j) => {
                const x = this.origin.x + i * resolution * this.scale.x;
                const y = this.origin.y - j * resolution * this.scale.y;
                
                const color = this.interpolateColor(
                    colorScale[0],
                    colorScale[1],
                    intensity / maxIntensity
                );
                
                this.drawCell(x, y, resolution * this.scale.x, color);
            });
        });
    }

    /**
     * Draw shot analytics
     * @param {Object} analytics - Shot analytics data
     * @param {Object} options - Visualization options
     */
    drawAnalytics(analytics, options = {}) {
        const {
            showStats = true,
            showTrends = true,
            showConfidence = true
        } = options;

        if (showStats) {
            this.drawStatistics(analytics.stats);
        }

        if (showTrends) {
            this.drawTrendLines(analytics.trends);
        }

        if (showConfidence) {
            this.drawConfidenceRegions(analytics.confidence);
        }
    }

    /**
     * Draw environmental effects
     * @param {Object} environment - Environmental data
     * @param {Object} options - Visualization options
     */
    drawEnvironment(environment, options = {}) {
        const {
            showWind = true,
            showAltitude = true,
            showTemperature = true
        } = options;

        if (showWind) {
            this.drawWindIndicator(environment.wind);
        }

        if (showAltitude) {
            this.drawAltitudeEffect(environment.altitude);
        }

        if (showTemperature) {
            this.drawTemperatureEffect(environment.temperature);
        }
    }

    /**
     * Draw forces acting on the ball
     * @param {Object} point - Trajectory point
     * @param {number} x - Screen X coordinate
     * @param {number} y - Screen Y coordinate
     */
    drawForces(point, x, y) {
        const scale = 20; // Force vector scale factor
        
        // Draw drag force
        this.drawVector(x, y, point.forces.drag, '#FF5722', scale);
        
        // Draw lift force
        this.drawVector(x, y, point.forces.lift, '#4CAF50', scale);
        
        // Draw Magnus force
        this.drawVector(x, y, point.forces.magnus, '#2196F3', scale);
    }

    /**
     * Draw a force vector
     * @param {number} x - Start X coordinate
     * @param {number} y - Start Y coordinate
     * @param {Object} force - Force vector
     * @param {string} color - Vector color
     * @param {number} scale - Vector scale factor
     */
    drawVector(x, y, force, color, scale) {
        const endX = x + force.x * scale;
        const endY = y - force.y * scale;

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Draw arrow head
        this.drawArrowHead(endX, endY, Math.atan2(-force.y, force.x), color);
    }

    /**
     * Draw arrow head
     * @param {number} x - Tip X coordinate
     * @param {number} y - Tip Y coordinate
     * @param {number} angle - Arrow angle
     * @param {string} color - Arrow color
     */
    drawArrowHead(x, y, angle, color) {
        const size = 8;
        
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
            x - size * Math.cos(angle - Math.PI/6),
            y + size * Math.sin(angle - Math.PI/6)
        );
        this.ctx.lineTo(
            x - size * Math.cos(angle + Math.PI/6),
            y + size * Math.sin(angle + Math.PI/6)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Create heat map grid
     * @param {Array} shots - Array of shots
     * @param {number} resolution - Grid resolution
     * @returns {Array} Heat map grid
     */
    createHeatMapGrid(shots, resolution) {
        const grid = [];
        const maxX = Math.max(...shots.map(s => s.position.x));
        const maxY = Math.max(...shots.map(s => s.position.y));
        
        for (let i = 0; i <= maxX/resolution; i++) {
            grid[i] = [];
            for (let j = 0; j <= maxY/resolution; j++) {
                grid[i][j] = 0;
            }
        }
        
        shots.forEach(shot => {
            const i = Math.floor(shot.position.x / resolution);
            const j = Math.floor(shot.position.y / resolution);
            if (grid[i]) {
                grid[i][j] = (grid[i][j] || 0) + 1;
            }
        });
        
        return grid;
    }

    /**
     * Interpolate between colors
     * @param {string} color1 - Start color
     * @param {string} color2 - End color
     * @param {number} factor - Interpolation factor
     * @returns {string} Interpolated color
     */
    interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return `rgb(${r},${g},${b})`;
    }

    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color string
     * @returns {Object} RGB color object
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Draw a point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Point radius
     * @param {string} color - Point color
     */
    drawPoint(x, y, radius, color) {
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw a grid cell
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} size - Cell size
     * @param {string} color - Cell color
     */
    drawCell(x, y, size, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y - size, size, size);
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export const shotVisualizer = new ShotVisualizer(document.getElementById('shotCanvas'));
