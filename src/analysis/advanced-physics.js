/**
 * Advanced Physics Engine
 * Implements sophisticated physics calculations for golf ball flight
 */

class PhysicsEngine {
    constructor() {
        this.constants = {
            g: 9.81,          // Gravitational acceleration (m/s²)
            rho: 1.225,       // Air density at sea level (kg/m³)
            nu: 1.81e-5,      // Kinematic viscosity of air (m²/s)
            ballMass: 0.0459, // Mass of golf ball (kg)
            ballRadius: 0.0213 // Radius of golf ball (m)
        };
    }

    /**
     * Calculate complete ball trajectory
     * @param {Object} initialConditions - Initial shot conditions
     * @param {Object} environment - Environmental conditions
     * @returns {Object} Trajectory data
     */
    calculateTrajectory(initialConditions, environment) {
        const dt = 0.001; // Time step (s)
        const maxTime = 10; // Maximum flight time (s)
        const trajectory = [];
        
        let state = this.initializeState(initialConditions);
        let t = 0;
        
        while (t < maxTime && state.position.z >= 0) {
            // Calculate forces
            const forces = this.calculateForces(state, environment);
            
            // Update state
            state = this.updateState(state, forces, dt);
            
            // Record trajectory point
            trajectory.push({
                time: t,
                position: { ...state.position },
                velocity: { ...state.velocity },
                forces: { ...forces }
            });
            
            t += dt;
        }
        
        return {
            trajectory,
            finalState: state,
            metrics: this.calculateFlightMetrics(trajectory)
        };
    }

    /**
     * Initialize state vector
     * @param {Object} conditions - Initial conditions
     * @returns {Object} Initial state
     */
    initializeState(conditions) {
        const { speed, launchAngle, direction } = conditions;
        
        // Convert angles to radians
        const phi = launchAngle * Math.PI / 180;
        const theta = direction * Math.PI / 180;
        
        return {
            position: { x: 0, y: 0, z: 0 },
            velocity: {
                x: speed * Math.cos(phi) * Math.cos(theta),
                y: speed * Math.cos(phi) * Math.sin(theta),
                z: speed * Math.sin(phi)
            },
            spin: { ...conditions.spin }
        };
    }

    /**
     * Calculate all forces acting on the ball
     * @param {Object} state - Current state
     * @param {Object} environment - Environmental conditions
     * @returns {Object} Forces
     */
    calculateForces(state, environment) {
        const gravity = this.calculateGravity();
        const drag = this.calculateDrag(state, environment);
        const lift = this.calculateLift(state, environment);
        const magnus = this.calculateMagnusForce(state, environment);
        
        return {
            x: drag.x + lift.x + magnus.x,
            y: drag.y + lift.y + magnus.y,
            z: drag.z + lift.z + magnus.z + gravity.z
        };
    }

    /**
     * Calculate gravitational force
     * @returns {Object} Gravity vector
     */
    calculateGravity() {
        return {
            x: 0,
            y: 0,
            z: -this.constants.g * this.constants.ballMass
        };
    }

    /**
     * Calculate drag force
     * @param {Object} state - Current state
     * @param {Object} environment - Environmental conditions
     * @returns {Object} Drag force vector
     */
    calculateDrag(state, environment) {
        const velocity = state.velocity;
        const speed = Math.sqrt(
            velocity.x * velocity.x +
            velocity.y * velocity.y +
            velocity.z * velocity.z
        );
        
        const cd = this.calculateDragCoefficient(speed, environment);
        const factor = -0.5 * environment.density * 
            Math.PI * this.constants.ballRadius * this.constants.ballRadius * 
            cd * speed;
        
        return {
            x: factor * velocity.x / speed,
            y: factor * velocity.y / speed,
            z: factor * velocity.z / speed
        };
    }

    /**
     * Calculate drag coefficient
     * @param {number} speed - Ball speed
     * @param {Object} environment - Environmental conditions
     * @returns {number} Drag coefficient
     */
    calculateDragCoefficient(speed, environment) {
        const reynolds = this.calculateReynoldsNumber(speed, environment);
        
        // Empirical drag coefficient model
        if (reynolds < 4e4) {
            return 0.5;
        } else if (reynolds < 9e4) {
            return 0.21;
        } else {
            return 0.21 + (reynolds - 9e4) / 3e6;
        }
    }

    /**
     * Calculate lift force
     * @param {Object} state - Current state
     * @param {Object} environment - Environmental conditions
     * @returns {Object} Lift force vector
     */
    calculateLift(state, environment) {
        const velocity = state.velocity;
        const speed = Math.sqrt(
            velocity.x * velocity.x +
            velocity.y * velocity.y +
            velocity.z * velocity.z
        );
        
        const cl = this.calculateLiftCoefficient(speed, state.spin);
        const factor = 0.5 * environment.density * 
            Math.PI * this.constants.ballRadius * this.constants.ballRadius * 
            cl * speed * speed;
        
        // Calculate lift direction (perpendicular to velocity)
        const liftDirection = this.calculateLiftDirection(velocity);
        
        return {
            x: factor * liftDirection.x,
            y: factor * liftDirection.y,
            z: factor * liftDirection.z
        };
    }

