const MAP_VIEW_STORAGE_KEY = "utah-map-view";
const POP_POINT_CACHE_KEY = "utah-pop-point-cache";
const POP_POINT_CACHE_VERSION_KEY = "utah-pop-point-cache-version";
const POP_POINT_CACHE_VERSION = 2;

const loadStoredView = () => {
  try {
    const raw = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.center) || parsed.center.length !== 2) return null;
    if (typeof parsed.zoom !== "number") return null;
    return parsed;
  } catch (error) {
    console.warn("Failed to load stored map view", error);
    return null;
  }
};

const map = L.map("map", {
  zoomSnap: 0.5,
  zoomControl: false  // We'll add it manually at bottomleft
});

// Add zoom control at bottom-left
L.control.zoom({
  position: 'bottomleft'
}).addTo(map);

// Add scale control at bottom-left
L.control.scale({
  position: 'bottomleft',
  imperial: true,
  metric: true
}).addTo(map);

// Expose for debugging
window.map = map;

// Utah's approximate bounds: [south, west] to [north, east]
const utahBounds = [[37.0, -114.05], [42.0, -109.04]];

const storedView = loadStoredView();
if (storedView) {
  map.setView(storedView.center, storedView.zoom);
} else {
  // Fit Utah to ~90% of viewport height
  map.fitBounds(utahBounds, {
    padding: [20, 20]  // 20px padding on all sides
  });
}

const populationPane = map.createPane("populationPane");
populationPane.style.zIndex = "450";
populationPane.style.pointerEvents = "auto";

const populationOutlinePane = map.createPane("populationOutlinePane");
populationOutlinePane.style.zIndex = "460";
populationOutlinePane.style.pointerEvents = "none";

const populationRenderer = L.canvas({ padding: 0.5, pane: "populationPane" });
const populationLayer = L.layerGroup();
let populationHighlight = null;

// Expose for debugging
window.populationLayer = populationLayer;
window.populationRenderer = populationRenderer;

const partyColor = (partyRaw) => {
  const party = (partyRaw || "").toLowerCase();
  if (party.startsWith("rep")) return "#d73027";
  if (party.startsWith("dem")) return "#4575b4";
  return "#9e9e9e";
};

const boundaryStyle = {
  color: "#2c3e50",
  weight: 2,
  fillOpacity: 0
};

const COLOR_STORAGE_KEY = "utah-layer-colors";
const UI_STORAGE_KEY = "utah-view-settings";

const defaultLineColors = {
  house: "#ff6f00",
  senate: "#00b0ff",
  congressCurrent: "#8e24aa",
  congressFuture: "#43a047"
};

const loadStoredColors = () => {
  try {
    const raw = localStorage.getItem(COLOR_STORAGE_KEY);
    if (!raw) return { ...defaultLineColors };
    const parsed = JSON.parse(raw);
    return { ...defaultLineColors, ...parsed };
  } catch (error) {
    console.warn("Failed to load stored colors", error);
    return { ...defaultLineColors };
  }
};

const loadStoredUi = () => {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to load stored UI settings", error);
    return {};
  }
};

const storedUi = loadStoredUi();
const uiState = { ...storedUi };
const defaultPopulationColor = "#ff0000";
let populationTintColor = storedUi.populationColor ?? defaultPopulationColor;
let populationPointCache = null;

const tileSources = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  },
  "carto-light": {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19
  },
  "carto-voyager": {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19
  },
  "carto-dark": {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19
  },
  "osm-hot": {
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors, HOT",
    maxZoom: 19
  },
  opentopo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors, &copy; OpenTopoMap",
    maxZoom: 17
  }
};

let baseTiles = null;
const selectedTileStyle = uiState.tileStyle ?? "osm";

const createBaseTiles = (styleKey) =>
  L.tileLayer(tileSources[styleKey].url, {
    maxZoom: tileSources[styleKey].maxZoom,
    attribution: tileSources[styleKey].attribution
  });

