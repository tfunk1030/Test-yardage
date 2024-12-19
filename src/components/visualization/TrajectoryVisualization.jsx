/**
 * Trajectory Visualization Component
 * Advanced 3D visualization of shot trajectory with effects
 */

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail, Line, Text, Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { motion } from 'framer-motion-3d';

export const TrajectoryVisualization = ({ data, effects, mode }) => {
    const trajectoryRef = useRef();
    const ballRef = useRef();
    const trailRef = useRef();

    useEffect(() => {
        if (trajectoryRef.current) {
            updateTrajectoryGeometry();
        }
    }, [data, mode]);

    useFrame((state, delta) => {
        animateTrajectory(state.clock.elapsedTime);
        updateEffectsVisualization(delta);
    });

    const updateTrajectoryGeometry = () => {
        const points = data.points.map(p => new Vector3(p.x, p.y, p.z));
        trajectoryRef.current.geometry.setFromPoints(points);
    };

    const animateTrajectory = (time) => {
        if (!ballRef.current || !data.points.length) return;

        const progress = (time % 2) / 2; // 2-second loop
        const index = Math.floor(progress * (data.points.length - 1));
        const point = data.points[index];
        
        ballRef.current.position.set(point.x, point.y, point.z);
        
        // Spin animation
        const spin = data.spins[index];
        ballRef.current.rotation.z += spin * 0.01;
    };

    const updateEffectsVisualization = (delta) => {
        // Update wind effects
        updateWindVisualization(delta);
        
        // Update atmospheric effects
        updateAtmosphericEffects(delta);
        
        // Update force vectors
        updateForceVectors();
    };

    const updateWindVisualization = (delta) => {
        const windSpeed = effects.wind.gradient.speed;
        const windDirection = effects.wind.gradient.direction;
        
        // Animate wind particles
        windParticles.current.forEach(particle => {
            particle.position.x += Math.cos(windDirection) * windSpeed * delta;
            particle.position.z += Math.sin(windDirection) * windSpeed * delta;
            
            // Reset particles that move too far
            if (particle.position.length() > 50) {
                resetWindParticle(particle);
            }
        });
    };

    const updateAtmosphericEffects = (delta) => {
        const { temperature, pressure, humidity } = effects.atmosphere;
        
        // Update atmospheric distortion shader
        if (atmosphereRef.current) {
            atmosphereRef.current.material.uniforms.temperature.value = temperature;
            atmosphereRef.current.material.uniforms.pressure.value = pressure;
            atmosphereRef.current.material.uniforms.humidity.value = humidity;
        }
    };

    const updateForceVectors = () => {
        if (!ballRef.current || !data.forces.length) return;
        
        const ballPosition = ballRef.current.position;
        const forces = data.forces[
            Math.floor((ballPosition.x / data.points[data.points.length - 1].x) * 
                      (data.forces.length - 1))
        ];
        
        // Update force vector visualizations
        updateForceVector(dragVectorRef, forces.drag, 0xff0000);
        updateForceVector(liftVectorRef, forces.lift, 0x00ff00);
        updateForceVector(magnusVectorRef, forces.magnus, 0x0000ff);
    };

    return (
        <group>
            {/* Ground plane */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.01, 0]}
                receiveShadow
            >
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial
                    color="#2c5530"
                    roughness={0.8}
                    metalness={0.2}
                />
            </mesh>

            {/* Trajectory line */}
            <line ref={trajectoryRef}>
                <bufferGeometry />
                <lineBasicMaterial color="#ffffff" linewidth={2} />
            </line>

            {/* Ball */}
            <motion.mesh
                ref={ballRef}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                castShadow
            >
                <sphereGeometry args={[0.0213, 32, 32]} />
                <meshStandardMaterial
                    color="#ffffff"
                    roughness={0.3}
                    metalness={0.7}
                />
                <Trail
                    ref={trailRef}
                    width={0.05}
                    length={10}
                    color="#ffffff"
                    attenuation={(t) => t * t}
                />
            </motion.mesh>

            {/* Wind visualization */}
            <WindVisualization
                gradient={effects.wind.gradient}
                turbulence={effects.wind.turbulence}
            />

            {/* Force vectors */}
            <ForceVectors forces={data.forces} ballRef={ballRef} />

            {/* Distance markers */}
            <DistanceMarkers points={data.points} />

            {/* Information overlay */}
            <Html>
                <div className="trajectory-info">
                    <h3>Shot Information</h3>
                    <p>Distance: {calculateDistance(data.points)} yards</p>
                    <p>Max Height: {calculateMaxHeight(data.points)} feet</p>
                    <p>Flight Time: {calculateFlightTime(data.points)} seconds</p>
                </div>
            </Html>
        </group>
    );
};

