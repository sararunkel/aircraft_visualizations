// Initialize the map
const map = L.map('map',{
    maxZoom: 18, // Set the maximum zoom level
    minZoom: 6, // Set the minimum zoom level
}).setView([0, 0], 2);

// Add a tile layer (OpenStreetMap)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
// Load the JSON data
fetch('tracktf06.json')
    .then(response => response.json())
    .then(data => {
    const timeArray = data.coords.Time.data;
    const latitudeArray= data.data_vars.GGLAT.data;
    const longitudeArray= data.data_vars.GGLON.data;
    const parseTime = d3.utcParse("%Y-%m-%dT%H:%M:%S");
    const parsedData = timeArray.map((time, index) => ({
        Time: parseTime(time),
        latitude: +latitudeArray[index],
        longitude: +longitudeArray[index]
        }));
    // Initialize the plane marker
const planeIcon = L.icon({
    iconUrl: 'plane.png', // Replace with the path to your plane icon
    iconSize: [16, 16], // Size of the icon
    iconAnchor: [8, 8],// Point of the icon which will correspond to marker's location
    className: 'plane-icon' // Class name for styling the icon
    });

    const planeMarker = L.marker([parsedData[0].latitude, parsedData[0].longitude], { icon: planeIcon }).addTo(map);

    // Fit the map to the bounds of the data
    const bounds = L.latLngBounds(parsedData.map(d => [d.latitude, d.longitude]));
    const bufferedBounds = bounds.pad(1 / 111);
    map.fitBounds(bufferedBounds);
    // Set the max bounds to restrict panning
    map.setMaxBounds(bufferedBounds);
    console.log(bounds);
    // Initialize the polyline for the plane's path
    const planePath = L.polyline([], { color: 'red' }).addTo(map);
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
        const dataPointIndex = Math.floor((currentTime / duration) * totalDataPoints);

        // Ensure the index is within bounds
        if (dataPointIndex >= 0 && dataPointIndex < totalDataPoints) {
            const nextPoint = parsedData[dataPointIndex];
            const prevPoint = dataPointIndex > 0 ? parsedData[dataPointIndex - 1] : nextPoint;
            const bearing = calculateBearing(prevPoint.latitude, prevPoint.longitude, nextPoint.latitude, nextPoint.longitude);
    
            // Rotate the plane icon
            const planeIconElement = document.querySelector('.plane-icon');
            planeIconElement.style.transform = `rotate(${bearing}deg)`;
    
            planeMarker.setLatLng([nextPoint.latitude, nextPoint.longitude]);
            planePath.setLatLngs(parsedData.slice(0, dataPointIndex + 1).map(d => [d.latitude, d.longitude])); // Update the polyline with the current data
    
            // Print the time value to the screen
            document.getElementById('current-time').textContent = nextPoint.Time.toISOString();
            updateImage(nextPoint.Time, 'F2DS');
            updateImage(nextPoint.Time, 'HVPS');
        }
    });
    let imageFilenames = [];
    //read TF06.txt file and safe the image filenames
    fetch('TF06.txt')
    .then(response => response.text())
    .then(data => {
        imageFilenames = data.split('\n').filter(Boolean);
        console.log(imageFilenames);
    });
    

    function parseFilename(filename) {
        const parts = filename.split('_');
        const date = parts[2];
        const start = parseFileTime(date, parts[3]);
        const end = parseFileTime(date, parts[5]);
        return [start, end];
    }

    function parseFileTime(dateString, timeString) {
        const year = parseInt(dateString.slice(0, 4), 10);
        const month = parseInt(dateString.slice(4, 6), 10) - 1; // Months are zero-based in JavaScript
        const day = parseInt(dateString.slice(6, 8), 10);
        const hours = parseInt(timeString.slice(0, 2), 10);
        const minutes = parseInt(timeString.slice(2, 4), 10);
        const seconds = parseInt(timeString.slice(4, 6), 10);
        return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    }

    function updateImage(currentTime,dtype) {
        const imageContainer = document.getElementById(dtype);
        const filteredImages = imageFilenames.filter(filename => filename.includes(dtype));
        const currentImage = filteredImages.find(filename => {
            const [start, end] = parseFilename(filename);
            console.log(start, end);
            console.log('currentTime:', currentTime);
            return start <= currentTime && currentTime <= end;
        });
        if (currentImage) {
            imageContainer.innerHTML = `<img src="TF06/${currentImage}" alt=dtype>`;
        }
    }
    // Start the animation
    //animatePlane();
})

