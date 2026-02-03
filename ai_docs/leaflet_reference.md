# Leaflet.js Quick Reference

Leaflet is the JavaScript library used for rendering the Utah Political Layers map.

## Core Concepts

### Map Initialization
```javascript
// Create map centered on Utah
const map = L.map('map').setView([39.32, -111.67], 7);

// Add tile layer (basemap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);
```

### GeoJSON Layers
```javascript
// Create a GeoJSON layer with styling
const districtLayer = L.geoJSON(geojsonData, {
    style: function(feature) {
        return {
            fillColor: getPartyColor(feature.properties.party),
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7
        };
    },
    onEachFeature: function(feature, layer) {
        layer.bindPopup(feature.properties.name);
        layer.on('click', handleClick);
    }
}).addTo(map);
```

### Layer Control
```javascript
// Create base layers object
const baseLayers = {
    "Streets": streetLayer,
    "Satellite": satelliteLayer
};

// Create overlay layers object
const overlayLayers = {
    "House Districts": houseLayer,
    "Senate Districts": senateLayer,
    "Congressional": congressionalLayer
};

// Add layer control
L.control.layers(baseLayers, overlayLayers).addTo(map);
```

## Styling

### Color Functions
```javascript
function getPartyColor(party) {
    switch(party) {
        case 'Republican': return '#E81B23';  // Red
        case 'Democratic': return '#0015BC';  // Blue
        case 'Forward':    return '#8A2BE2';  // Purple
        default:           return '#808080';  // Gray
    }
}
```

### Dynamic Styling
```javascript
// Update layer style
layer.setStyle({
    fillColor: newColor,
    fillOpacity: 0.5
});

// Reset to default style
geoJsonLayer.resetStyle(layer);
```

## Events

### Mouse Events
```javascript
layer.on('click', function(e) {
    console.log('Clicked:', e.target.feature.properties);
});

layer.on('mouseover', function(e) {
    e.target.setStyle({ weight: 5 });
});

layer.on('mouseout', function(e) {
    geoJsonLayer.resetStyle(e.target);
});
```

### Map Events
```javascript
map.on('zoomend', function() {
    console.log('Zoom level:', map.getZoom());
});

map.on('moveend', function() {
    console.log('Center:', map.getCenter());
});
```

## Popups and Tooltips

### Popups
```javascript
layer.bindPopup('<b>District 1</b><br>Rep. John Smith (R)');

// Open popup programmatically
layer.openPopup();
```

### Tooltips
```javascript
layer.bindTooltip('District 1', {
    permanent: false,
    direction: 'center'
});
```

## Layer Z-Index

Control layer ordering with pane management:

```javascript
// Create custom pane
map.createPane('districtsPane');
map.getPane('districtsPane').style.zIndex = 400;

// Add layer to custom pane
L.geoJSON(data, {
    pane: 'districtsPane'
}).addTo(map);
```

## Common Patterns for Utah Political Layers

### Toggle Layer Visibility
```javascript
function toggleLayer(layer, visible) {
    if (visible) {
        map.addLayer(layer);
    } else {
        map.removeLayer(layer);
    }
}
```

### Fit Bounds to Layer
```javascript
map.fitBounds(districtLayer.getBounds());
```

### Get Feature by Property
```javascript
function findDistrictByName(name) {
    let found = null;
    districtLayer.eachLayer(function(layer) {
        if (layer.feature.properties.name === name) {
            found = layer;
        }
    });
    return found;
}
```

## Performance Tips

1. **Simplify GeoJSON** - Use tools like mapshaper to reduce polygon complexity
2. **Use Canvas Renderer** - For many features: `L.canvas()`
3. **Cluster Points** - For population dots, use `L.markerClusterGroup`
4. **Lazy Load** - Load layers only when needed

## Resources

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Leaflet Tutorials](https://leafletjs.com/examples.html)
- [GeoJSON Spec](https://geojson.org/)
