# ArcGIS FeatureService API Reference

Utah Political Layers fetches district boundaries from Utah SGID (State Geographic Information Database) ArcGIS services.

## Base URLs

### Utah SGID Services
```
https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/
```

### Key Endpoints

**Utah House Districts (2022-2032):**
```
https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahHouseDistricts2022to2032/FeatureServer/0
```

**Utah Senate Districts (2022-2032):**
```
https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahSenateDistricts2022to2032/FeatureServer/0
```

**US Congressional Districts:**
```
https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahCongressionalDistricts2022to2032/FeatureServer/0
```

## Query API

### Basic Query
```
/query?where=1=1&outFields=*&f=geojson
```

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `where` | SQL WHERE clause | `DIST=1` or `1=1` (all) |
| `outFields` | Fields to return | `*` or `DIST,NAME` |
| `f` | Output format | `geojson`, `json`, `pjson` |
| `returnGeometry` | Include geometry | `true` or `false` |
| `outSR` | Output spatial reference | `4326` (WGS84) |
| `geometryPrecision` | Coordinate precision | `6` |

### Example Queries

**Get all districts as GeoJSON:**
```
/query?where=1=1&outFields=*&f=geojson&outSR=4326
```

**Get specific district:**
```
/query?where=DIST=25&outFields=*&f=geojson&outSR=4326
```

**Get only attributes (no geometry):**
```
/query?where=1=1&outFields=DIST,LABEL&returnGeometry=false&f=json
```

## Response Format

### GeoJSON Response
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "OBJECTID": 1,
        "DIST": 25,
        "LABEL": "25",
        "COLOR": 2
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], ...]]
      }
    }
  ]
}
```

### Common Fields

**House/Senate Districts:**
- `OBJECTID` - Unique identifier
- `DIST` - District number (1-75 for House, 1-29 for Senate)
- `LABEL` - Display label
- `COLOR` - Color index for map rendering

**Congressional Districts:**
- `OBJECTID` - Unique identifier
- `DISTRICT` - District number (1-4)
- `LABEL` - Display label

## JavaScript Fetch Example

```javascript
async function fetchDistricts(serviceUrl) {
    const queryUrl = `${serviceUrl}/query?` + new URLSearchParams({
        where: '1=1',
        outFields: '*',
        f: 'geojson',
        outSR: '4326'
    });

    const response = await fetch(queryUrl);
    const geojson = await response.json();
    return geojson;
}

// Usage
const houseUrl = 'https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahHouseDistricts2022to2032/FeatureServer/0';
const houseDistricts = await fetchDistricts(houseUrl);
```

## Error Handling

### Common Errors

**Invalid Query:**
```json
{
  "error": {
    "code": 400,
    "message": "Unable to complete operation.",
    "details": ["Invalid or missing input parameters."]
  }
}
```

**Service Unavailable:**
```json
{
  "error": {
    "code": 503,
    "message": "Service unavailable"
  }
}
```

### Handling in Code
```javascript
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
}
```

## Caching Strategy

For Utah Political Layers, district boundaries are static (2022-2032), so:

1. **Fetch once** - Cache locally in `public/data/`
2. **Use cached GeoJSON** - Load from local files in production
3. **Periodic refresh** - Update cached data only when redistricting occurs

```javascript
// Load from local cache if available
async function getDistricts() {
    try {
        const response = await fetch('/data/house_districts.geojson');
        return await response.json();
    } catch (err) {
        // Fallback to live service
        return await fetchFromArcGIS();
    }
}
```

## Related Utah SGID Services

- **County Boundaries**: `UtahCounties`
- **Municipal Boundaries**: `UtahMunicipalities`
- **Voting Precincts**: `VotingPrecincts`
- **School Districts**: `UtahSchoolDistricts`

## Resources

- [Utah SGID Open Data](https://opendata.gis.utah.gov/)
- [ArcGIS REST API Documentation](https://developers.arcgis.com/rest/services-reference/)
- [UGRC (Utah Geospatial Resource Center)](https://gis.utah.gov/)
