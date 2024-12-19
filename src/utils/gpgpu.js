/**
 * GPU-accelerated Physics Computations
 * Using WebGL for parallel processing
 */

import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';

export class GPGPU {
    constructor(renderer) {
        this.WIDTH = 128;  // Computation texture width
        this.HEIGHT = 128; // Computation texture height
        
        this.gpuCompute = new GPUComputationRenderer(this.WIDTH, this.HEIGHT, renderer);
        
        this.initComputeTextures();
        this.initComputeShaders();
    }

    initComputeTextures() {
        // Position texture
        this.positionVariable = this.gpuCompute.addVariable(
            'texturePosition',
            this.getPositionShader(),
            this.createPositionTexture()
        );

        // Velocity texture
        this.velocityVariable = this.gpuCompute.addVariable(
            'textureVelocity',
            this.getVelocityShader(),
            this.createVelocityTexture()
        );

        // Force texture
        this.forceVariable = this.gpuCompute.addVariable(
            'textureForce',
            this.getForceShader(),
            this.createForceTexture()
        );

        // Set variable dependencies
        this.gpuCompute.setVariableDependencies(this.positionVariable, [
            this.positionVariable,
            this.velocityVariable,
            this.forceVariable
        ]);

        this.gpuCompute.setVariableDependencies(this.velocityVariable, [
            this.positionVariable,
            this.velocityVariable,
            this.forceVariable
        ]);

        this.gpuCompute.setVariableDependencies(this.forceVariable, [
            this.positionVariable,
            this.velocityVariable,
            this.forceVariable
        ]);

        // Add custom uniforms
        this.positionVariable.material.uniforms.deltaTime = { value: 0.0 };
        this.velocityVariable.material.uniforms.deltaTime = { value: 0.0 };
        this.forceVariable.material.uniforms.deltaTime = { value: 0.0 };
        
        // Initialize
        const error = this.gpuCompute.init();
        if (error !== null) {
            console.error('GPGPU initialization error:', error);
        }
    }

    createPositionTexture() {
        const texture = new THREE.DataTexture(
            new Float32Array(this.WIDTH * this.HEIGHT * 4),
            this.WIDTH,
            this.HEIGHT,
            THREE.RGBAFormat,
            THREE.FloatType
        );

        return texture;
    }

    createVelocityTexture() {
        const texture = new THREE.DataTexture(
            new Float32Array(this.WIDTH * this.HEIGHT * 4),
            this.WIDTH,
            this.HEIGHT,
            THREE.RGBAFormat,
            THREE.FloatType
        );

        return texture;
    }

    createForceTexture() {
        const texture = new THREE.DataTexture(
            new Float32Array(this.WIDTH * this.HEIGHT * 4),
            this.WIDTH,
            this.HEIGHT,
            THREE.RGBAFormat,
            THREE.FloatType
        );

        return texture;
    }

    getPositionShader() {
        return `
            uniform float deltaTime;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 pos = texture2D(texturePosition, uv);
                vec4 vel = texture2D(textureVelocity, uv);
                
                // Update position based on velocity
                pos.xyz += vel.xyz * deltaTime;
                
                // Keep particles within bounds
                if (pos.y < 0.0) {
                    pos.y = 20.0;
                }
                
                gl_FragColor = pos;
            }
        `;
    }

    getVelocityShader() {
        return `
            uniform float deltaTime;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 vel = texture2D(textureVelocity, uv);
                vec4 force = texture2D(textureForce, uv);
                
                // Update velocity based on forces
                vel.xyz += force.xyz * deltaTime;
                
                // Apply drag
                vel.xyz *= 0.99;
                
                gl_FragColor = vel;
            }
        `;
    }

    getForceShader() {
        return `
            uniform float deltaTime;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 pos = texture2D(texturePosition, uv);
                vec4 vel = texture2D(textureVelocity, uv);
                
                // Calculate forces (gravity, wind, etc.)
                vec3 gravity = vec3(0.0, -9.81, 0.0);
                vec3 wind = vec3(1.0, 0.0, 0.0) * sin(pos.y * 0.1 + deltaTime);
                
                vec3 totalForce = gravity + wind;
                
                gl_FragColor = vec4(totalForce, 1.0);
            }
        `;
    }

    compute(deltaTime) {
        this.positionVariable.material.uniforms.deltaTime.value = deltaTime;
        this.velocityVariable.material.uniforms.deltaTime.value = deltaTime;
        this.forceVariable.material.uniforms.deltaTime.value = deltaTime;
        
        this.gpuCompute.compute();
    }

    getPositions() {
        return this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    }

    getVelocities() {
        return this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
    }

    getForces() {
        return this.gpuCompute.getCurrentRenderTarget(this.forceVariable).texture;
    }

    dispose() {
        this.gpuCompute.dispose();
    }
}
