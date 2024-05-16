function fetchWeatherData() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherData(lat, lon);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function getWeatherData(lat, lon) {
    const apiKey = 'jG9onLuVeiR4NWlVIO85EWWLCtQ2Uzqv';
    // Adding a units parameter to specify Fahrenheit
    const apiUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&units=imperial&apikey=${apiKey}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok - Status: ' + response.status + ', Status Text: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // Ensure the temperature is fetched in Fahrenheit (imperial units)
            document.getElementById('temperature').value = data.data.values.temperature;
            document.getElementById('humidity').value = data.data.values.humidity;
            getAltitude(lat, lon);
        })
        .catch(error => {
            alert("Error fetching weather data: " + error.message);
        });
}


function getAltitude(lat, lon) {
    const elevationAPIUrl = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;

    return fetch(elevationAPIUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received data from Open-Meteo:', data);

            if (data && data.elevation) {
                const altitudeMeters = data.elevation;
                const altitudeFeet = altitudeMeters * 3.28084; // Convert meters to feet
                console.log(`Altitude: ${altitudeFeet} feet`);
                document.getElementById('altitude').value = altitudeFeet.toFixed(2); // Update the altitude input with the value in feet, rounded to two decimal places
                return altitudeFeet; // Return the converted value
            } else {
                console.error('Elevation data is not in the expected format:', data);
                return 'Unknown';
            }
        });
}






function calculateAllDistances() {
    const rows = document.querySelectorAll('.club-row');
    const altitude = parseFloat(document.getElementById("altitude").value);
    const humidity = parseFloat(document.getElementById("humidity").value);
    const temperature = parseFloat(document.getElementById("temperature").value);

    rows.forEach(row => {
        const defaultDistance = parseFloat(row.querySelector('.club-distance').value);
        let adjustedDistance = defaultDistance;

        adjustedDistance += (altitude / 250) * 0.005 * defaultDistance;
        adjustedDistance += ((humidity - 50) / 2.5) * 0.0005 * defaultDistance;
        adjustedDistance += (temperature - 70) / 2 * 0.5;

        row.querySelector('.adjusted-distance').textContent = adjustedDistance.toFixed(2);
    });
}

function saveClubData() {
    const clubData = [];
    document.querySelectorAll('.club-row').forEach(row => {
        const clubName = row.querySelector('.club-name').value;
        const clubDistance = row.querySelector('.club-distance').value;
        clubData.push({ clubName, clubDistance });
    });
    localStorage.setItem('clubData', JSON.stringify(clubData));
}

function loadClubData() {
    const savedData = localStorage.getItem('clubData');
    if (savedData) {
        const clubData = JSON.parse(savedData);
        document.querySelectorAll('.club-row').forEach((row, index) => {
            if (clubData[index]) {
                row.querySelector('.club-name').value = clubData[index].clubName;
                row.querySelector('.club-distance').value = clubData[index].clubDistance;
            }
        });
    }
}

function calculateWindAdjustment() {
    const windDirection = document.getElementById('wind-direction').value;
    const windStrength = parseFloat(document.getElementById('wind-strength').value);
    const shotDistance = parseFloat(document.getElementById('shot-distance').value);

    let adjustedDistance = shotDistance;  // Start with the original shot distance
    let adjustedAim = "Straight";  // Default aim direction

    switch (windDirection) {
        case 'N':  // North wind causes gain of distance
            adjustedDistance += shotDistance * 0.01 * windStrength;
            break;
        case 'S':  // South wind causes loss of distance
            adjustedDistance -= shotDistance * 0.005 * windStrength;
            break;
        case 'E':  // East wind will push the ball to the West (left for a right-handed golfer), so aim right
            adjustedAim = `${(shotDistance * 0.0035 * windStrength).toFixed(2)} yards right`;
            break;
        case 'W':  // West wind will push the ball to the East (right for a right-handed golfer), so aim left
            adjustedAim = `${(shotDistance * 0.0035 * windStrength).toFixed(2)} yards left`;
            break;
        case 'NE':  // North-East wind
            adjustedDistance += shotDistance * 0.007071 * windStrength;
            adjustedAim = `${(shotDistance * 0.0024715 * windStrength).toFixed(2)} yards right`;
            break;
        case 'NW':  // North-West wind
            adjustedDistance += shotDistance * 0.007071 * windStrength;
            adjustedAim = `${(shotDistance * 0.0024715 * windStrength).toFixed(2)} yards left`;
            break;
        case 'SE':  // South-East wind
            adjustedDistance -= shotDistance * 0.0035 * windStrength;  // Kept the same adjusted distance as before
            adjustedAim = `${(shotDistance * 0.00123575 * windStrength).toFixed(2)} yards right`;  // Halved the percentage for aim
            break;
        case 'SW':  // South-West wind
            adjustedDistance -= shotDistance * 0.0035 * windStrength;  // Kept the same adjusted distance as before
            adjustedAim = `${(shotDistance * 0.00123575 * windStrength).toFixed(2)} yards left`;  // Halved the percentage for aim
            break;
    }

    // Display the adjusted distance and aim
    document.getElementById('adjusted-distance').value = adjustedDistance.toFixed(2);
    document.getElementById('adjusted-aim').value = adjustedAim;
}


function toggleScreens() {
    const mainScreen = document.querySelector('.container');
    const windScreen = document.querySelector('.wind-adjustment-screen');

    mainScreen.style.display = (mainScreen.style.display !== 'none') ? 'none' : 'block';
    windScreen.style.display = (windScreen.style.display !== 'none') ? 'none' : 'block';
}

window.onload = function() {
    loadClubData();
    fetchWeatherData();
    calculateWindAdjustment();
};

document.querySelectorAll('.club-name, .club-distance').forEach(input => {
    input.addEventListener('input', saveClubData);
});