baseTiles = createBaseTiles(selectedTileStyle).addTo(map);

const populationState = {
  loaded: false,
  loading: false,
  maxDensity: 1,
  totalCount: 0
};

const loadPopulationPointCache = () => {
  if (populationPointCache) return populationPointCache;
  try {
    const version = Number(localStorage.getItem(POP_POINT_CACHE_VERSION_KEY));
    if (version !== POP_POINT_CACHE_VERSION) {
      localStorage.removeItem(POP_POINT_CACHE_KEY);
      localStorage.setItem(POP_POINT_CACHE_VERSION_KEY, String(POP_POINT_CACHE_VERSION));
    }
    const raw = localStorage.getItem(POP_POINT_CACHE_KEY);
    populationPointCache = raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn("Failed to load population point cache", error);
    populationPointCache = {};
  }
  return populationPointCache;
};

const persistPopulationPointCache = () => {
  try {
    localStorage.setItem(POP_POINT_CACHE_KEY, JSON.stringify(populationPointCache));
    localStorage.setItem(POP_POINT_CACHE_VERSION_KEY, String(POP_POINT_CACHE_VERSION));
  } catch (error) {
    console.warn("Failed to store population point cache", error);
  }
};

const fetchPopulationCount = async () => {
  const baseUrl =
    "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";
  const params = new URLSearchParams({
    where: "STATEFP10='49'",
    returnCountOnly: "true",
    f: "json"
  });
  const response = await fetch(`${baseUrl}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Population count failed: ${response.status}`);
  }
  const data = await response.json();
  return data.count || 0;
};

const ensurePopulationStatus = () => {
  let status = document.getElementById("population-status");
  if (!status) {
    const panel = document.getElementById("controls");
    if (!panel) return null;
    status = document.createElement("div");
    status.id = "population-status";
    status.className = "panel-section";
    status.textContent = "Population: preparing...";
    panel.appendChild(status);
  }
  return status;
};

const styleState = {
  partyFill: storedUi.partyFill ?? true,
  lineColors: loadStoredColors(),
  lineWidth: storedUi.lineWidth ?? 1.2,
  lineOpacity: Math.max(0.1, storedUi.lineOpacity ?? 1)
};

const persistUi = (next = {}) => {
  Object.assign(uiState, next, {
    partyFill: styleState.partyFill,
    lineWidth: styleState.lineWidth,
    lineOpacity: styleState.lineOpacity
  });
  localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(uiState));
};

const persistColors = () => {
  localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(styleState.lineColors));
};

const widthRange = { min: 0.5, max: 10, exponent: 2 };
const opacityRange = { min: 0.1, max: 1, exponent: 2 };

const expScale = (t, min, max, exponent) => {
  const clamped = Math.min(1, Math.max(0, t));
  const scaled = Math.pow(clamped, exponent);
  return min + (max - min) * scaled;
};

const hexToRgb = (hex) => {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return { r: 255, g: 0, b: 0 };
  return {
    r: parseInt(sanitized.slice(0, 2), 16),
    g: parseInt(sanitized.slice(2, 4), 16),
    b: parseInt(sanitized.slice(4, 6), 16)
  };
};

