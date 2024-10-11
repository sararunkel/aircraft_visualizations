// Initialize the map
const map = L.map('map').setView([0, 0], 2);

// Add a tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
// Load the JSON data
fetch('tracktf06.json')
    .then(response => response.json())
    .then(data => {
    const timeArray = data.coords.Time.data;
    const latitudeArray= data.data_vars.GGLAT.data;
    const longitudeArray= data.data_vars.GGLON.data;
    const parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S");
    const parsedData = timeArray.map((time, index) => ({
        Time: parseTime(time),
        latitude: +latitudeArray[index],
        longitude: +longitudeArray[index]
        }));
    // Initialize the plane marker
const planeIcon = L.icon({
    iconUrl: 'plane.png', // Replace with the path to your plane icon
    iconSize: [32, 32], // Size of the icon
    iconAnchor: [16, 16],// Point of the icon which will correspond to marker's location
    className: 'plane-icon' // Class name for styling the icon
    });

    const planeMarker = L.marker([parsedData[0].latitude, parsedData[0].longitude], { icon: planeIcon }).addTo(map);

    // Fit the map to the bounds of the data
    const bounds = L.latLngBounds(parsedData.map(d => [d.latitude, d.longitude]));
    map.fitBounds(bounds);
    // Set the max bounds to restrict panning
    map.setMaxBounds(bounds);
    console.log(bounds);
    // Initialize the polyline for the plane's path
    const planePath = L.polyline([], { color: 'blue' }).addTo(map);
    // Function to calculate bearing between two points
    function calculateBearing(lat1, lon1, lat2, lon2) {
        const toRadians = degrees => degrees * Math.PI / 180;
        const toDegrees = radians => radians * 180 / Math.PI;

        const dLon = toRadians(lon2 - lon1);
        const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
        const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
                  Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
        const bearing = toDegrees(Math.atan2(y, x));
        return (bearing + 360) % 360; // Normalize to 0-360
    }
    // Animate the plane's movement
    let currentIndex = 0;
    function animatePlane() {
    if (currentIndex < parsedData.length - 1) {
        currentIndex++;
        const nextPoint = parsedData[currentIndex];
        const prevPoint = parsedData[currentIndex - 1];
        const bearing = calculateBearing(prevPoint.latitude, prevPoint.longitude, nextPoint.latitude, nextPoint.longitude);
        // Rotate the plane icon
        const planeIconElement = document.querySelector('.plane-icon');
        planeIconElement.style.transform = `rotate(${bearing}deg)`;
        planeMarker.setLatLng([nextPoint.latitude, nextPoint.longitude]);
        planePath.addLatLng([nextPoint.latitude, nextPoint.longitude]);
        setTimeout(animatePlane, 100); // Move to the next point every second
    }
    }
    const video = document.getElementById('myVideo');
    video.addEventListener('timeupdate', function() {
        const currentTime = video.currentTime;
        const duration = video.duration;
        const progress = currentTime / duration;

        // Calculate the number of data points to display based on the progress
        const totalDataPoints = parsedData.length;
        const dataPointsToShow = Math.floor(progress * totalDataPoints);

        // Filter the data to show only the portion corresponding to the video's progress
        const currentData = parsedData.slice(0, dataPointsToShow);

        // Update the plane's position and path
        if (currentData.length > 1) {
            const nextPoint = currentData[currentData.length - 1];
            const prevPoint = currentData[currentData.length - 2];
            const bearing = calculateBearing(prevPoint.latitude, prevPoint.longitude, nextPoint.latitude, nextPoint.longitude);

            // Rotate the plane icon
            const planeIconElement = document.querySelector('.plane-icon');
            planeIconElement.style.transform = `rotate(${bearing}deg)`;

            planeMarker.setLatLng([nextPoint.latitude, nextPoint.longitude]);
            planePath.setLatLngs(currentData.map(d => [d.latitude, d.longitude])); // Update the polyline with the current data
        }
    });
    // Start the animation
    //animatePlane();
})