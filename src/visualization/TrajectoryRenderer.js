/**
 * Advanced Trajectory Visualization
 * High-performance WebGL-based renderer
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GPGPU } from '../utils/gpgpu.js';
import { ColorScheme } from '../utils/color-scheme.js';

export class TrajectoryRenderer {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            quality: 'high',
            effects: true,
            shadows: true,
            antiAlias: true,
            ...options
        };

        this.initRenderer();
        this.initScene();
        this.initPostProcessing();
        this.initGPGPU();
        this.setupEventListeners();
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.options.antiAlias,
            powerPreference: 'high-performance',
            precision: this.options.quality === 'high' ? 'highp' : 'mediump'
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = this.options.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.appendChild(this.renderer.domElement);
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        
        // Environment
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.002);

        // Lighting
        this.setupLighting();
        
        // Ground
        this.setupGround();

        // Grid
        this.setupGrid();

        // Trajectory objects
        this.trajectoryLine = this.createTrajectoryLine();
        this.ballMarker = this.createBallMarker();
        this.windIndicators = this.createWindIndicators();
        
        this.scene.add(this.trajectoryLine);
        this.scene.add(this.ballMarker);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = this.options.shadows;
        
        if (this.options.shadows) {
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 500;
            sunLight.shadow.bias = -0.0001;
        }

        this.scene.add(ambientLight);
        this.scene.add(sunLight);
    }

    setupGround() {
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c5530,
            roughness: 0.8,
            metalness: 0.2
        });

        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = this.options.shadows;
        this.scene.add(this.ground);
    }

    setupGrid() {
        const gridHelper = new THREE.GridHelper(1000, 100, 0x444444, 0x222222);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
    }

    initPostProcessing() {
        if (!this.options.effects) return;

        this.composer = new EffectComposer(this.renderer);
        
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
            1.5, 0.4, 0.85
        );
        this.composer.addPass(bloomPass);
    }

    initGPGPU() {
        this.gpgpu = new GPGPU(this.renderer);
        this.particleSystem = this.createParticleSystem();
        this.scene.add(this.particleSystem);
    }

    createTrajectoryLine() {
        const material = new THREE.LineBasicMaterial({
            color: ColorScheme.trajectory,
            linewidth: 2,
            vertexColors: true
        });

        const geometry = new THREE.BufferGeometry();
        const line = new THREE.Line(geometry, material);
        line.frustumCulled = false;
        
        return line;
    }

    createBallMarker() {
        const geometry = new THREE.SphereGeometry(0.0213, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.7
        });

        const ball = new THREE.Mesh(geometry, material);
        ball.castShadow = this.options.shadows;
        
        return ball;
    }

    createWindIndicators() {
        const indicators = new THREE.Group();
        
        for (let i = 0; i < 100; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.02),
                new THREE.MeshBasicMaterial({
                    color: ColorScheme.wind,
                    transparent: true,
                    opacity: 0.5
                })
            );
            
            particle.position.set(
                Math.random() * 100 - 50,
                Math.random() * 20,
                Math.random() * 100 - 50
            );
            
            indicators.add(particle);
        }
        
        return indicators;
    }

    createParticleSystem() {
        const particleCount = 10000;
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = Math.random() * 100 - 50;
            positions[i * 3 + 1] = Math.random() * 20;
            positions[i * 3 + 2] = Math.random() * 100 - 50;
            
            const color = new THREE.Color(ColorScheme.particles);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = Math.random() * 2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });
        
        return new THREE.Points(geometry, material);
    }

    updateTrajectory(trajectory, analytics) {
        const positions = new Float32Array(trajectory.length * 3);
        const colors = new Float32Array(trajectory.length * 3);
        
        trajectory.forEach((point, i) => {
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
            
            const progress = i / (trajectory.length - 1);
            const color = this.getTrajectoryColor(progress, analytics);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        });
        
        this.trajectoryLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trajectoryLine.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Update ball position
        const lastPoint = trajectory[trajectory.length - 1];
        this.ballMarker.position.set(lastPoint.x, lastPoint.y, lastPoint.z);
    }

    getTrajectoryColor(progress, analytics) {
        const efficiency = analytics.efficiency.overallEfficiency;
        const baseColor = new THREE.Color(ColorScheme.trajectory);
        const optimalColor = new THREE.Color(ColorScheme.optimal);
        
        return baseColor.lerp(optimalColor, efficiency * progress);
    }

    updateWindVisualization(windSpeed, windDirection) {
        this.windIndicators.children.forEach(particle => {
            particle.position.x += Math.cos(windDirection) * windSpeed * 0.01;
            particle.position.z += Math.sin(windDirection) * windSpeed * 0.01;
            
            if (particle.position.length() > 50) {
                particle.position.set(
                    Math.random() * 100 - 50,
                    Math.random() * 20,
                    Math.random() * 100 - 50
                );
            }
        });
    }

    updateParticleSystem(deltaTime) {
        const positions = this.particleSystem.geometry.attributes.position;
        const velocities = this.gpgpu.getVelocities();
        
        for (let i = 0; i < positions.count; i++) {
            positions.array[i * 3] += velocities[i * 4] * deltaTime;
            positions.array[i * 3 + 1] += velocities[i * 4 + 1] * deltaTime;
            positions.array[i * 3 + 2] += velocities[i * 4 + 2] * deltaTime;
            
            if (positions.array[i * 3 + 1] < 0) {
                positions.array[i * 3 + 1] = 20;
            }
        }
        
        positions.needsUpdate = true;
    }

    render(deltaTime) {
        this.updateParticleSystem(deltaTime);
        
        if (this.options.effects) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            
            if (this.options.effects) {
                this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
            }
        });
    }

    dispose() {
        this.renderer.dispose();
        this.scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        if (this.gpgpu) {
            this.gpgpu.dispose();
        }
    }
}
