// Mapbox access token- currently using personal one since the public isn't working for some reason 
mapboxgl.accessToken = 'pk.eyJ1Ijoia2x5MTU2MSIsImEiOiJjbGpyZ3cyNXAwZTRlM2xwYTB4MTFhamxjIn0.6lSih4h7eLl7-go6nqh9Mw';

// Use custom style
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/kly1561/clk6yidy302iy01nm7inu9m8j',
    center: [-98.5795, 39.8282],
    zoom: 3.2
});

map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    })
);

location1 = 'Boston, Massachusetts'
location2 = 'Los Angeles, California'
location3 = 'Chicago, Illinois'
location4 = 'Pittsburgh, Pennsylvania'
location5 = 'Phoenix, Arizona'
location6 = 'Philadelphia, Pennsylvania'
location7 = 'San Diego, California'
location8 = 'Denver, Colorado'
location9 = 'Seattle, Washington'
location10 = 'Omaha, Nebraska'
location11 = 'New York City, New York'
location12 = 'Houston, Texas'
location13 = 'San Antonio, Texas'
location14 = 'Dallas, Texas'
location15 = 'San Jose, California'
locations = [location1, location2, location3, location4, location5, location6, location7, location8, location9, location10, location11, location12, location13, location14, location15]


function zoomTo(element) {
    var loc = locations[element.id]
    const mapboxClient = mapboxSdk({ accessToken: mapboxgl.accessToken });
    mapboxClient.geocoding.forwardGeocode({ query: loc })
        .send()
        .then((response) => {
            const feature = response.body.features[0];
            map.flyTo({
                center: feature.center,
                zoom: 8.5
            });
        });

}

map.on('load', () => {

    //Set default atmosphere style
    map.setFog({});

    // Add sources for boundary layers
    map.addSource('county', {
        type: 'geojson',
        data: 'data/county_coords.geojson'
    })
    map.addSource('lattice', {
        type: 'geojson',
        data: 'data/lattice_coords.geojson'
    })
    map.addSource('rectangle', {
        type: 'geojson',
        data: 'data/rectangle_coords.geojson'
    })



    //Add county data boundaries
    map.addLayer({
        id: 'county_fill',
        type: 'fill',
        source: 'county',
        paint: { 'fill-color': 'red', 'fill-opacity': 0.3 }
    }, 'state-label')
    map.addLayer({
        id: 'county_boundaries',
        type: 'line',
        source: 'county',
        paint: { 'line-color': 'red', 'line-width': 1, 'line-opacity': 0.8 }
    }, 'state-label')

    //Add rectangle data boundaries
    map.addLayer({
        id: 'rectangle_fill',
        type: 'fill',
        source: 'rectangle',
        paint: { 'fill-color': 'blue', 'fill-opacity': 0.3 }
    }, 'state-label')
    map.addLayer({
        id: 'rectangle_boundaries',
        type: 'line',
        source: 'rectangle',
        paint: { 'line-color': 'blue', 'line-width': 1, 'line-opacity': 0.8 }
    }, 'state-label')

    //Add lattice data boundaries
    map.addLayer({
        id: 'lattice_fill',
        type: 'fill',
        source: 'lattice',
        paint: { 'fill-color': 'orange', 'fill-opacity': 0.3 }
    }, 'state-label')
    map.addLayer({
        id: 'lattice_boundaries',
        type: 'line',
        source: 'lattice',
        paint: { 'line-color': 'orange', 'line-width': 1, 'line-opacity': 0.8 }
    }, 'state-label')


    const mapboxClient = mapboxSdk({ accessToken: mapboxgl.accessToken });

    for (let index = 0; index < locations.length; index++) {
        mapboxClient.geocoding.forwardGeocode({ query: locations[index] })
            .send()
            .then((response) => {
                const feature = response.body.features[0];

                // Create a marker and add it to the map
                const new_popup = new mapboxgl.Popup({ offset: 25 }).setText(locations[index]);
                const new_marker = new mapboxgl.Marker({ color: 'blue', scale: 0.8 })
                    .setLngLat(feature.center)
                    .setPopup(new_popup)
                    .addTo(map);
            });
    }
});

map.on('idle', () => {
    // If layers were not added to the map, abort
    if (!map.getLayer('county_fill') || !map.getLayer('lattice_fill') || !map.getLayer('rectangle_fill') ||
        !map.getLayer('county_boundaries') || !map.getLayer('lattice_boundaries') || !map.getLayer('rectangle_boundaries')) {
        return;
    }

    // Create a mapping of layer IDs to display labels.
    const layerLabels = {
        county_fill: 'Toggle county layer',
        lattice_fill: 'Toggle lattice layer',
        rectangle_fill: 'Toggle rectangle layer'
    };

    // Enumerate ids of the fill and boundaries layers.
    const toggleableLayerIds = [
        { fill: 'county_fill', boundaries: 'county_boundaries' },
        { fill: 'lattice_fill', boundaries: 'lattice_boundaries' },
        { fill: 'rectangle_fill', boundaries: 'rectangle_boundaries' }
    ];

    // Set up the corresponding toggle button for each layer
    for (const layerIds of toggleableLayerIds) {
        if (document.getElementById(layerIds.fill)) {
            continue;
        }

        // Create a link for the fill layer
        const fillLink = document.createElement('a');
        fillLink.id = layerIds.fill;
        fillLink.href = '#';
        fillLink.textContent = layerLabels[layerIds.fill];
        fillLink.className = 'active';

        // Show or hide fill layer when the toggle is clicked.
        fillLink.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            const fillVisibility = map.getLayoutProperty(layerIds.fill, 'visibility');

            // Toggle fill layer visibility by changing the layout object's visibility property
            if (fillVisibility === 'visible') {
                map.setLayoutProperty(layerIds.fill, 'visibility', 'none');
                map.setLayoutProperty(layerIds.boundaries, 'visibility', 'none');
                this.className = '';
            } else {
                this.className = 'active';
                map.setLayoutProperty(layerIds.fill, 'visibility', 'visible');
                map.setLayoutProperty(layerIds.boundaries, 'visibility', 'visible');
            }
        };

        const layers = document.getElementById('menu');
        layers.appendChild(fillLink);
    }
});

