// Function to populate the dropdown menu

function selectFlight(options) {
    const selectElement = document.getElementById('flight-select');
    selectElement.innerHTML = ''; // Clear existing options

    options.forEach(flight => {
        const optionElement = document.createElement('option');
        optionElement.value = flight;
        optionElement.textContent = flight;
        selectElement.appendChild(optionElement);
    });
}
function populateDropdown(options) {
    const selectElement = document.getElementById('variable-select');
    selectElement.innerHTML = ''; // Clear existing options

    for (const option in options) {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    };
}

// Example options array
const variableDataSources = {
    'Temperature (C)': 'ATX',
    'Wind Speed (m/s)': 'WIC',
    // Add more key-value pairs as needed
};
const flightList = [
    'TF06','RF04'
    // Add more objects as needed
];
// Populate the dropdown with initial options
populateDropdown(variableDataSources);
selectFlight(flightList);

// Event listener for dropdown change
document.getElementById('variable-select').addEventListener('change', function() {
    const selectedVariable = this.value;
    updateChartVariable(selectedVariable);
})
