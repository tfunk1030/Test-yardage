// Worker for handling physics calculations
import { calculateWindEffect } from './wind-calculations.js';

self.addEventListener('message', (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'CALCULATE_WIND_EFFECT':
            try {
                const result = calculateWindEffect(data);
                self.postMessage({ type: 'WIND_EFFECT_RESULT', data: result });
            } catch (error) {
                self.postMessage({ type: 'ERROR', error: error.message });
            }
            break;
            
        default:
            self.postMessage({ type: 'ERROR', error: 'Unknown calculation type' });
    }
});
