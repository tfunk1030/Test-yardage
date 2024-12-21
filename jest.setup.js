// Enable ES Module support
require('@babel/register')({
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        '@babel/preset-typescript'
    ],
    plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread'
    ]
});

// Mock browser globals
global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

global.document = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Setup test environment variables
process.env.NODE_ENV = 'test';

// Add custom matchers
expect.extend({
    toBeWithinRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () =>
                    `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false,
            };
        }
    },
});

// Setup test timeouts
jest.setTimeout(30000);

// Mock Math.random to make tests deterministic
const mockMath = Object.create(global.Math);
mockMath.random = () => 0.5;
global.Math = mockMath;

// Suppress console warnings during tests
console.warn = jest.fn();

// Add test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add test environment flags
global.__TEST__ = true;
