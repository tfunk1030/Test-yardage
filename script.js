
document.addEventListener('DOMContentLoaded', () => {
    loadClubData();
    fetchWeatherData();
});

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
    const apiUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&units=imperial&apikey=${apiKey}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
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

    fetch(elevationAPIUrl)
        .then(response => response.json())
        .then(data => {
            const altitudeFeet = (data.elevation * 3.28084).toFixed(2);
            document.getElementById('altitude').value = altitudeFeet;
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

    let adjustedDistance = shotDistance;
    let adjustedAim = "Straight";

    switch (windDirection) {
        case 'N':
            adjustedDistance += shotDistance * 0.01 * windStrength;
            break;
        case 'S':
            adjustedDistance -= shotDistance * 0.005 * windStrength;
            break;
        case 'E':
            adjustedAim = `${(shotDistance * 0.0035 * windStrength).toFixed(2)} yards right`;
            break;
        case 'W':
            adjustedAim = `${(shotDistance * 0.0035 * windStrength).toFixed(2)} yards left`;
            break;
        case 'NE':
            adjustedDistance += shotDistance * 0.007071 * windStrength;
            adjustedAim = `${(shotDistance * 0.0024715 * windStrength).toFixed(2)} yards right`;
            break;
        case 'NW':
            adjustedDistance += shotDistance * 0.007071 * windStrength;
            adjustedAim = `${(shotDistance * 0.0024715 * windStrength).toFixed(2)} yards left`;
            break;
        case 'SE':
            adjustedDistance -= shotDistance * 0.0035 * windStrength;
            adjustedAim = `${(shotDistance * 0.00123575 * windStrength).toFixed(2)} yards right`;
            break;
        case 'SW':
            adjustedDistance -= shotDistance * 0.0035 * windStrength;
            adjustedAim = `${(shotDistance * 0.00123575 * windStrength).toFixed(2)} yards left`;
            break;
    }

    document.getElementById('adjusted-distance').value = adjustedDistance.toFixed(2);
    document.getElementById('adjusted-aim').value = adjustedAim;
}

function toggleScreens() {
    const mainScreen = document.querySelector('.container');
    const windScreen = document.querySelector('.wind-adjustment-screen');

    mainScreen.style.display = (mainScreen.style.display !== 'none') ? 'none' : 'block';
    windScreen.style.display = (windScreen.style.display !== 'none') ? 'none' : 'block';
}
