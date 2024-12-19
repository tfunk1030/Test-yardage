/**
 * Color Scheme Configuration
 * Modern and visually appealing color palette
 */

export const ColorScheme = {
    // Primary colors
    trajectory: 0x00ff88,
    optimal: 0x00ffff,
    wind: 0x88ccff,
    particles: 0x4488ff,
    
    // UI colors
    background: 0x1a1a2e,
    foreground: 0xffffff,
    accent: 0x00ff88,
    warning: 0xff8800,
    error: 0xff4444,
    
    // Gradients
    gradients: {
        trajectory: [0x00ff88, 0x00ffff],
        power: [0xff4444, 0xffff00],
        efficiency: [0xff4444, 0x00ff88]
    },
    
    // Get color for efficiency value (0-1)
    getEfficiencyColor: (efficiency) => {
        const colors = ColorScheme.gradients.efficiency;
        const r = (1 - efficiency) * ((colors[0] >> 16) & 0xff) + efficiency * ((colors[1] >> 16) & 0xff);
        const g = (1 - efficiency) * ((colors[0] >> 8) & 0xff) + efficiency * ((colors[1] >> 8) & 0xff);
        const b = (1 - efficiency) * (colors[0] & 0xff) + efficiency * (colors[1] & 0xff);
        return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
    },
    
    // Get color for power value (0-1)
    getPowerColor: (power) => {
        const colors = ColorScheme.gradients.power;
        const r = (1 - power) * ((colors[0] >> 16) & 0xff) + power * ((colors[1] >> 16) & 0xff);
        const g = (1 - power) * ((colors[0] >> 8) & 0xff) + power * ((colors[1] >> 8) & 0xff);
        const b = (1 - power) * (colors[0] & 0xff) + power * (colors[1] & 0xff);
        return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
    }
};