const mixColor = (base, t) => {
  const clamped = Math.min(1, Math.max(0, t));
  const r = Math.round(255 + (base.r - 255) * clamped);
  const g = Math.round(255 + (base.g - 255) * clamped);
  const b = Math.round(255 + (base.b - 255) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
};

const lineWeight = (base) => base * styleState.lineWidth;

const withPartyFill = (fillColor, fillOpacity) => ({
  fill: styleState.partyFill,
  fillColor: styleState.partyFill ? fillColor : fillColor,
  fillOpacity: styleState.partyFill ? fillOpacity : 0
});

const houseStyle = (party) => ({
  color: styleState.lineColors.house,
  weight: lineWeight(0.7),
  opacity: styleState.lineOpacity,
  ...withPartyFill(partyColor(party), 0.55)
});

const senateStyle = (party) => ({
  color: styleState.lineColors.senate,
  weight: lineWeight(1.2),
  opacity: styleState.lineOpacity,
  ...withPartyFill(partyColor(party), 0.35)
});

const congressCurrentStyle = (party) => ({
  color: styleState.lineColors.congressCurrent,
  weight: lineWeight(1.4),
  opacity: styleState.lineOpacity,
  ...withPartyFill(partyColor(party), 0.25)
});

const congressFutureStyle = (party) => ({
  color: styleState.lineColors.congressFuture,
  weight: lineWeight(1.2),
  opacity: styleState.lineOpacity,
  dashArray: "6 4",
  ...withPartyFill(partyColor(party), 0.15)
});

const layerState = {
  tiles: baseTiles,
  population: populationLayer,
  boundary: null,
  house: null,
  senate: null,
  congressCurrent: null,
  congressFuture: null
};

// Expose for debugging
window.layerState = layerState;

const loadJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
};

const attachToggle = (checkboxId, layerKey) => {
  const checkbox = document.getElementById(checkboxId);
  checkbox.addEventListener("change", () => {
    const layer = layerState[layerKey];
    if (!layer) return;
    if (checkbox.checked) {
      layer.addTo(map);
      if (layerKey === "population") {
        loadPopulationPoints().catch((error) => console.error(error));
        // Force canvas renderer to redraw if markers already loaded
        if (populationState.loaded && populationRenderer && populationRenderer._reset) {
          populationRenderer._reset();
        }
      }
    } else {
      map.removeLayer(layer);
    }
  });
};

const refreshPartyFill = (parties) => {
  const houseLayer = layerState.house;
  const senateLayer = layerState.senate;
  const congressCurrentLayer = layerState.congressCurrent;
  const congressFutureLayer = layerState.congressFuture;

  if (houseLayer) {
    houseLayer.setStyle((feature) => {
      const district = String(feature.properties.DIST);
      const info = parties.house[district];
      return houseStyle(info?.party);
    });
  }

  if (senateLayer) {
    senateLayer.setStyle((feature) => {
      const district = String(feature.properties.DIST);
      const info = parties.senate[district];
      return senateStyle(info?.party);
    });
  }

  if (congressCurrentLayer) {
    congressCurrentLayer.setStyle((feature) => {
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_current?.[district];
      return congressCurrentStyle(info?.party);
    });
  }

  if (congressFutureLayer) {
    congressFutureLayer.setStyle((feature) => {
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_future?.[district];
      return congressFutureStyle(info?.party);
    });
  }
};

const densityScale = (value) => {
  const max = populationState.maxDensity || 1;
  const t = Math.log(value + 1) / Math.log(max + 1);
  return Math.min(1, Math.max(0, t));
};

const updatePopulationStyles = () => {
  const base = hexToRgb(populationTintColor);
  populationLayer.eachLayer((layer) => {
    if (!layer.options || typeof layer.options.density !== "number") return;
    const t = Math.max(0.25, densityScale(layer.options.density));
    const color = mixColor(base, t);
    layer.setStyle({
      color: "#444444",
      fillColor: color,
      opacity: styleState.lineOpacity,
      fillOpacity: 0.7
    });
    const radius = 2 + t * 6;
    layer.setRadius(radius);
  });
  if (map.hasLayer(populationLayer) && populationLayer.eachLayer) {
    populationLayer.eachLayer((layer) => {
      if (layer.bringToFront) {
        layer.bringToFront();
      }
    });
  }
};

const outerRingsFromGeometry = (geometry) => {
  if (!geometry) return [];
  const { type, coordinates } = geometry;
  if (type === "Polygon" && coordinates.length) {
    return [coordinates[0]];
  }
  if (type === "MultiPolygon" && coordinates.length) {
    return coordinates.map((polygon) => polygon[0]).filter(Boolean);
  }
  return [];
};