    /**
     * Calculate lift coefficient
     * @param {number} speed - Ball speed
     * @param {Object} spin - Ball spin
     * @returns {number} Lift coefficient
     */
    calculateLiftCoefficient(speed, spin) {
        const spinFactor = Math.sqrt(
            spin.backspin * spin.backspin +
            spin.sidespin * spin.sidespin
        ) / speed;
        
        return 0.24 * spinFactor;
    }

    /**
     * Calculate Magnus force
     * @param {Object} state - Current state
     * @param {Object} environment - Environmental conditions
     * @returns {Object} Magnus force vector
     */
    calculateMagnusForce(state, environment) {
        const velocity = state.velocity;
        const spin = state.spin;
        const speed = Math.sqrt(
            velocity.x * velocity.x +
            velocity.y * velocity.y +
            velocity.z * velocity.z
        );
        
        // Magnus coefficient
        const cm = this.calculateMagnusCoefficient(speed, spin);
        const factor = 0.5 * environment.density * 
            Math.PI * this.constants.ballRadius * this.constants.ballRadius * 
            cm * speed;
        
        // Calculate Magnus direction
        const magnusDirection = this.calculateMagnusDirection(velocity, spin);
        
        return {
            x: factor * magnusDirection.x,
            y: factor * magnusDirection.y,
            z: factor * magnusDirection.z
        };
    }

    /**
     * Calculate Magnus coefficient
     * @param {number} speed - Ball speed
     * @param {Object} spin - Ball spin
     * @returns {number} Magnus coefficient
     */
    calculateMagnusCoefficient(speed, spin) {
        const spinRate = Math.sqrt(
            spin.backspin * spin.backspin +
            spin.sidespin * spin.sidespin
        );
        
        return 0.1 * (spinRate * this.constants.ballRadius / speed);
    }

    /**
     * Update state based on forces
     * @param {Object} state - Current state
     * @param {Object} forces - Applied forces
     * @param {number} dt - Time step
     * @returns {Object} New state
     */
    updateState(state, forces, dt) {
        // Calculate accelerations
        const ax = forces.x / this.constants.ballMass;
        const ay = forces.y / this.constants.ballMass;
        const az = forces.z / this.constants.ballMass;
        
        // Update velocities
        const vx = state.velocity.x + ax * dt;
        const vy = state.velocity.y + ay * dt;
        const vz = state.velocity.z + az * dt;
        
        // Update positions
        const x = state.position.x + state.velocity.x * dt + 0.5 * ax * dt * dt;
        const y = state.position.y + state.velocity.y * dt + 0.5 * ay * dt * dt;
        const z = state.position.z + state.velocity.z * dt + 0.5 * az * dt * dt;
        
        return {
            position: { x, y, z },
            velocity: { x: vx, y: vy, z: vz },
            spin: { ...state.spin }
        };
    }

    /**
     * Calculate flight metrics
     * @param {Array} trajectory - Trajectory points
     * @returns {Object} Flight metrics
     */
    calculateFlightMetrics(trajectory) {
        const final = trajectory[trajectory.length - 1];
        const apex = trajectory.reduce((max, point) => 
            point.position.z > max ? point.position.z : max, 0);
        
        return {
            carry: Math.sqrt(
                final.position.x * final.position.x +
                final.position.y * final.position.y
            ),
            maxHeight: apex,
            flightTime: final.time,
            finalVelocity: Math.sqrt(
                final.velocity.x * final.velocity.x +
                final.velocity.y * final.velocity.y +
                final.velocity.z * final.velocity.z
            )
        };
    }

    /**
     * Calculate lift direction
     * @param {Object} velocity - Velocity vector
     * @returns {Object} Lift direction vector
     */
    calculateLiftDirection(velocity) {
        const speed = Math.sqrt(
            velocity.x * velocity.x +
            velocity.y * velocity.y +
            velocity.z * velocity.z
        );
        
        // Calculate unit vector perpendicular to velocity
        return {
            x: -velocity.z / speed,
            y: 0,
            z: velocity.x / speed
        };
    }

    /**
     * Calculate Magnus direction
     * @param {Object} velocity - Velocity vector
     * @param {Object} spin - Spin vector
     * @returns {Object} Magnus direction vector
     */
    calculateMagnusDirection(velocity, spin) {
        // Cross product of velocity and spin
        return {
            x: velocity.y * spin.backspin - velocity.z * spin.sidespin,
            y: velocity.z * spin.backspin - velocity.x * spin.sidespin,
            z: velocity.x * spin.sidespin - velocity.y * spin.backspin
        };
    }

    /**
     * Calculate Reynolds number
     * @param {number} speed - Ball speed
     * @param {Object} environment - Environmental conditions
     * @returns {number} Reynolds number
     */
    calculateReynoldsNumber(speed, environment) {
        return speed * 2 * this.constants.ballRadius * 
               environment.density / this.constants.nu;
    }
}

export const physicsEngine = new PhysicsEngine();
