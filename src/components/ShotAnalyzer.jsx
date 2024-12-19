/**
 * Shot Analyzer Component
 * Main interface for shot analysis and visualization
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { TrajectoryVisualization } from './visualization/TrajectoryVisualization';
import { WeatherDisplay } from './weather/WeatherDisplay';
import { ClubSelector } from './clubs/ClubSelector';
import { ShotMetrics } from './metrics/ShotMetrics';
import { StatisticsPanel } from './statistics/StatisticsPanel';
import { weatherService } from '../services/weather-service';
import { weatherEffects } from '../physics/weather-effects';
import styles from './ShotAnalyzer.module.css';

export const ShotAnalyzer = () => {
    const [shotData, setShotData] = useState(null);
    const [selectedClub, setSelectedClub] = useState(null);
    const [weather, setWeather] = useState(null);
    const [visualizationMode, setVisualizationMode] = useState('3d');
    const canvasRef = useRef();

    useEffect(() => {
        initializeWeather();
    }, []);

    useEffect(() => {
        if (selectedClub && weather) {
            calculateShot();
        }
    }, [selectedClub, weather]);

    const initializeWeather = async () => {
        try {
            const weatherData = await weatherService.getCurrentWeather({
                latitude: 40.7128,
                longitude: -74.0060
            });
            setWeather(weatherData);
        } catch (error) {
            console.error('Failed to fetch weather:', error);
        }
    };

    const calculateShot = () => {
        const conditions = {
            temperature: weather.temperature,
            humidity: weather.humidity,
            pressure: weather.pressure,
            windSpeed: weather.windSpeed,
            windDirection: weather.windDirection,
            altitude: 0
        };

        const effects = weatherEffects.calculateEffects(conditions, {
            velocity: selectedClub.initialVelocity,
            spin: selectedClub.spin,
            diameter: 0.0427 // Golf ball diameter in meters
        });

        const trajectory = calculateTrajectory(selectedClub, effects);
        setShotData({ trajectory, effects });
    };

    return (
        <div className={styles.container}>
            <motion.div 
                className={styles.mainPanel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className={styles.topBar}>
                    <WeatherDisplay 
                        weather={weather} 
                        className={styles.weather}
                    />
                    <ClubSelector
                        onClubSelect={setSelectedClub}
                        selectedClub={selectedClub}
                        className={styles.clubSelector}
                    />
                </div>

                <div className={styles.visualizationContainer}>
                    <Canvas
                        ref={canvasRef}
                        camera={{ position: [0, 5, 10], fov: 75 }}
                        className={styles.canvas}
                    >
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} />
                        <OrbitControls />
                        <Environment preset="sunset" />
                        
                        {shotData && (
                            <TrajectoryVisualization
                                data={shotData.trajectory}
                                effects={shotData.effects}
                                mode={visualizationMode}
                            />
                        )}
                    </Canvas>

                    <div className={styles.controls}>
                        <button
                            onClick={() => setVisualizationMode('3d')}
                            className={visualizationMode === '3d' ? styles.active : ''}
                        >
                            3D View
                        </button>
                        <button
                            onClick={() => setVisualizationMode('top')}
                            className={visualizationMode === 'top' ? styles.active : ''}
                        >
                            Top View
                        </button>
                        <button
                            onClick={() => setVisualizationMode('side')}
                            className={visualizationMode === 'side' ? styles.active : ''}
                        >
                            Side View
                        </button>
                    </div>
                </div>

                <div className={styles.bottomPanel}>
                    <AnimatePresence>
                        {shotData && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className={styles.metricsContainer}
                            >
                                <ShotMetrics
                                    data={shotData}
                                    club={selectedClub}
                                    weather={weather}
                                />
                                <StatisticsPanel
                                    data={shotData}
                                    club={selectedClub}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

const calculateTrajectory = (club, effects) => {
    // Initial conditions
    const initialVelocity = club.initialVelocity;
    const launchAngle = club.launchAngle;
    const spin = club.spin;

    // Time step
    const dt = 0.01; // 10ms
    const maxTime = 10; // 10 seconds
    const steps = Math.floor(maxTime / dt);

    // Arrays to store trajectory points
    const trajectory = {
        points: [],
        velocities: [],
        spins: [],
        forces: []
    };

    // Initial position
    let x = 0, y = 0, z = 0;
    let vx = initialVelocity * Math.cos(launchAngle);
    let vy = initialVelocity * Math.sin(launchAngle);
    let vz = 0;

    // Calculate trajectory
    for (let i = 0; i < steps; i++) {
        // Store current point
        trajectory.points.push({ x, y, z });
        trajectory.velocities.push({ x: vx, y: vy, z: vz });
        trajectory.spins.push(spin);

        // Calculate forces
        const forces = calculateForces(
            { x, y, z },
            { x: vx, y: vy, z: vz },
            spin,
            effects
        );
        trajectory.forces.push(forces);

        // Update velocities
        vx += forces.x * dt;
        vy += forces.y * dt;
        vz += forces.z * dt;

        // Update positions
        x += vx * dt;
        y += vy * dt;
        z += vz * dt;

        // Check if ball has hit the ground
        if (y < 0) break;
    }

    return trajectory;
};

const calculateForces = (position, velocity, spin, effects) => {
    // Combine all forces acting on the ball
    const gravity = { x: 0, y: -9.81, z: 0 };
    const drag = calculateDragForce(velocity, effects);
    const lift = calculateLiftForce(velocity, spin, effects);
    const magnus = calculateMagnusForce(velocity, spin, effects);

    return {
        x: drag.x + lift.x + magnus.x,
        y: gravity.y + drag.y + lift.y + magnus.y,
        z: drag.z + lift.z + magnus.z
    };
};

const calculateDragForce = (velocity, effects) => {
    // Implementation of drag force calculation
    const speed = Math.sqrt(
        velocity.x * velocity.x +
        velocity.y * velocity.y +
        velocity.z * velocity.z
    );
    const dragCoefficient = effects.moisture.dragModifier;
    const density = effects.atmosphere.density;
    const area = Math.PI * 0.0427 * 0.0427 / 4; // Ball cross-sectional area

    const magnitude = -0.5 * dragCoefficient * density * area * speed * speed;

    return {
        x: magnitude * velocity.x / speed,
        y: magnitude * velocity.y / speed,
        z: magnitude * velocity.z / speed
    };
};

const calculateLiftForce = (velocity, spin, effects) => {
    // Implementation of lift force calculation
    const speed = Math.sqrt(
        velocity.x * velocity.x +
        velocity.y * velocity.y +
        velocity.z * velocity.z
    );
    const liftCoefficient = effects.moisture.liftCoefficient;
    const density = effects.atmosphere.density;
    const area = Math.PI * 0.0427 * 0.0427 / 4;

    const magnitude = 0.5 * liftCoefficient * density * area * speed * speed;

    return {
        x: 0,
        y: magnitude,
        z: 0
    };
};

const calculateMagnusForce = (velocity, spin, effects) => {
    // Implementation of Magnus force calculation
    const speed = Math.sqrt(
        velocity.x * velocity.x +
        velocity.y * velocity.y +
        velocity.z * velocity.z
    );
    const magnusCoefficient = effects.moisture.magnusEffect;
    const density = effects.atmosphere.density;
    const radius = 0.0427 / 2;

    const magnitude = (1/2) * magnusCoefficient * density * 
                     Math.PI * radius * radius * speed * spin;

    return {
        x: -magnitude * velocity.z / speed,
        y: 0,
        z: magnitude * velocity.x / speed
    };
};
