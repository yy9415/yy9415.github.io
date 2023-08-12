// Function to format the x-axis labels (including both date and time)
function formatXAxisLabels(labels) {
    return labels.map((label) => {
        const date = new Date(label);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    });
}

// Function to get data from csv that has sensor of sensorIndex
async function fetchSensorData(sensorIndex) {
    const filenames = [
        `ordered_dallas.csv`,
        `ordered_dallas_1.csv`,
        `ordered_dallas_2.csv`,
        `ordered_dallas_3.csv`,
        `ordered_dallas_4.csv`,
        `ordered_dallas_5.csv`,
        `ordered_dallas_6.csv`,
        `ordered_dallas_7.csv`,
        `ordered_dallas_8.csv`,
        `ordered_dallas_9.csv`,
        `ordered_dallas_10.csv`,
        `ordered_dallas_11.csv`,
        `ordered_dallas_12.csv`
    ];

    // Iterate through filenames and find the file that contains the sensor data
    for (const filename of filenames) {
        try {
            const response = await fetch(`data/${filename}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const csvText = await response.text();
            const parsedData = Papa.parse(csvText, { header: true }).data;
            const sensorIds = [
                parseInt(parsedData[1].sensor_index),
                parseInt(parsedData[parsedData.length - 2].sensor_index)
            ];
            if (sensorIds.includes(parseInt(sensorIndex))) {
                console.log(`Creating graph for sensor ${sensorIndex} using file ${filename}`);
                const sensorData = parsedData.filter(item => parseInt(item.sensor_index) === parseInt(sensorIndex));
                return sensorData;
            }
        } catch (error) {
            console.error('Error fetching or parsing sensor data:', error);
        }
    }
}

function parseCSVData(data) {
    return new Promise((resolve, reject) => {
        Papa.parse(data, {
            header: true,
            complete: (result) => {
                resolve(result.data);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

function showNoDataMessage() {
    noDataElement.style.display = 'block';
}

function hideNoDataMessage() {
    noDataElement.style.display = 'none';
}

function changeGraphData(dataType, sensorIndex) {
    console.log('Changing graph data. Data type:', dataType, 'Sensor index:', sensorIndex);

    if (chart) {
        chart.destroy();
    }

    // Call the fetchSensorData function and pass the selected dataType
    fetchSensorData(sensorIndex).then(array => {
        graphSensorData(array, dataType);
    }).catch(error => {
        console.error('Error fetching or parsing sensor data:', error);
    });
}

function generateFormattedLabels(hourlyData, dataType) {

    return hourlyData.map(item => {
        const date = new Date(item.date);
        const value = parseFloat(item[`${dataType}_atm`]);
        const formattedLabel = `${date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} - ${value.toFixed(2)}`;
        // Add a console.log statement here to check the y-axis value

        return formattedLabel;
    });
}

function generateButtons(sensorIndex) {
    const buttonContainer = document.getElementById('buttonContainer');
    buttonContainer.innerHTML = ''; // Clear previous buttons

    ['pm1_0', 'pm2_5', 'pm10_0'].forEach(dataType => {
        const button = document.createElement('button');
        button.textContent = dataType.toUpperCase();
        button.className = 'btn btn-primary';
        button.onclick = () => changeGraphData(dataType, sensorIndex);
        buttonContainer.appendChild(button);
    });
}

//Variables for clearing graph, or if graph doesn't have any data to use
let chart = null;
let noDataElement = document.getElementById('noData');

fetch('data/Dallas_purple_stations_static.csv')
    .then(response => response.text())
    .then(parseCSVData)
    .then(sensorData => {
        map.on('load', () => {
            sensorData.forEach(sensor => {
                const { latitude, longitude, name, sensor_index } = sensor;
                const popupContent = `
                    <p>PurpleAir sensor ID: ${sensor_index}</p>
                    <p>Name: "${name}"</p>
                `;
                const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

                // Check if latitude and longitude are valid numbers
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    const marker = new mapboxgl.Marker({ color: 'purple', scale: 0.4 })
                        .setLngLat([longitude, latitude])
                        .setPopup(popup)
                        .addTo(map);

                    // Handle marker click event
                    marker.getElement().addEventListener('click', async () => {
                        hideNoDataMessage();
                        console.log(`Clicked on marker for sensor ${sensor_index}`);
                        try {
                            var array = await fetchSensorData(sensor_index);
                            graphSensorData(array, 'pm1_0'); // Default to PM1.0 data
                            generateButtons(sensor_index);
                        } catch (error) {
                            console.error('Error fetching or parsing sensor data:', error);
                        }
                    });
                } else {
                    console.log(`Invalid latitude or longitude for sensor ${sensor_index}`);
                }
            });
        });
    });


function graphSensorData(parsedData, dataType) {

    //Refresh chart with new data
    if (chart) {
        chart.destroy();
    }

    //Show or hide "no data" message based on result
    if (!parsedData || parsedData.length === 0) {
        showNoDataMessage();
        return;
    } else {
        hideNoDataMessage();
    }

    //Extract sensor data from CSV

    const stationID = parsedData[0].sensor_index;
    //const latitude = parsedData[0].LATITUDE;
    //const longitude = parsedData[0].LONGITUDE;
    //const location = parsedData[0].NAME;

    console.log('Graphing data type:', dataType, 'Sensor index:', stationID);

    // Extract the desired data from the CSV
    const hourlyData = parsedData.map(item => ({
        date: new Date(item.time_stamp),
        pm1_0_atm: parseFloat(item['pm1.0_atm']),
        pm2_5_atm: parseFloat(item['pm2.5_atm']),
        pm10_0_atm: parseFloat(item['pm10.0_atm']),
    }));



    // Create the Chart.js line graphs using xValues and yValues
    const xValues = hourlyData.map(item => item.date);
    const formattedXValues = generateFormattedLabels(hourlyData, dataType);
    const yValues = hourlyData.map(item => parseFloat(item[`${dataType}_atm`]));
    console.log('yValues:', yValues);

    // Update the station data text above the graphs
    const stationDataElement = document.getElementById('stationData');
    stationDataElement.innerHTML = `CURRENTLY USING DATA FROM:<br>Station ${stationID}`;

    // Temperature Chart
    const ctxTemp = document.getElementById("chart").getContext("2d");
    chart = new Chart(ctxTemp, {
        type: "line",
        data: {
            labels: formattedXValues,
            datasets: [{
                data: yValues,
                label: dataType === 'pm1_0' ? "PM1.0" : (dataType === 'pm2_5' ? "PM2.5" : "PM10.0"),
                borderColor: "green",
                backgroundColor: "green",
                fill: false,
                pointRadius: 1,
                borderWidth: 1,
            }],
        },
        options: {
            title: {
                display: true,
                text: `Measured ${dataType === 'pm1_0' ? "PM1.0" : (dataType === 'pm2_5' ? "PM2.5" : "PM10.0")} Level`,
                fontSize: 16,
                fontColor: "#333",
            },
            legend: {
                display: true,
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Time',
                        fontColor: 'black',
                        fontSize: 18,
                        fontWeight: 'bold',
                    },
                    ticks: {
                        maxTicksLimit: 15,
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: `${dataType === 'pm1_0' ? "PM1.0" : (dataType === 'pm2_5' ? "PM2.5" : "PM10.0")} (µg/m³)`,
                        fontColor: 'black',
                        fontSize: 18,
                        fontWeight: 'bold',
                    }
                }],
            },
        }
    });
}