const WindVisualization = ({ gradient, turbulence }) => {
    const particlesRef = useRef([]);

    useEffect(() => {
        // Initialize wind particles
        for (let i = 0; i < 100; i++) {
            particlesRef.current.push({
                position: new Vector3(
                    Math.random() * 100 - 50,
                    Math.random() * 20,
                    Math.random() * 100 - 50
                ),
                velocity: new Vector3()
            });
        }
    }, []);

    useFrame((state, delta) => {
        particlesRef.current.forEach(particle => {
            // Apply wind gradient
            const height = particle.position.y;
            const windSpeed = calculateWindSpeedAtHeight(
                gradient.speed,
                height
            );
            const windDirection = gradient.direction + 
                                calculateDirectionShiftAtHeight(height);

            // Apply turbulence
            const turbulenceEffect = calculateTurbulenceEffect(
                turbulence,
                particle.position
            );

            // Update particle position
            particle.velocity.x = Math.cos(windDirection) * windSpeed + 
                                turbulenceEffect.x;
            particle.velocity.z = Math.sin(windDirection) * windSpeed + 
                                turbulenceEffect.z;
            
            particle.position.add(
                particle.velocity.multiplyScalar(delta)
            );

            // Reset particles that move too far
            if (particle.position.length() > 50) {
                resetParticle(particle);
            }
        });
    });

    return (
        <group>
            {particlesRef.current.map((particle, i) => (
                <mesh
                    key={i}
                    position={particle.position}
                    scale={[0.1, 0.1, 0.1]}
                >
                    <sphereGeometry />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
};

const ForceVectors = ({ forces, ballRef }) => {
    const dragRef = useRef();
    const liftRef = useRef();
    const magnusRef = useRef();

    useFrame(() => {
        if (!ballRef.current) return;

        const ballPosition = ballRef.current.position;
        const currentForces = interpolateForces(forces, ballPosition);

        updateForceVector(dragRef, currentForces.drag, '#ff0000');
        updateForceVector(liftRef, currentForces.lift, '#00ff00');
        updateForceVector(magnusRef, currentForces.magnus, '#0000ff');
    });

    return (
        <group>
            <Line ref={dragRef} />
            <Line ref={liftRef} />
            <Line ref={magnusRef} />
        </group>
    );
};

const DistanceMarkers = ({ points }) => {
    const markers = [];
    const totalDistance = calculateDistance(points);
    const interval = 25; // Yards between markers

    for (let dist = interval; dist < totalDistance; dist += interval) {
        const position = interpolatePosition(points, dist);
        markers.push(
            <group key={dist} position={[position.x, 0, position.z]}>
                <mesh>
                    <cylinderGeometry args={[0.1, 0.1, 0.5]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
                <Text
                    position={[0, 0.5, 0]}
                    fontSize={0.5}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="bottom"
                >
                    {dist}y
                </Text>
            </group>
        );
    }

    return <group>{markers}</group>;
};

// Utility functions
const calculateDistance = (points) => {
    if (!points.length) return 0;
    const last = points[points.length - 1];
    return Math.sqrt(last.x * last.x + last.z * last.z) * 1.0936; // Convert to yards
};

const calculateMaxHeight = (points) => {
    if (!points.length) return 0;
    return Math.max(...points.map(p => p.y)) * 3.28084; // Convert to feet
};

const calculateFlightTime = (points) => {
    return points.length * 0.01; // Based on time step
};

const resetParticle = (particle) => {
    particle.position.set(
        Math.random() * 100 - 50,
        Math.random() * 20,
        Math.random() * 100 - 50
    );
    particle.velocity.set(0, 0, 0);
};

const interpolateForces = (forces, position) => {
    // Implementation of force interpolation based on position
    return forces[0]; // Placeholder
};

const interpolatePosition = (points, distance) => {
    // Implementation of position interpolation based on distance
    return points[0]; // Placeholder
};