const pointInRing = (point, ring) => {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const pointInGeometry = (point, geometry) => {
  const rings = outerRingsFromGeometry(geometry);
  return rings.some((ring) => ring && ring.length && pointInRing(point, ring));
};

const geometryBounds = (geometry) => {
  const rings = outerRingsFromGeometry(geometry);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  rings.forEach((ring) => {
    ring.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
};

const polygonCentroid = (ring) => {
  let area = 0;
  let cx = 0;
  let cy = 0;
  const len = ring.length;
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (area === 0) return ring[0];
  area *= 0.5;
  return [cx / (6 * area), cy / (6 * area)];
};

const distanceToSegmentSquared = (point, a, b) => {
  const [x, y] = point;
  const [x1, y1] = a;
  const [x2, y2] = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    const vx = x - x1;
    const vy = y - y1;
    return vx * vx + vy * vy;
  }
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const vx = x - px;
  const vy = y - py;
  return vx * vx + vy * vy;
};

const distanceToRingSquared = (point, ring) => {
  let min = Infinity;
  for (let i = 0, len = ring.length; i < len; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % len];
    min = Math.min(min, distanceToSegmentSquared(point, a, b));
  }
  return min;
};

const findInteriorPoint = (ring, geometry) => {
  const bounds = geometryBounds(geometry);
  if (!bounds) return ring[0];
  let bestPoint = ring[0];
  let bestDist = 0;
  const { minX, minY, maxX, maxY } = bounds;
  const width = maxX - minX;
  const height = maxY - minY;
  const steps = 8;
  let step = Math.min(width, height) / steps;
  for (let iter = 0; iter < 3; iter += 1) {
    for (let x = minX; x <= maxX; x += step) {
      for (let y = minY; y <= maxY; y += step) {
        const point = [x, y];
        if (!pointInGeometry(point, geometry)) continue;
        const dist = distanceToRingSquared(point, ring);
        if (dist > bestDist) {
          bestDist = dist;
          bestPoint = point;
        }
      }
    }
    const span = step * 2;
    const bx = bestPoint[0];
    const by = bestPoint[1];
    step /= 2;
    bounds.minX = Math.max(minX, bx - span);
    bounds.maxX = Math.min(maxX, bx + span);
    bounds.minY = Math.max(minY, by - span);
    bounds.maxY = Math.min(maxY, by + span);
  }
  return bestPoint;
};

const pointInsideGeometry = (geometry) => {
  if (!geometry) return null;
  if (geometry.type === "Point") {
    return geometry.coordinates;
  }
  const rings = outerRingsFromGeometry(geometry);
  if (!rings.length || !rings[0].length) return null;
  const ring = rings[0];
  const centroid = polygonCentroid(ring);
  if (pointInGeometry(centroid, geometry)) return centroid;
  return findInteriorPoint(ring, geometry);
};

const earthRadius = 6378137;
const ringAreaMeters = (coords) => {
  if (!coords || coords.length < 3) return 0;
  let area = 0;
  for (let i = 0, len = coords.length; i < len; i += 1) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[(i + 1) % len];
    const lam1 = (lon1 * Math.PI) / 180;
    const lam2 = (lon2 * Math.PI) / 180;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    area += (lam2 - lam1) * (2 + Math.sin(phi1) + Math.sin(phi2));
  }
  return (area * earthRadius * earthRadius) / 2;
};

