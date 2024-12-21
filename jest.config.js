/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.test.json',
            isolatedModules: true,
            diagnostics: {
                ignoreCodes: [1343]  // Ignore 'import assignment cannot be used when targeting ECMAScript modules'
            },
            transformMode: {
                web: [/\.[jt]sx?$/]
            }
        }],
        '^.+\\.jsx?$': ['babel-jest', {
            presets: [
                ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
                '@babel/preset-typescript'
            ],
            plugins: [
                '@babel/plugin-transform-modules-commonjs'
            ]
        }]
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transformIgnorePatterns: [
        'node_modules/(?!(lodash-es)/)'
    ],
    globals: {
        'ts-jest': {
            isolatedModules: true,
            tsconfig: 'tsconfig.test.json'
        }
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/coverage/'
    ],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/types/**/*'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    verbose: true,
    testTimeout: 30000,
    moduleDirectories: ['node_modules', 'src'],
    resolver: undefined,
    testEnvironmentOptions: {
        url: 'http://localhost'
    }
};
