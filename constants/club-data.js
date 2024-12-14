// PGA Tour average data for each club (2024 TrackMan Statistics)
export const PGA_CLUB_DATA = {
    driver: {
        name: "Driver",
        ballSpeed: 171.5,    // mph
        spinRate: 2545,      // rpm (2024 TrackMan)
        launchAngle: 10.4,   // degrees (2024 TrackMan)
        apexHeight: 102,     // feet
        landingAngle: 37.8,  // degrees
        carryDistance: 282.0 // yards (2024 TrackMan)
    },
    threewood: {
        name: "3 Wood",
        ballSpeed: 158.7,
        spinRate: 3663,      // rpm (2024 TrackMan)
        launchAngle: 9.3,    // degrees (2024 TrackMan)
        apexHeight: 92,
        landingAngle: 42.1,
        carryDistance: 249.0 // yards (2024 TrackMan)
    },
    fivewood: {
        name: "5 Wood",
        ballSpeed: 154.3,
        spinRate: 4322,      // rpm (2024 TrackMan)
        launchAngle: 9.7,    // degrees (2024 TrackMan)
        apexHeight: 90,
        landingAngle: 44.2,
        carryDistance: 236.0 // yards (2024 TrackMan)
    },
    hybrid: {
        name: "Hybrid",
        ballSpeed: 147.8,
        spinRate: 4587,      // rpm (2024 TrackMan)
        launchAngle: 10.2,   // degrees (2024 TrackMan)
        apexHeight: 88,
        landingAngle: 45.6,
        carryDistance: 231.0 // yards (2024 TrackMan)
    },
    three_iron: {
        name: "3 Iron",
        ballSpeed: 147.8,
        spinRate: 4404,      // rpm (2024 TrackMan)
        launchAngle: 10.3,   // degrees (2024 TrackMan)
        apexHeight: 88,
        landingAngle: 45.6,
        carryDistance: 218.0 // yards (2024 TrackMan)
    },
    four_iron: {
        name: "4 Iron",
        ballSpeed: 145.2,
        spinRate: 4782,      // rpm (2024 TrackMan)
        launchAngle: 10.8,   // degrees (2024 TrackMan)
        apexHeight: 85,
        landingAngle: 46.2,
        carryDistance: 209.0 // yards (2024 TrackMan)
    },
    five_iron: {
        name: "5 Iron",
        ballSpeed: 139.8,
        spinRate: 5280,      // rpm (2024 TrackMan)
        launchAngle: 11.0,   // degrees (2024 TrackMan)
        apexHeight: 82,
        landingAngle: 47.5,
        carryDistance: 199.0 // yards (2024 TrackMan)
    },
    six_iron: {
        name: "6 Iron",
        ballSpeed: 134.5,
        spinRate: 6204,      // rpm (2024 TrackMan)
        launchAngle: 14.0,   // degrees (2024 TrackMan)
        apexHeight: 80,
        landingAngle: 48.9,
        carryDistance: 188.0 // yards (2024 TrackMan)
    },
    seven_iron: {
        name: "7 Iron",
        ballSpeed: 129.2,
        spinRate: 7124,      // rpm (2024 TrackMan)
        launchAngle: 16.1,   // degrees (2024 TrackMan)
        apexHeight: 78,
        landingAngle: 50.2,
        carryDistance: 176.0 // yards (2024 TrackMan)
    },
    eight_iron: {
        name: "8 Iron",
        ballSpeed: 124.1,
        spinRate: 8078,      // rpm (2024 TrackMan)
        launchAngle: 17.8,   // degrees (2024 TrackMan)
        apexHeight: 76,
        landingAngle: 51.8,
        carryDistance: 164.0 // yards (2024 TrackMan)
    },
    nine_iron: {
        name: "9 Iron",
        ballSpeed: 119.3,
        spinRate: 8793,      // rpm (2024 TrackMan)
        launchAngle: 20.0,   // degrees (2024 TrackMan)
        apexHeight: 74,
        landingAngle: 53.4,
        carryDistance: 152.0 // yards (2024 TrackMan)
    },
    pitching_wedge: {
        name: "Pitching Wedge",
        ballSpeed: 114.2,
        spinRate: 9316,      // rpm (2024 TrackMan)
        launchAngle: 23.7,   // degrees (2024 TrackMan)
        apexHeight: 72,
        landingAngle: 55.1,
        carryDistance: 142.0 // yards (2024 TrackMan)
    },
    gap_wedge: {
        name: "Gap Wedge",
        ballSpeed: 108.6,
        spinRate: 10000,     // rpm (2024 TrackMan)
        launchAngle: 25.0,   // degrees (2024 TrackMan)
        apexHeight: 70,
        landingAngle: 56.8,
        carryDistance: 127.0 // yards (2024 TrackMan)
    },
    sand_wedge: {
        name: "Sand Wedge",
        ballSpeed: 103.1,
        spinRate: 10000,     // rpm (2024 TrackMan)
        launchAngle: 26.0,   // degrees (2024 TrackMan)
        apexHeight: 68,
        landingAngle: 58.5,
        carryDistance: 115.0 // yards (2024 TrackMan)
    },
    lob_wedge: {
        name: "Lob Wedge",
        ballSpeed: 97.4,
        spinRate: 11000,     // rpm (2024 TrackMan)
        launchAngle: 29.0,   // degrees (2024 TrackMan)
        apexHeight: 66,
        landingAngle: 60.2,
        carryDistance: 100.0 // yards (2024 TrackMan)
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
        max: 11000, // rpm (increased to accommodate lob wedge)
        tolerance: 500
    },
    launchAngle: {
        min: 8,     // degrees
        max: 35,    // degrees (increased to accommodate lob wedge)
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