const geometryAreaMeters = (geometry) => {
  if (!geometry) return 0;
  const { type, coordinates } = geometry;
  if (type === "Polygon") {
    let area = Math.abs(ringAreaMeters(coordinates[0]));
    for (let i = 1; i < coordinates.length; i += 1) {
      area -= Math.abs(ringAreaMeters(coordinates[i]));
    }
    return Math.abs(area);
  }
  if (type === "MultiPolygon") {
    return coordinates.reduce((sum, polygon) => {
      if (!polygon.length) return sum;
      let polyArea = Math.abs(ringAreaMeters(polygon[0]));
      for (let i = 1; i < polygon.length; i += 1) {
        polyArea -= Math.abs(ringAreaMeters(polygon[i]));
      }
      return sum + Math.abs(polyArea);
    }, 0);
  }
  return 0;
};

const buildPopulationMarker = (feature, baseColor, cache) => {
  if (!feature) return null;
  const density = Number(feature.properties?.PopDensity || 0);
  const population = Number(feature.properties?.POP10 || 0);
  const objectId = String(feature.properties?.FID || "");
  let centerLonLat = cache[objectId];
  if (
    centerLonLat &&
    (centerLonLat.length !== 2 ||
      centerLonLat[0] < -130 ||
      centerLonLat[0] > -100 ||
      centerLonLat[1] < 30 ||
      centerLonLat[1] > 50)
  ) {
    centerLonLat = null;
  }
  if (!centerLonLat) {
    centerLonLat = pointInsideGeometry(feature.geometry);
    if (centerLonLat) {
      cache[objectId] = centerLonLat;
    }
  }
  if (!centerLonLat) return null;
  const center = [centerLonLat[1], centerLonLat[0]];
  if (density > populationState.maxDensity) {
    populationState.maxDensity = density;
  }
  const marker = L.circleMarker(center, {
    renderer: populationRenderer,
    radius: 4,
    weight: 0.4,
    color: "#444444",
    fillColor: baseColor,
    fillOpacity: 0.7,
    opacity: styleState.lineOpacity,
    density
  });
  const areaSqMi = geometryAreaMeters(feature.geometry) * 3.8610216e-7;
  let areaLabel = "n/a";
  if (areaSqMi > 0) {
    if (areaSqMi >= 1) {
      areaLabel = `${areaSqMi.toFixed(2)} mi²`;
    } else {
      const acres = areaSqMi * 640;
      areaLabel = `${acres.toFixed(2)} acres`;
    }
  }
  const popupHtml = `Population: ${population}<br />Block area: ${areaLabel}`;

  // Bind tooltip for hover
  marker.bindTooltip(popupHtml, {
    direction: "top",
    offset: [0, -8],
    opacity: 0.95,
    className: "population-tooltip",
    sticky: true
  });

  // Click handler to highlight the block boundary
  marker.on("click", (e) => {
    L.DomEvent.stopPropagation(e);

    const highlightId = String(feature.properties?.FID ?? "");
    if (populationHighlight) {
      if (populationHighlight._highlightId === highlightId) {
        map.removeLayer(populationHighlight);
        populationHighlight = null;
        return;
      }
      map.removeLayer(populationHighlight);
      populationHighlight = null;
    }

    populationHighlight = L.geoJSON(feature.geometry, {
      pane: "populationOutlinePane",
      style: {
        color: "#111111",
        weight: 2,
        fillOpacity: 0
      }
    }).addTo(map);
    populationHighlight._highlightId = highlightId;
    populationHighlight.bindTooltip(popupHtml, {
      direction: "top",
      offset: [0, -8],
      opacity: 0.95,
      className: "population-tooltip",
      sticky: true
    });
    populationHighlight.on("click", () => {
      map.removeLayer(populationHighlight);
      populationHighlight = null;
    });
  });

  return marker;
};

