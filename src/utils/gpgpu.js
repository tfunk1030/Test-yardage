/**
 * GPGPU Module for Physics Acceleration
 * Uses WebGL for parallel computation when available, falls back to CPU
 */

class GPGPU {
    constructor() {
        this.gl = null;
        this.programs = new Map();
        this.buffers = new Map();
        this.initialized = false;
        this.enabled = true;
        this.isNode = typeof window === 'undefined';
    }

    /**
     * Initialize WebGL context if available
     */
    initialize() {
        if (this.initialized) return;

        if (this.isNode) {
            console.log('Running in Node.js environment, using CPU fallback');
            this.enabled = false;
            this.initialized = true;
            return;
        }

        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2');
            
            if (!gl) {
                console.warn('WebGL 2 not supported, using CPU fallback');
                this.enabled = false;
                this.initialized = true;
                return;
            }

            this.gl = gl;
            this.initialized = true;
            
            // Initialize common programs
            this.initializePrograms();
        } catch (error) {
            console.warn('GPGPU initialization failed, using CPU fallback:', error);
            this.enabled = false;
            this.initialized = true;
        }
    }

    /**
     * Enable GPGPU acceleration
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable GPGPU acceleration
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Check if GPGPU is enabled
     */
    isEnabled() {
        return this.enabled && this.initialized && this.gl !== null;
    }

    /**
     * Initialize shader programs
     */
    initializePrograms() {
        // Trajectory calculation program
        this.createProgram('trajectory', `
            #version 300 es
            precision highp float;
            
            layout(location = 0) in vec4 position;
            layout(location = 1) in vec4 velocity;
            
            uniform float dt;
            uniform vec3 wind;
            uniform float gravity;
            uniform float airDensity;
            
            out vec4 vPosition;
            out vec4 vVelocity;
            
            void main() {
                vec3 pos = position.xyz;
                vec3 vel = velocity.xyz;
                
                // Apply forces
                vec3 dragForce = -0.5 * airDensity * length(vel) * vel;
                vec3 gravityForce = vec3(0.0, -gravity, 0.0);
                vec3 windForce = wind - vel;
                
                // Update velocity
                vel += (dragForce + gravityForce + windForce) * dt;
                
                // Update position
                pos += vel * dt;
                
                vPosition = vec4(pos, 1.0);
                vVelocity = vec4(vel, 0.0);
                
                gl_Position = vPosition;
            }
        `, `
            #version 300 es
            precision highp float;
            
            in vec4 vPosition;
            in vec4 vVelocity;
            
            layout(location = 0) out vec4 outPosition;
            layout(location = 1) out vec4 outVelocity;
            
            void main() {
                outPosition = vPosition;
                outVelocity = vVelocity;
            }
        `);
    }

    /**
     * Create shader program
     * @param {string} name - Program name
     * @param {string} vertexShader - Vertex shader source
     * @param {string} fragmentShader - Fragment shader source
     */
    createProgram(name, vertexShader, fragmentShader) {
        const gl = this.gl;
        
        // Create shaders
        const vs = gl.createShader(gl.VERTEX_SHADER);
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        
        gl.shaderSource(vs, vertexShader);
        gl.shaderSource(fs, fragmentShader);
        
        gl.compileShader(vs);
        gl.compileShader(fs);
        
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            throw new Error('Vertex shader compilation failed: ' + gl.getShaderInfoLog(vs));
        }
        
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            throw new Error('Fragment shader compilation failed: ' + gl.getShaderInfoLog(fs));
        }
        
        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Program linking failed: ' + gl.getProgramInfoLog(program));
        }
        
        this.programs.set(name, program);
    }

    /**
     * Calculate trajectories in parallel
     * @param {Float32Array} positions - Initial positions
     * @param {Float32Array} velocities - Initial velocities
     * @param {Object} params - Physics parameters
     * @returns {Object} Calculated trajectories
     */
    calculateTrajectories(positions, velocities, params) {
        if (!this.isEnabled()) {
            return this.calculateTrajectoriesCPU(positions, velocities, params);
        }

        const gl = this.gl;
        const program = this.programs.get('trajectory');
        
        // Create buffers
        const positionBuffer = gl.createBuffer();
        const velocityBuffer = gl.createBuffer();
        
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, velocities, gl.DYNAMIC_DRAW);
        
        // Set uniforms
        gl.useProgram(program);
        
        const dtLocation = gl.getUniformLocation(program, 'dt');
        const windLocation = gl.getUniformLocation(program, 'wind');
        const gravityLocation = gl.getUniformLocation(program, 'gravity');
        const airDensityLocation = gl.getUniformLocation(program, 'airDensity');
        
        gl.uniform1f(dtLocation, params.dt);
        gl.uniform3fv(windLocation, params.wind);
        gl.uniform1f(gravityLocation, params.gravity);
        gl.uniform1f(airDensityLocation, params.airDensity);
        
        // Create transform feedback
        const tf = gl.createTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
        
        // Run computation
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, positions.length / 4);
        gl.endTransformFeedback();
        
        // Read results
        const newPositions = new Float32Array(positions.length);
        const newVelocities = new Float32Array(velocities.length);
        
        gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, newPositions);
        gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 1, newVelocities);
        
        // Cleanup
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(velocityBuffer);
        gl.deleteTransformFeedback(tf);
        
        return {
            positions: newPositions,
            velocities: newVelocities
        };
    }

    /**
     * CPU fallback for trajectory calculation
     * @param {Float32Array} positions - Initial positions
     * @param {Float32Array} velocities - Initial velocities
     * @param {Object} params - Physics parameters
     * @returns {Object} Calculated trajectories
     */
    calculateTrajectoriesCPU(positions, velocities, params) {
        const newPositions = new Float32Array(positions);
        const newVelocities = new Float32Array(velocities);
        
        for (let i = 0; i < positions.length; i += 4) {
            const pos = newPositions.subarray(i, i + 3);
            const vel = newVelocities.subarray(i, i + 3);
            
            // Calculate forces
            const speed = Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1] + vel[2] * vel[2]);
            const dragForce = [-0.5 * params.airDensity * speed * vel[0],
                             -0.5 * params.airDensity * speed * vel[1],
                             -0.5 * params.airDensity * speed * vel[2]];
            
            // Update velocity
            vel[0] += (dragForce[0] + params.wind[0]) * params.dt;
            vel[1] += (dragForce[1] - params.gravity + params.wind[1]) * params.dt;
            vel[2] += (dragForce[2] + params.wind[2]) * params.dt;
            
            // Update position
            pos[0] += vel[0] * params.dt;
            pos[1] += vel[1] * params.dt;
            pos[2] += vel[2] * params.dt;
        }
        
        return {
            positions: newPositions,
            velocities: newVelocities
        };
    }
}

// Create singleton instance
const gpgpu = new GPGPU();

export default gpgpu;
