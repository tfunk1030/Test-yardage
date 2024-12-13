// PGA Tour average data for each club (2023 statistics)
export const PGA_CLUB_DATA = {
    driver: {
        name: "Driver",
        ballSpeed: 171.5,    // mph
        spinRate: 2686,      // rpm
        launchAngle: 10.9,   // degrees
        apexHeight: 98,      // feet
        landingAngle: 37.8,  // degrees
        carryDistance: 275.4 // yards
    },
    threewood: {
        name: "3 Wood",
        ballSpeed: 158.7,
        spinRate: 3386,
        launchAngle: 11.2,
        apexHeight: 89,
        landingAngle: 42.1,
        carryDistance: 243.8
    },
    fivewood: {
        name: "5 Wood",
        ballSpeed: 154.3,
        spinRate: 3725,
        launchAngle: 12.3,
        apexHeight: 87,
        landingAngle: 44.2,
        carryDistance: 230.5
    },
    hybrid: {
        name: "Hybrid",
        ballSpeed: 147.8,
        spinRate: 3850,
        launchAngle: 13.5,
        apexHeight: 85,
        landingAngle: 45.6,
        carryDistance: 220.3
    },
    four_iron: {
        name: "4 Iron",
        ballSpeed: 145.2,
        spinRate: 4200,
        launchAngle: 13.9,
        apexHeight: 82,
        landingAngle: 46.2,
        carryDistance: 210.7
    },
    five_iron: {
        name: "5 Iron",
        ballSpeed: 139.8,
        spinRate: 4650,
        launchAngle: 14.8,
        apexHeight: 78,
        landingAngle: 47.5,
        carryDistance: 195.3
    },
    six_iron: {
        name: "6 Iron",
        ballSpeed: 134.5,
        spinRate: 5100,
        launchAngle: 15.7,
        apexHeight: 73,
        landingAngle: 48.9,
        carryDistance: 183.4
    },
    seven_iron: {
        name: "7 Iron",
        ballSpeed: 129.2,
        spinRate: 5600,
        launchAngle: 16.8,
        apexHeight: 69,
        landingAngle: 50.2,
        carryDistance: 172.1
    },
    eight_iron: {
        name: "8 Iron",
        ballSpeed: 124.1,
        spinRate: 6200,
        launchAngle: 18.2,
        apexHeight: 65,
        landingAngle: 51.8,
        carryDistance: 160.8
    },
    nine_iron: {
        name: "9 Iron",
        ballSpeed: 119.3,
        spinRate: 6800,
        launchAngle: 19.8,
        apexHeight: 62,
        landingAngle: 53.4,
        carryDistance: 148.6
    },
    pitching_wedge: {
        name: "Pitching Wedge",
        ballSpeed: 114.2,
        spinRate: 7400,
        launchAngle: 21.5,
        apexHeight: 58,
        landingAngle: 55.1,
        carryDistance: 136.4
    },
    gap_wedge: {
        name: "Gap Wedge",
        ballSpeed: 108.6,
        spinRate: 7900,
        launchAngle: 23.4,
        apexHeight: 54,
        landingAngle: 56.8,
        carryDistance: 125.2
    },
    sand_wedge: {
        name: "Sand Wedge",
        ballSpeed: 103.1,
        spinRate: 8400,
        launchAngle: 25.6,
        apexHeight: 50,
        landingAngle: 58.5,
        carryDistance: 113.8
    },
    lob_wedge: {
        name: "Lob Wedge",
        ballSpeed: 97.4,
        spinRate: 8900,
        launchAngle: 28.1,
        apexHeight: 46,
        landingAngle: 60.2,
        carryDistance: 101.5
    }
};

// Typical ranges for each parameter
export const PARAMETER_RANGES = {
    ballSpeed: {
        min: 90,    // mph
        max: 185,   // mph
        tolerance: 5 // Acceptable deviation in mph
    },
    spinRate: {
        min: 2000,  // rpm
        max: 9500,  // rpm
        tolerance: 500
    },
    launchAngle: {
        min: 8,     // degrees
        max: 32,    // degrees
        tolerance: 2
    },
    apexHeight: {
        min: 40,    // feet
        max: 110,   // feet
        tolerance: 10
    },
    landingAngle: {
        min: 35,    // degrees
        max: 65,    // degrees
        tolerance: 3
    }
};

// Environmental impact coefficients
export const ENVIRONMENTAL_COEFFICIENTS = {
    temperature: {
        ballSpeed: 0.0008,    // % change per °F from 70°F
        spinRate: 0.0005,     // % change per °F from 70°F
        apexHeight: 0.001     // % change per °F from 70°F
    },
    altitude: {
        ballSpeed: 0.00002,   // % change per foot
        spinRate: -0.00001,   // % change per foot
        apexHeight: 0.00003   // % change per foot
    },
    humidity: {
        ballSpeed: 0.0003,    // % change per % humidity from 50%
        spinRate: 0.0002      // % change per % humidity from 50%
    },
    wind: {
        ballSpeed: 0.002,     // % change per mph
        apexHeight: -0.005    // % change per mph (headwind)
    }
};
