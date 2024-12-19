/**
 * Physics Worker for parallel trajectory calculations
 */

import { parentPort } from 'node:worker_threads';
import { calculateTrajectorySegment } from '../physics/ball-physics.js';

parentPort.on('message', async (data) => {
    const { startState, params, startTime, endTime } = data;
    
    try {
        const result = await calculateTrajectorySegment(startState, params, startTime, endTime);
        parentPort.postMessage(result);
    } catch (error) {
        parentPort.postMessage({ error: error.message });
    }
});