const loadPopulationPointsViaRest = async (baseColor, cache, status) => {
  const baseUrl =
    "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";
  const pageSize = 2000;
  let offset = 0;
  let received = 0;

  while (true) {
    const params = new URLSearchParams({
      where: "STATEFP10='49'",
      outFields: "*",
      outSR: "4326",
      f: "geojson",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize)
    });
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Population query failed: ${response.status}`);
    }
    const data = await response.json();
    const features = data.features || [];
    if (!features.length) {
      break;
    }
    const markers = [];
    features.forEach((feature) => {
      const marker = buildPopulationMarker(feature, baseColor, cache);
      if (marker) {
        markers.push(marker);
      }
    });
    if (markers.length) {
      await new Promise((resolve) => {
        const chunkSize = 400;
        let index = 0;
        const addChunk = () => {
          const end = Math.min(index + chunkSize, markers.length);
          for (; index < end; index += 1) {
            populationLayer.addLayer(markers[index]);
          }
          // Force renderer to draw this chunk
          if (populationRenderer && populationRenderer._redraw) {
            populationRenderer._redraw();
          }
          if (index < markers.length) {
            requestAnimationFrame(addChunk);
          } else {
            resolve();
          }
        };
        addChunk();
      });
    }
    received += features.length;
    if (status) {
      status.textContent = `Population: ${received.toLocaleString()} loaded (REST)`;
    }
    offset += pageSize;
    if (features.length < pageSize) {
      break;
    }
  }

  return received;
};

const loadPopulationPoints = async () => {
  if (populationState.loaded || populationState.loading) return;
  populationState.loading = true;
  const status = ensurePopulationStatus();
  let loadingDots = 0;
  let loadingTimer = null;
  if (status) {
    status.textContent = "Population: loading";
    loadingTimer = setInterval(() => {
      loadingDots = (loadingDots + 1) % 6;
      status.textContent = `Population: loading${".".repeat(loadingDots)}`;
    }, 5000);
  }
  try {
    populationState.totalCount = await fetchPopulationCount();
  } catch (error) {
    console.warn("Population count failed", error);
  }
  console.log("Loading population points...");
  try {
    const baseColor = mixColor(hexToRgb(populationTintColor), 0.5);
    const cache = loadPopulationPointCache();
    const restCount = await loadPopulationPointsViaRest(baseColor, cache, status);
    populationState.loaded = true;
    populationState.loading = false;
    updatePopulationStyles();
    persistPopulationPointCache();
    if (loadingTimer) {
      clearInterval(loadingTimer);
    }
    if (status) {
      status.textContent = restCount
        ? `Population: ready (${restCount.toLocaleString()})`
        : "Population: ready (no features)";
    }
    const populationToggle = document.getElementById("toggle-population");
    if (populationToggle && populationToggle.checked && !map.hasLayer(populationLayer)) {
      populationLayer.addTo(map);
      // Trigger a map redraw to render the canvas markers
      setTimeout(() => {
        if (populationRenderer && populationRenderer._redraw) {
          populationRenderer._redraw();
        }
        // Force map to redraw
        map.invalidateSize();
      }, 100);
    }
  } catch (error) {
    populationState.loading = false;
    if (loadingTimer) {
      clearInterval(loadingTimer);
    }
    throw error;
  }
};

const bindColorPickers = (parties) => {
  const config = [
    { id: "color-house", key: "house" },
    { id: "color-senate", key: "senate" },
    { id: "color-congress-current", key: "congressCurrent" },
    { id: "color-congress-future", key: "congressFuture" }
  ];

  config.forEach(({ id, key }) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.value = styleState.lineColors[key];
    input.addEventListener("input", () => {
      styleState.lineColors[key] = input.value;
      persistColors();
      refreshPartyFill(parties);
    });
  });
};

const bindPopulationColor = () => {
  const input = document.getElementById("color-population");
  if (!input) return;
  populationTintColor = uiState.populationColor ?? defaultPopulationColor;
  input.value = populationTintColor;
  updatePopulationStyles();
  input.addEventListener("input", () => {
    populationTintColor = input.value;
    uiState.populationColor = input.value;
    persistUi({ populationColor: input.value });
    updatePopulationStyles();
  });
};

const bindTileStylePicker = () => {
  const select = document.getElementById("tile-style-select");
  if (!select) return;
  select.value = uiState.tileStyle ?? "osm";
  select.addEventListener("change", () => {
    const styleKey = select.value;
    if (!tileSources[styleKey]) return;
    uiState.tileStyle = styleKey;
    persistUi({ tileStyle: styleKey });
    if (layerState.tiles) {
      map.removeLayer(layerState.tiles);
    }
    baseTiles = createBaseTiles(styleKey);
    layerState.tiles = baseTiles;
    const tilesToggle = document.getElementById("toggle-tiles");
    if (!tilesToggle || tilesToggle.checked) {
      baseTiles.addTo(map);
    }
  });
};

const bindLineControls = (parties) => {
  const widthInput = document.getElementById("line-width");
  const opacityInput = document.getElementById("line-opacity");

  if (widthInput) {
    widthInput.value = String(storedUi.widthSlider ?? 0.6);
    widthInput.addEventListener("input", () => {
      const t = parseFloat(widthInput.value);
      styleState.lineWidth = expScale(t, widthRange.min, widthRange.max, widthRange.exponent);
      persistUi({ widthSlider: t });
      refreshPartyFill(parties);
    });
    styleState.lineWidth = expScale(parseFloat(widthInput.value), widthRange.min, widthRange.max, widthRange.exponent);
  }

  if (opacityInput) {
    opacityInput.value = String(storedUi.opacitySlider ?? 1);
    opacityInput.addEventListener("input", () => {
      const t = parseFloat(opacityInput.value);
      styleState.lineOpacity = expScale(t, opacityRange.min, opacityRange.max, opacityRange.exponent);
      persistUi({ opacitySlider: t });
      refreshPartyFill(parties);
    });
    styleState.lineOpacity = expScale(parseFloat(opacityInput.value), opacityRange.min, opacityRange.max, opacityRange.exponent);
  }
};

const init = async () => {
  const [boundary, house, senate, congressCurrent, congressFuture, parties] = await Promise.all([
    loadJson("data/utah_boundary.geojson"),
    loadJson("data/utah_house_2022.geojson"),
    loadJson("data/utah_senate_2022.geojson"),
    loadJson("data/utah_congress_2022.geojson"),
    loadJson("data/utah_congress_2026.geojson"),
    loadJson("data/utah_parties.json")
  ]);

  layerState.boundary = L.geoJSON(boundary, { style: boundaryStyle }).addTo(map);
  if (!storedView) {
    map.fitBounds(layerState.boundary.getBounds(), { padding: [20, 20] });
  }

  layerState.house = L.geoJSON(house, {
    style: (feature) => {
      const district = String(feature.properties.DIST);
      const info = parties.house[district];
      return houseStyle(info?.party);
    },
    onEachFeature: (feature, layer) => {
      const district = String(feature.properties.DIST);
      const info = parties.house[district];
      const partyLabel = info?.party || "Unknown";
      const nameLabel = info?.name ? ` — ${info.name}` : "";
      layer.bindPopup(`House District ${district}<br />${partyLabel}${nameLabel}`);
    }
  }).addTo(map);

  layerState.senate = L.geoJSON(senate, {
    style: (feature) => {
      const district = String(feature.properties.DIST);
      const info = parties.senate[district];
      return senateStyle(info?.party);
    },
    onEachFeature: (feature, layer) => {
      const district = String(feature.properties.DIST);
      const info = parties.senate[district];
      const partyLabel = info?.party || "Unknown";
      const nameLabel = info?.name ? ` — ${info.name}` : "";
      layer.bindPopup(`Senate District ${district}<br />${partyLabel}${nameLabel}`);
    }
  }).addTo(map);

  layerState.congressCurrent = L.geoJSON(congressCurrent, {
    style: (feature) => {
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_current?.[district];
      return congressCurrentStyle(info?.party);
    },
    onEachFeature: (feature, layer) => {
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_current?.[district];
      const partyLabel = info?.party || "Unknown";
      const nameLabel = info?.name ? ` — ${info.name}` : "";
      layer.bindPopup(`Federal House District ${district}<br />${partyLabel}${nameLabel}`);
    }
  }).addTo(map);

  layerState.congressFuture = L.geoJSON(congressFuture, {
    style: (feature) => {
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_future?.[district];
      return congressFutureStyle(info?.party);
    },
    onEachFeature: (feature, layer) => {
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_future?.[district];
      const partyLabel = info?.party || "Unknown";
      const nameLabel = info?.name && info?.name !== "TBD" ? ` — ${info.name}` : "";
      layer.bindPopup(`Federal House District ${district} (coming)<br />${partyLabel}${nameLabel}`);
    }
  });

  const toggleConfig = [
    { id: "toggle-boundary", key: "boundary" },
    { id: "toggle-tiles", key: "tiles" },
    { id: "toggle-population", key: "population" },
    { id: "toggle-house", key: "house" },
    { id: "toggle-senate", key: "senate" },
    { id: "toggle-congress-current", key: "congressCurrent" },
    { id: "toggle-congress-future", key: "congressFuture" }
  ];

  toggleConfig.forEach(({ id, key }) => {
    const checkbox = document.getElementById(id);
    if (!checkbox) return;
    if (storedUi.toggles && typeof storedUi.toggles[id] === "boolean") {
      checkbox.checked = storedUi.toggles[id];
    }
    attachToggle(id, key);
    if (!checkbox.checked) {
      map.removeLayer(layerState[key]);
    } else if (key === "population") {
      layerState.population.addTo(map);
      // Load population data if checkbox is initially checked
      loadPopulationPoints().catch((error) => console.error(error));
    }
  });

  const partyFillToggle = document.getElementById("toggle-party-fill");
  if (partyFillToggle) {
    partyFillToggle.checked = styleState.partyFill;
    partyFillToggle.addEventListener("change", () => {
      styleState.partyFill = partyFillToggle.checked;
      persistUi({ partyFill: styleState.partyFill });
      refreshPartyFill(parties);
    });
  }

  bindColorPickers(parties);
  bindLineControls(parties);
  bindPopulationColor();
  bindTileStylePicker();

  // Don't load population points during init - only load when user checks the toggle
  // This ensures markers are added after the layer is on the map
  // loadPopulationPoints().catch((error) => {
  //   console.error(error);
  //   const status = ensurePopulationStatus();
  //   if (status) {
  //     status.textContent = "Population: failed to load (check console).";
  //   }
  // });

  const panel = document.getElementById("controls");
  const panelToggle = document.getElementById("panel-toggle");
  if (panel && panelToggle) {
    panelToggle.addEventListener("click", () => {
      const collapsed = panel.classList.toggle("collapsed");
      panelToggle.textContent = collapsed ? "▶" : "◀";
      panelToggle.setAttribute("aria-expanded", String(!collapsed));
    });
  }

  const toggleInputs = toggleConfig.map(({ id }) => document.getElementById(id)).filter(Boolean);
  toggleInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const toggles = toggleInputs.reduce((acc, el) => {
        acc[el.id] = el.checked;
        return acc;
      }, {});
      persistUi({ toggles });
    });
  });

  const storeView = () => {
    const center = map.getCenter();
    localStorage.setItem(
      MAP_VIEW_STORAGE_KEY,
      JSON.stringify({ center: [center.lat, center.lng], zoom: map.getZoom() })
    );
  };

  storeView();
  map.on("moveend", storeView);
  map.on("zoomend", storeView);
};

init().catch((error) => {
  console.error(error);
  const panel = document.getElementById("controls");
  const errorDiv = document.createElement("div");
  errorDiv.className = "panel-section";
  errorDiv.textContent = "Failed to load data. Check the console for details.";
  panel.appendChild(errorDiv);
});
