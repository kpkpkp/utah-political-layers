// Google Analytics 4 tracking helper
const trackEvent = (eventName, params = {}) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, params);
  }
};

// Corner position management
const loadCornerPosition = () => {
  const saved = localStorage.getItem(CORNER_STORAGE_KEY);
  if (saved && CORNERS.includes(saved)) {
    currentCornerIndex = CORNERS.indexOf(saved);
  }
  applyCornerPosition();
};

const applyCornerPosition = () => {
  const panel = document.getElementById("controls");
  if (!panel) return;
  CORNERS.forEach(c => panel.classList.remove(`corner-${c}`));
  panel.classList.add(`corner-${CORNERS[currentCornerIndex]}`);
  updateToggleDirection();
  updateControlsPosition();
};

const rotateCorner = () => {
  currentCornerIndex = (currentCornerIndex + 1) % CORNERS.length;
  localStorage.setItem(CORNER_STORAGE_KEY, CORNERS[currentCornerIndex]);
  applyCornerPosition();
  trackEvent('panel_corner_change', { corner: CORNERS[currentCornerIndex] });
};

const updateControlsPosition = () => {
  // Controls stay one corner AHEAD of panel (clockwise)
  const controlsCornerIndex = (currentCornerIndex + 1) % CORNERS.length;
  const controlsCorner = CORNERS[controlsCornerIndex];

  // Parse corner into vertical and horizontal parts
  const [vertical, horizontal] = controlsCorner.split("-");

  // Leaflet containers use classes like "leaflet-top leaflet-left"
  const newContainer = document.querySelector(`.leaflet-${vertical}.leaflet-${horizontal}`);

  // Move zoom and scale controls to new corner
  const zoomControl = document.querySelector(".leaflet-control-zoom");
  const scaleControl = document.querySelector(".leaflet-control-scale");

  const attrControl = document.querySelector(".leaflet-control-attribution");
  if (zoomControl && newContainer) {
    newContainer.appendChild(zoomControl);
  }
  if (scaleControl && newContainer) {
    newContainer.appendChild(scaleControl);
  }
  if (attrControl && newContainer) {
    newContainer.appendChild(attrControl);
  }
};

const updateToggleDirection = () => {
  const toggle = document.getElementById("panel-toggle");
  const panel = document.getElementById("controls");
  if (!toggle || !panel) return;

  const corner = CORNERS[currentCornerIndex];
  const collapsed = panel.classList.contains("collapsed");

  // For right-side corners, arrow points left when expanded, right when collapsed
  // For left-side corners, arrow points right when expanded, left when collapsed
  if (corner.includes("right")) {
    toggle.textContent = collapsed ? "▶" : "◀";
  } else {
    toggle.textContent = collapsed ? "◀" : "▶";
  }
};

const MAP_VIEW_STORAGE_KEY = "utah-map-view";
const POP_POINT_CACHE_KEY = "utah-pop-point-cache";
const POP_POINT_CACHE_VERSION_KEY = "utah-pop-point-cache-version";
const POP_POINT_CACHE_VERSION = 2;
const CORNER_STORAGE_KEY = "utah-panel-corner";
const CORNERS = ["top-right", "bottom-right", "bottom-left", "top-left"];
let currentCornerIndex = 0;

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
  zoomSnap: 0.25,      // Snap to quarter-zoom levels for smoother transitions
  zoomDelta: 0.25,     // Each +/- button click zooms by 0.25 levels
  zoomControl: false   // We'll add it manually at bottomleft
});

// Add zoom control at bottom-left
L.control.zoom({
  position: 'bottomleft',
  zoomInTitle: 'Zoom in (0.25x)',
  zoomOutTitle: 'Zoom out (0.25x)'
}).addTo(map);

// Add scale control at bottom-left
L.control.scale({
  position: 'bottomleft',
  imperial: true,
  metric: true
}).addTo(map);

// Zoom level indicator (bottom-right corner of map)
const ZoomIndicator = L.Control.extend({
  options: { position: 'bottomright' },
  onAdd: function () {
    const div = L.DomUtil.create('div', 'zoom-indicator');
    div.style.cssText = 'background:rgba(255,255,255,0.85);padding:2px 6px;border-radius:4px;font-size:11px;color:#333;border:1px solid #aaa;pointer-events:none;';
    this._div = div;
    this._update();
    map.on('zoomend', () => this._update());
    return div;
  },
  _update: function () {
    const z = map.getZoom();
    this._div.textContent = z != null ? `Zoom: ${z.toFixed(1)}` : '';
  }
});
new ZoomIndicator().addTo(map);

// Ensure Leaflet controls are visible - diagnostic and fix
window.addEventListener('load', () => {
  setTimeout(() => {
    const bottomLeft = document.querySelector('.leaflet-bottom-left');
    const zoomControl = document.querySelector('.leaflet-control-zoom');
    const scaleControl = document.querySelector('.leaflet-control-scale');

    console.log('Control visibility check:');
    console.log('bottomLeft exists:', !!bottomLeft);
    console.log('zoomControl exists:', !!zoomControl);
    console.log('scaleControl exists:', !!scaleControl);

    if (bottomLeft) {
      console.log('bottomLeft computed style:', {
        position: getComputedStyle(bottomLeft).position,
        bottom: getComputedStyle(bottomLeft).bottom,
        left: getComputedStyle(bottomLeft).left,
        zIndex: getComputedStyle(bottomLeft).zIndex,
        visibility: getComputedStyle(bottomLeft).visibility,
        display: getComputedStyle(bottomLeft).display
      });

      // Ensure parent container is properly positioned
      bottomLeft.style.position = 'absolute';
      bottomLeft.style.bottom = '0';
      bottomLeft.style.left = '0';
      bottomLeft.style.zIndex = '999';
      bottomLeft.style.visibility = 'visible';
      bottomLeft.style.display = 'block';
      bottomLeft.style.overflow = 'visible';
    }

    if (zoomControl) {
      // Zoom control should be positioned relative to parent
      zoomControl.style.position = 'relative';
      zoomControl.style.bottom = 'auto';
      zoomControl.style.left = 'auto';
      zoomControl.style.marginTop = '10px';
      zoomControl.style.visibility = 'visible';
      zoomControl.style.display = 'block';
      zoomControl.style.zIndex = '999';
      console.log('Fixed zoom control visibility');
    }

    if (scaleControl) {
      // Scale control should be positioned relative to parent
      scaleControl.style.position = 'relative';
      scaleControl.style.bottom = 'auto';
      scaleControl.style.left = 'auto';
      scaleControl.style.marginTop = '5px';
      scaleControl.style.visibility = 'visible';
      scaleControl.style.display = 'block';
      zoomControl.style.zIndex = '999';
      console.log('Fixed scale control visibility');
    }
  }, 500);
});

// Expose for debugging
window.map = map;

// Utah's approximate bounds: [south, west] to [north, east]
const utahBounds = [[37.0, -114.05], [42.0, -109.04]];

// In Streamlit iframe, resize map to real viewport so fitBounds works correctly.
// The iframe is height=2000 but only ~900px of real screen is visible.
// screen.availHeight gives the real device screen height.
const inIframe = window.self !== window.top;
if (inIframe) {
  const mapEl = map.getContainer();
  const screenH = screen.availHeight || screen.height || 900;
  mapEl.style.height = screenH + 'px';
  map.invalidateSize({ animate: false });
}

const storedView = loadStoredView();
if (storedView) {
  map.setView(storedView.center, storedView.zoom);
} else {
  map.fitBounds(utahBounds, {
    padding: [10, 10]
  });
}

const populationPane = map.createPane("populationPane");
populationPane.style.zIndex = "450";  // Above overlays (400) so dots aren't hidden by party fill
populationPane.style.pointerEvents = "none";  // Allow clicks to pass through to districts

const populationOutlinePane = map.createPane("populationOutlinePane");
populationOutlinePane.style.zIndex = "460";  // Just above population pane
populationOutlinePane.style.pointerEvents = "auto";  // Allow clicks on outline to dismiss it

const parcelPane = map.createPane("parcelPane");
parcelPane.style.zIndex = "455";  // Above population (450) so parcels are clickable when both layers on
parcelPane.style.pointerEvents = "auto";

const contourPane = map.createPane("contourPane");
contourPane.style.zIndex = "435";  // Below parcels and population
contourPane.style.pointerEvents = "auto";  // Allow hover for elevation labels

const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
const populationRenderer = L.canvas({ padding: 0.5, pane: "populationPane", tolerance: isTouchDevice ? 12 : 0 });
const populationLayer = L.layerGroup();
let populationHighlight = null;

const parcelRenderer = L.canvas({ padding: 0.5, pane: "parcelPane", tolerance: isTouchDevice ? 12 : 0 });
const parcelLayer = L.layerGroup();
const contourLayer = L.layerGroup();

const parcelState = {
  loading: false,
  enabled: false,
  loadedBounds: null,
  abortController: null,
  minZoom: 15
};

const contourState = {
  loading: false,
  enabled: false,
  loadedBounds: null,
  loadedZoomTier: null,
  abortController: null,
  minZoom: 0
};

let countyBoundsData = null;

// Helper to enable pointer-events on the population canvas
// Called after canvas is created (when first marker is added)
const enablePopulationCanvasClicks = () => {
  const canvas = populationPane.querySelector('canvas');
  if (canvas && canvas.style.pointerEvents !== "auto") {
    canvas.style.pointerEvents = "auto";
    console.log('Enabled pointer-events on population canvas');
  }
};

// Expose for debugging
window.populationLayer = populationLayer;
window.populationRenderer = populationRenderer;
window.setDistrictPointerEvents = null; // Will be set after function definition

// Color configuration schema
const COLOR_CONFIG_STORAGE_KEY = "utah-color-config";

const defaultColorConfig = {
  // Party colors for fill
  party: {
    republican: "#d73027",
    democratic: "#4575b4",
    forward: "#808080",
    other: "#8B7D6B"
  },
  // Outline colors for districts
  outline: {
    boundary: "#2c3e50",
    house: "#ff6f00",
    senate: "#66777f",
    congressCurrent: "#524619",
    congressFuture: "#f68a0e"
  }
};

const loadColorConfig = () => {
  try {
    const raw = localStorage.getItem(COLOR_CONFIG_STORAGE_KEY);
    if (!raw) return { ...defaultColorConfig };
    const parsed = JSON.parse(raw);
    return {
      party: { ...defaultColorConfig.party, ...parsed.party },
      outline: { ...defaultColorConfig.outline, ...parsed.outline }
    };
  } catch (error) {
    console.warn("Failed to load color config", error);
    return { ...defaultColorConfig };
  }
};

const persistColorConfig = (config) => {
  try {
    localStorage.setItem(COLOR_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn("Failed to persist color config", error);
  }
};

const updateColorConfig = (updates) => {
  const current = loadColorConfig();
  const updated = {
    party: { ...current.party, ...updates.party },
    outline: { ...current.outline, ...updates.outline }
  };
  persistColorConfig(updated);
  return updated;
};

const colorConfig = loadColorConfig();

const partyColor = (partyRaw) => {
  const party = (partyRaw || "").toLowerCase();
  if (party.startsWith("rep")) return colorConfig.party.republican;
  if (party.startsWith("dem")) return colorConfig.party.democratic;
  if (party.startsWith("forward") || party.startsWith("fwd")) return colorConfig.party.forward;
  return colorConfig.party.other;
};

const boundaryStyle = {
  color: colorConfig.outline.boundary,
  weight: 2,
  fillOpacity: 0,
  interactive: false  // Allow clicks to pass through to population dots
};

const COLOR_STORAGE_KEY = "utah-layer-colors";
const UI_STORAGE_KEY = "utah-view-settings";

const defaultLineColors = {
  house: colorConfig.outline.house,
  senate: colorConfig.outline.senate,
  congressCurrent: colorConfig.outline.congressCurrent,
  congressFuture: colorConfig.outline.congressFuture,
  parcels: "#888888",
  contours: "#8B4513"
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
const defaultPopulationColor = "#ccb43e";
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

// Expose for debugging and testing
window.populationState = populationState;

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
  return status;
};

const styleState = {
  partyFill: storedUi.partyFill ?? false,
  lineColors: loadStoredColors(),
  lineWidth: storedUi.lineWidth ?? 0.57,
  lineOpacity: Math.max(0.1, storedUi.lineOpacity ?? 0.83),
  fillOpacity: storedUi.fillOpacity ?? 0.58
};

// Expose for debugging
window.styleState = styleState;

// Expose color configuration API for external use
window.getColorConfig = loadColorConfig;
window.updateColorConfig = updateColorConfig;

const persistUi = (next = {}) => {
  Object.assign(uiState, next, {
    partyFill: styleState.partyFill,
    lineWidth: styleState.lineWidth,
    lineOpacity: styleState.lineOpacity,
    fillOpacity: styleState.fillOpacity
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
  fillOpacity: styleState.partyFill ? fillOpacity * styleState.fillOpacity : 0
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
  congressFuture: null,
  parcels: parcelLayer,
  contours: contourLayer
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
    if (layerKey === "population") {
      if (checkbox.checked) {
        // If data not yet loaded, add to map and start loading
        if (!map.hasLayer(populationLayer)) {
          populationLayer.addTo(map);
        }
        if (!populationState.loaded && !populationState.loading) {
          loadPopulationPoints().catch((error) => console.error(error));
        }
        // Show pane instantly (no re-render needed)
        populationPane.style.display = "";
        populationOutlinePane.style.display = "";
        trackEvent('population_toggle', { enabled: true });
      } else {
        // Hide pane instantly — layer stays on map, canvas stays rendered
        populationPane.style.display = "none";
        populationOutlinePane.style.display = "none";
        trackEvent('population_toggle', { enabled: false });
      }
    } else if (layerKey === "parcels") {
      if (checkbox.checked) {
        parcelState.enabled = true;
        if (!map.hasLayer(parcelLayer)) parcelLayer.addTo(map);
        parcelPane.style.display = "";
        loadParcelsForView().catch(err => console.error("Parcel load:", err));
        trackEvent('layer_toggle', { layer: 'parcels', enabled: true });
      } else {
        parcelState.enabled = false;
        parcelPane.style.display = "none";
        trackEvent('layer_toggle', { layer: 'parcels', enabled: false });
      }
    } else if (layerKey === "contours") {
      if (checkbox.checked) {
        contourState.enabled = true;
        if (!map.hasLayer(contourLayer)) contourLayer.addTo(map);
        contourPane.style.display = "";
        loadContoursForView().catch(err => console.error("Contour load:", err));
        trackEvent('layer_toggle', { layer: 'contours', enabled: true });
      } else {
        contourState.enabled = false;
        contourPane.style.display = "none";
        trackEvent('layer_toggle', { layer: 'contours', enabled: false });
      }
    } else if (checkbox.checked) {
      layer.addTo(map);
      trackEvent('layer_toggle', { layer: layerKey, enabled: true });
    } else {
      map.removeLayer(layer);
      trackEvent('layer_toggle', { layer: layerKey, enabled: false });
    }
  });
};

const setDistrictPointerEvents = () => {
  // When party fill is disabled, only the stroke should be clickable
  // This allows clicking on population dots underneath the district outlines
  const pointerEvents = styleState.partyFill ? "auto" : "stroke";

  [layerState.house, layerState.senate, layerState.congressCurrent, layerState.congressFuture].forEach((layer) => {
    if (layer) {
      layer.eachLayer((sublayer) => {
        if (sublayer._path) {
          sublayer._path.style.pointerEvents = pointerEvents;
        }
      });
    }
  });
};

// Expose for debugging
window.setDistrictPointerEvents = setDistrictPointerEvents;

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

  // Set pointer-events after styles are applied
  // Use requestAnimationFrame to ensure DOM is updated
  requestAnimationFrame(() => {
    setDistrictPointerEvents();
  });
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
  if (!coordinates) return [];
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
  if (!coordinates) return 0;
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
  if (!feature || !feature.geometry) return null;
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
  marker.on("click", async (e) => {
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

    // Fetch elevation for popup
    let elevText = "Loading elevation...";
    const makeTooltipHtml = () => `${popupHtml}<br />${elevText}`;

    populationHighlight = L.geoJSON(feature.geometry, {
      pane: "populationOutlinePane",
      style: {
        color: "#111111",
        weight: 2,
        fillOpacity: 0
      }
    }).addTo(map);
    populationHighlight._highlightId = highlightId;
    populationHighlight.bindTooltip(makeTooltipHtml(), {
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

    // Async elevation fetch
    try {
      const elev = await fetchElevation(e.latlng.lat, e.latlng.lng);
      elevText = `Elevation: ${Math.round(elev).toLocaleString()} ft`;
    } catch {
      elevText = "Elevation: unavailable";
    }
    if (populationHighlight && populationHighlight._highlightId === highlightId) {
      populationHighlight.unbindTooltip();
      populationHighlight.bindTooltip(makeTooltipHtml(), {
        direction: "top",
        offset: [0, -8],
        opacity: 0.95,
        className: "population-tooltip",
        sticky: true
      });
    }
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
    if (status) {
      const total = populationState.totalCount;
      const fetchMsg = total
        ? `${received.toLocaleString()} / ${total.toLocaleString()}`
        : `${received.toLocaleString()}`;
      status.textContent = fetchMsg;
    }
    const params = new URLSearchParams({
      where: "STATEFP10='49'",
      outFields: "FID,PopDensity,POP10",
      geometryType: "esriGeometryEnvelope",
      outSR: "4326",
      f: "geojson",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize)
    });
    let response, data;
    try {
      response = await fetch(`${baseUrl}?${params.toString()}`);
    } catch (fetchErr) {
      throw new Error("fetch failed: " + (fetchErr.message || fetchErr));
    }
    if (!response.ok) {
      throw new Error("http " + response.status);
    }
    try {
      data = await response.json();
    } catch (jsonErr) {
      throw new Error("json parse: " + (jsonErr.message || jsonErr));
    }
    if (!data) {
      throw new Error("null response data");
    }
    if (data.error) {
      throw new Error("arcgis: " + (data.error.message || "unknown"));
    }
    const features = (data && data.features) || [];
    if (!features.length) {
      break;
    }
    const markers = [];
    features.forEach((feature) => {
      try {
        const marker = buildPopulationMarker(feature, baseColor, cache);
        if (marker) {
          markers.push(marker);
        }
      } catch (e) {
        // Skip features with bad geometry
      }
    });
    if (markers.length) {
      await new Promise((resolve, reject) => {
        const chunkSize = 400;
        let index = 0;
        const addChunk = () => {
          try {
            const end = Math.min(index + chunkSize, markers.length);
            for (; index < end; index += 1) {
              populationLayer.addLayer(markers[index]);
            }
            if (map.hasLayer(populationLayer) && populationRenderer && populationRenderer._redraw) {
              populationRenderer._redraw();
            }
            if (map.hasLayer(populationLayer) && index === chunkSize) {
              enablePopulationCanvasClicks();
            }
            if (index < markers.length) {
              requestAnimationFrame(addChunk);
            } else {
              resolve();
            }
          } catch (chunkErr) {
            reject(chunkErr);
          }
        };
        addChunk();
      });
    }
    received += features.length;
    if (status) {
      const total = populationState.totalCount;
      status.textContent = total
        ? `${received.toLocaleString()} / ${total.toLocaleString()}`
        : `${received.toLocaleString()} blocks`;
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
    status.textContent = "loading...";
    loadingTimer = setInterval(() => {
      loadingDots = (loadingDots + 1) % 4;
      status.textContent = `loading${".".repeat(loadingDots + 1)}`;
    }, 500);
  }
  try {
    populationState.totalCount = await fetchPopulationCount();
  } catch (error) {
    console.warn("Population count failed", error);
  }
  if (loadingTimer) {
    clearInterval(loadingTimer);
    loadingTimer = null;
  }
  try {
    const baseColor = mixColor(hexToRgb(populationTintColor), 0.5);
    const cache = loadPopulationPointCache();
    const restCount = await loadPopulationPointsViaRest(baseColor, cache, status);
    populationState.loaded = true;
    populationState.loading = false;
    updatePopulationStyles();
    persistPopulationPointCache();
    if (status) {
      status.textContent = restCount ? `${restCount.toLocaleString()} blocks` : "ready";
    }
    // Add layer to map (hidden) so canvas is pre-rendered for instant toggle
    if (!map.hasLayer(populationLayer)) {
      populationPane.style.display = "none";
      populationOutlinePane.style.display = "none";
      populationLayer.addTo(map);
    }
    const populationToggle = document.getElementById("toggle-population");
    if (populationToggle && populationToggle.checked) {
      populationPane.style.display = "";
      populationOutlinePane.style.display = "";
    }
    enablePopulationCanvasClicks();
  } catch (error) {
    populationState.loading = false;
    if (loadingTimer) {
      clearInterval(loadingTimer);
    }
    throw error;
  }
};

// ===== Elevation Point Query =====
const fetchElevation = async (lat, lng) => {
  const resp = await fetch(`https://epqs.nationalmap.gov/v1/json?x=${lng}&y=${lat}&units=Feet`);
  if (!resp.ok) throw new Error("Elevation query failed");
  const data = await resp.json();
  return data.value;
};

// ===== County Bounds Intersection =====
const getCountiesInBounds = (mapBounds) => {
  if (!countyBoundsData) return [];
  const w = mapBounds.getWest();
  const s = mapBounds.getSouth();
  const e = mapBounds.getEast();
  const n = mapBounds.getNorth();
  const matches = [];
  for (const [county, bbox] of Object.entries(countyBoundsData)) {
    // bbox = [west, south, east, north]
    if (bbox[0] <= e && bbox[2] >= w && bbox[1] <= n && bbox[3] >= s) {
      matches.push(county);
    }
  }
  return matches;
};

// ===== Parcel Popup Builder =====
const buildParcelPopup = (props, elevationHtml) => {
  const lines = [];
  if (props.PARCEL_ADD) lines.push(`<strong>${props.PARCEL_ADD}</strong>`);
  if (props.PARCEL_CITY) lines.push(props.PARCEL_CITY);
  if (props.PARCEL_ACRES) lines.push(`${Number(props.PARCEL_ACRES).toFixed(2)} acres`);
  if (props.TOTAL_MKT_VALUE) lines.push(`Market value: $${Number(props.TOTAL_MKT_VALUE).toLocaleString()}`);
  if (props.LAND_MKT_VALUE) lines.push(`Land value: $${Number(props.LAND_MKT_VALUE).toLocaleString()}`);
  if (props.BLDG_SQFT) lines.push(`Building: ${Number(props.BLDG_SQFT).toLocaleString()} sq ft`);
  if (props.BUILT_YR && props.BUILT_YR > 0) lines.push(`Built: ${props.BUILT_YR}`);
  if (props.FLOORS_CNT && props.FLOORS_CNT > 0) lines.push(`Floors: ${props.FLOORS_CNT}`);
  if (props.PROP_CLASS) lines.push(`Class: ${props.PROP_CLASS}`);
  if (props.TAX_DISTRICT) lines.push(`Tax district: ${props.TAX_DISTRICT}`);
  lines.push(elevationHtml);
  if (props.SERIAL_NUM) lines.push(`<small>Serial: ${props.SERIAL_NUM}</small>`);
  return lines.join('<br />');
};

// ===== Parcel Loading Engine =====
const PARCEL_BASE_URL = "https://services1.arcgis.com/99lidPhWCzftIe9K/ArcGIS/rest/services";
const PARCEL_OUT_FIELDS = "PARCEL_ID,PARCEL_ADD,PARCEL_CITY,TOTAL_MKT_VALUE,LAND_MKT_VALUE,PARCEL_ACRES,PROP_CLASS,BLDG_SQFT,FLOORS_CNT,BUILT_YR,TAX_DISTRICT,SERIAL_NUM";

const loadParcelsForView = async () => {
  const status = document.getElementById("parcel-status");
  const zoom = map.getZoom();

  if (zoom < parcelState.minZoom) {
    parcelLayer.clearLayers();
    parcelState.loadedBounds = null;
    if (status) status.textContent = "zoom in to see";
    return;
  }

  const bounds = map.getBounds().pad(0.1);

  // Skip if already loaded for these bounds
  if (parcelState.loadedBounds && parcelState.loadedBounds.contains(bounds)) {
    return;
  }

  // Abort previous in-flight requests
  if (parcelState.abortController) {
    parcelState.abortController.abort();
  }
  parcelState.abortController = new AbortController();
  const signal = parcelState.abortController.signal;

  parcelState.loading = true;
  if (status) status.textContent = "loading...";

  const counties = getCountiesInBounds(bounds);
  if (!counties.length) {
    parcelState.loading = false;
    if (status) status.textContent = "";
    return;
  }

  // Convert bounds to envelope for ArcGIS query
  const envelope = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
  const parcelColor = styleState.lineColors.parcels || "#888888";

  parcelLayer.clearLayers();
  let totalFeatures = 0;
  const maxTotal = 4000;

  try {
    for (const county of counties) {
      if (signal.aborted || totalFeatures >= maxTotal) break;

      const serviceUrl = `${PARCEL_BASE_URL}/Parcels_${county}_LIR/FeatureServer/0/query`;
      let offset = 0;

      while (totalFeatures < maxTotal) {
        if (signal.aborted) break;
        const params = new URLSearchParams({
          geometry: envelope,
          geometryType: "esriGeometryEnvelope",
          spatialRel: "esriSpatialRelIntersects",
          inSR: "4326",
          outFields: PARCEL_OUT_FIELDS,
          outSR: "4326",
          f: "geojson",
          resultOffset: String(offset),
          resultRecordCount: "2000"
        });

        const response = await fetch(`${serviceUrl}?${params.toString()}`, { signal });
        if (!response.ok) {
          console.warn(`Parcel query failed for ${county}: ${response.status}`);
          break;
        }
        const data = await response.json();
        if (data.error) {
          console.warn(`Parcel query error for ${county}:`, data.error.message);
          break;
        }

        const features = data.features || [];
        if (!features.length) break;

        const geoLayer = L.geoJSON({ type: "FeatureCollection", features }, {
          renderer: parcelRenderer,
          pane: "parcelPane",
          style: () => ({
            color: parcelColor,
            weight: 1,
            opacity: 0.7,
            fillColor: "transparent",
            fillOpacity: 0
          }),
          onEachFeature: (feature, layer) => {
            layer.on("click", async (e) => {
              L.DomEvent.stopPropagation(e);
              // Highlight clicked parcel
              if (map._parcelHighlight) {
                map.removeLayer(map._parcelHighlight);
                map._parcelHighlight = null;
              }
              const hl = L.geoJSON(feature, {
                pane: "parcelPane",
                style: () => ({
                  color: "#FFD700",
                  weight: 3,
                  opacity: 1,
                  fillColor: "#FFD700",
                  fillOpacity: 0.12
                }),
                interactive: false
              }).addTo(map);
              map._parcelHighlight = hl;

              const p = feature.properties;
              let elevHtml = '<em>Loading elevation...</em>';
              const popup = L.popup().setLatLng(e.latlng).setContent(buildParcelPopup(p, elevHtml)).openOn(map);
              map.on("popupclose", function onClose() {
                if (map._parcelHighlight) {
                  map.removeLayer(map._parcelHighlight);
                  map._parcelHighlight = null;
                }
                map.off("popupclose", onClose);
              });
              try {
                const elev = await fetchElevation(e.latlng.lat, e.latlng.lng);
                elevHtml = `Elevation: ${Math.round(elev).toLocaleString()} ft`;
              } catch {
                elevHtml = 'Elevation: unavailable';
              }
              popup.setContent(buildParcelPopup(p, elevHtml));
            });
          }
        });

        parcelLayer.addLayer(geoLayer);
        totalFeatures += features.length;

        if (status) status.textContent = `${totalFeatures.toLocaleString()} parcels`;

        // Check if more pages
        if (data.exceededTransferLimit || features.length === 2000) {
          offset += features.length;
        } else {
          break;
        }
      }
    }

    parcelState.loadedBounds = bounds;
    parcelState.loading = false;
    if (status) {
      status.textContent = totalFeatures > 0 ? `${totalFeatures.toLocaleString()} parcels` : "";
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    parcelState.loading = false;
    if (status) status.textContent = "error";
    console.error("Parcel load error:", err);
  }
};

// ===== Contour Loading Engine =====
const CONTOUR_URL = "https://services1.arcgis.com/99lidPhWCzftIe9K/ArcGIS/rest/services/Contours500Ft/FeatureServer/0/query";

// ===== Contour Label Placement Along Lines =====
// Track placed label pixel positions to avoid overlaps
let contourLabelPositions = [];
const LABEL_MIN_PX_APART = 120; // minimum pixel distance between any two labels

const pixelDist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const labelOverlaps = (pt) => contourLabelPositions.some(p => pixelDist(p, pt) < LABEL_MIN_PX_APART);

// Measure straightness: max deviation of intermediate points from the line between start and end
const segmentStraightness = (coords, iStart, iEnd) => {
  const [x1, y1] = coords[iStart];
  const [x2, y2] = coords[iEnd];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0;
  let maxDev = 0;
  for (let i = iStart + 1; i < iEnd; i++) {
    const [px, py] = coords[i];
    // Perpendicular distance from point to line
    const t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const dev = Math.sqrt(Math.pow(px - projX, 2) + Math.pow(py - projY, 2));
    if (dev > maxDev) maxDev = dev;
  }
  return maxDev;
};

// Find best straight stretch of at least `minPts` points, return { midIdx, angle }
const findStraightStretch = (coords, minPts) => {
  if (coords.length < minPts) return null;
  let bestMid = -1;
  let bestDev = Infinity;
  let bestAngle = 0;
  const windowSize = Math.min(minPts, coords.length);
  for (let i = 0; i <= coords.length - windowSize; i++) {
    const dev = segmentStraightness(coords, i, i + windowSize - 1);
    if (dev < bestDev) {
      bestDev = dev;
      bestMid = i + Math.floor(windowSize / 2);
      const [x1, y1] = coords[i];
      const [x2, y2] = coords[i + windowSize - 1];
      bestAngle = Math.atan2(y2 - y1, x2 - x1);
    }
  }
  if (bestMid < 0) return null;
  return { idx: bestMid, angle: bestAngle };
};

// Place labels along a contour line at regular intervals, picking straight stretches
const placeContourLabels = (coords, elev, tier) => {
  if (!coords || coords.length < 4) return [];
  if (elev % tier.labelMinInterval !== 0) return [];

  const labels = [];
  // Walk along the line and place labels every ~300px worth of geo distance
  // Use segments of ~8 points to find straight stretches
  const segLen = Math.min(8, Math.floor(coords.length / 2));
  if (segLen < 3) return [];
  const step = Math.max(segLen * 2, Math.floor(coords.length / 4));

  for (let start = 0; start + segLen < coords.length; start += step) {
    const end = Math.min(start + segLen * 2, coords.length);
    const subCoords = coords.slice(start, end);
    const stretch = findStraightStretch(subCoords, Math.min(4, subCoords.length));
    if (!stretch) continue;

    const globalIdx = start + stretch.idx;
    const [lng, lat] = coords[globalIdx];
    const pt = map.latLngToLayerPoint([lat, lng]);

    if (labelOverlaps(pt)) continue;

    // Convert geo angle to screen angle (y is flipped in screen coords)
    let angleDeg = -(stretch.angle * 180 / Math.PI);
    // Keep text upright: flip if pointing left
    if (angleDeg > 90) angleDeg -= 180;
    if (angleDeg < -90) angleDeg += 180;

    contourLabelPositions.push(pt);
    labels.push({ lat, lng, angleDeg, elev });
  }
  return labels;
};

// Zoom-dependent contour detail tiers
// At low zoom show only major ridgelines, progressively add detail closer to ground
const getContourTier = (zoom) => {
  // Utah elevation range: ~2500–13500 ft; contour data at 500 ft intervals
  // Use MOD() for ArcGIS REST SQL compatibility (% operator not supported)
  if (zoom >= 13) return { where: "1=1",                    interval: 500,  maxContours: 4000, weight: 1.5, opacity: 0.6,  labelMinInterval: 500 };
  if (zoom >= 11) return { where: "MOD(ELEV,1000)=0",       interval: 1000, maxContours: 3000, weight: 1.2, opacity: 0.5,  labelMinInterval: 1000 };
  if (zoom >= 9)  return { where: "MOD(ELEV,2000)=0",       interval: 2000, maxContours: 2000, weight: 1.0, opacity: 0.45, labelMinInterval: 2000 };
  if (zoom >= 7)  return { where: "MOD(ELEV,2500)=0",       interval: 2500, maxContours: 1500, weight: 0.8, opacity: 0.4,  labelMinInterval: 2500 };
  return                  { where: "MOD(ELEV,2500)=0",       interval: 2500, maxContours: 1000, weight: 0.7, opacity: 0.35, labelMinInterval: 2500 };
};

const loadContoursForView = async () => {
  const zoom = map.getZoom();
  const tier = getContourTier(zoom);

  if (zoom < contourState.minZoom) {
    contourLayer.clearLayers();
    contourState.loadedBounds = null;
    contourState.loadedZoomTier = null;
    return;
  }

  const bounds = map.getBounds().pad(0.1);

  // Reload if bounds changed OR zoom tier changed (need different WHERE filter)
  if (contourState.loadedBounds && contourState.loadedBounds.contains(bounds) &&
      contourState.loadedZoomTier === tier.interval) {
    return;
  }

  if (contourState.abortController) {
    contourState.abortController.abort();
  }
  contourState.abortController = new AbortController();
  const signal = contourState.abortController.signal;

  contourState.loading = true;
  const envelope = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
  const contourColor = styleState.lineColors.contours || "#8B4513";

  contourLayer.clearLayers();
  contourLabelPositions = [];

  try {
    let offset = 0;
    let total = 0;

    while (total < tier.maxContours) {
      if (signal.aborted) break;
      const params = new URLSearchParams({
        where: tier.where,
        geometry: envelope,
        geometryType: "esriGeometryEnvelope",
        spatialRel: "esriSpatialRelIntersects",
        inSR: "4326",
        outFields: "ELEV",
        outSR: "4326",
        f: "geojson",
        resultOffset: String(offset),
        resultRecordCount: "2000"
      });

      const response = await fetch(`${CONTOUR_URL}?${params.toString()}`, { signal });
      if (!response.ok) break;
      const data = await response.json();
      if (data.error) break;

      const features = data.features || [];
      if (!features.length) break;

      const geoLayer = L.geoJSON({ type: "FeatureCollection", features }, {
        pane: "contourPane",
        style: () => ({
          color: contourColor,
          weight: tier.weight,
          opacity: tier.opacity,
          fill: false
        }),
        onEachFeature: (feature, layer) => {
          if (feature.properties?.ELEV) {
            layer.bindTooltip(`${feature.properties.ELEV}`, {
              sticky: true,
              direction: "top",
              className: "contour-label",
              offset: [0, -8],
              opacity: 0.95
            });
          }
        }
      });

      contourLayer.addLayer(geoLayer);

      // Place rotated labels along straight stretches of contour lines
      features.forEach((f) => {
        if (!f.properties?.ELEV || !f.geometry?.coordinates) return;
        try {
          const allCoords = f.geometry.type === "MultiLineString"
            ? f.geometry.coordinates
            : [f.geometry.coordinates];
          allCoords.forEach((coords) => {
            if (!coords || coords.length < 4) return;
            const labels = placeContourLabels(coords, f.properties.ELEV, tier);
            labels.forEach(({ lat, lng, angleDeg, elev }) => {
              contourLayer.addLayer(L.marker([lat, lng], {
                icon: L.divIcon({
                  className: "contour-label-inline",
                  html: `<span style="transform:rotate(${angleDeg.toFixed(1)}deg)">${elev}</span>`,
                  iconSize: [40, 14],
                  iconAnchor: [20, 7]
                }),
                interactive: false,
                pane: "tooltipPane"
              }));
            });
          });
        } catch { /* skip label errors */ }
      });

      total += features.length;

      if (data.exceededTransferLimit || features.length === 2000) {
        offset += features.length;
      } else {
        break;
      }
    }

    contourState.loadedBounds = bounds;
    contourState.loadedZoomTier = tier.interval;
    contourState.loading = false;
  } catch (err) {
    if (err.name === "AbortError") return;
    contourState.loading = false;
    console.error("Contour load error:", err);
  }
};

// ===== Debounced Viewport-Driven Loading =====
let parcelLoadTimeout = null;
let contourLoadTimeout = null;

const debouncedParcelLoad = () => {
  clearTimeout(parcelLoadTimeout);
  parcelLoadTimeout = setTimeout(() => {
    if (parcelState.enabled) {
      loadParcelsForView().catch(err => console.error("Parcel load:", err));
    }
  }, 400);
};

const debouncedContourLoad = () => {
  clearTimeout(contourLoadTimeout);
  contourLoadTimeout = setTimeout(() => {
    if (contourState.enabled) {
      loadContoursForView().catch(err => console.error("Contour load:", err));
    }
  }, 400);
};

const bindColorPickers = (parties) => {
  // Outline color pickers
  const outlineConfig = [
    { id: "outline-color-boundary", key: "boundary" },
    { id: "outline-color-house", key: "house" },
    { id: "outline-color-senate", key: "senate" },
    { id: "outline-color-congress-current", key: "congressCurrent" },
    { id: "outline-color-congress-future", key: "congressFuture" }
  ];

  outlineConfig.forEach(({ id, key }) => {
    const input = document.getElementById(id);
    if (!input) return;
    // Set initial value from colorConfig
    input.value = colorConfig.outline[key];
    input.addEventListener("input", () => {
      // Update colorConfig
      const updatedConfig = updateColorConfig({ outline: { [key]: input.value } });
      // Update the in-memory colorConfig object
      Object.assign(colorConfig, updatedConfig);
      // Update boundary layer style directly
      if (key === "boundary" && layerState.boundary) {
        layerState.boundary.setStyle({ color: input.value });
      } else {
        // Update styleState lineColors to match
        styleState.lineColors[key] = input.value;
        persistColors();
        // Refresh map styling
        refreshPartyFill(parties);
      }
      // Track color change
      trackEvent('color_changed', { type: 'outline', color: key, value: input.value });
    });
  });
};

const recenterMap = (parties) => {
  // Clear localStorage for color config
  localStorage.removeItem(COLOR_CONFIG_STORAGE_KEY);

  // Reload default colors into colorConfig
  Object.assign(colorConfig, defaultColorConfig);

  // Update all outline color picker inputs
  const outlineInputs = [
    { id: "outline-color-boundary", key: "boundary" },
    { id: "outline-color-house", key: "house" },
    { id: "outline-color-senate", key: "senate" },
    { id: "outline-color-congress-current", key: "congressCurrent" },
    { id: "outline-color-congress-future", key: "congressFuture" }
  ];

  outlineInputs.forEach(({ id, key }) => {
    const input = document.getElementById(id);
    if (input) {
      input.value = defaultColorConfig.outline[key];
    }
  });

  // Update styleState lineColors to match defaults
  Object.assign(styleState.lineColors, defaultColorConfig.outline);
  persistColors();

  // Reset boundary layer color
  if (layerState.boundary) {
    layerState.boundary.setStyle({ color: defaultColorConfig.outline.boundary });
  }

  // Refresh map styling
  refreshPartyFill(parties);

  // Reset map view to fit Utah to viewport
  // In Streamlit iframe, map container is 2000px but viewport is ~700px,
  // so fitBounds zooms out too far. Detect iframe and use setView instead.
  const inIframe = window.self !== window.top;
  if (inIframe) {
    // Iframe is 2000px tall but only the phone screen is visible.
    // Resize map to real screen height, then fitBounds.
    const mapEl = map.getContainer();
    const screenH = screen.availHeight || screen.height || 900;
    mapEl.style.height = screenH + 'px';
    map.invalidateSize({ animate: false });
    map.fitBounds(utahBounds, { padding: [10, 10], animate: true, duration: 1.0 });
  } else {
    map.fitBounds(utahBounds, {
      padding: [10, 10],
      animate: true,
      duration: 1.0
    });
  }
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
    // Track color change
    trackEvent('color_changed', { type: 'population', color: 'tint', value: input.value });
  });
};

const bindParcelContourColors = () => {
  const parcelInput = document.getElementById("color-parcels");
  if (parcelInput) {
    parcelInput.value = styleState.lineColors.parcels || "#888888";
    parcelInput.addEventListener("input", () => {
      styleState.lineColors.parcels = parcelInput.value;
      persistColors();
      // Update existing parcel layers with new color
      parcelLayer.eachLayer((group) => {
        if (group.setStyle) group.setStyle({ color: parcelInput.value });
      });
      trackEvent('color_changed', { type: 'parcels', value: parcelInput.value });
    });
  }

  const contourInput = document.getElementById("color-contours");
  if (contourInput) {
    contourInput.value = styleState.lineColors.contours || "#8B4513";
    contourInput.addEventListener("input", () => {
      styleState.lineColors.contours = contourInput.value;
      persistColors();
      contourLayer.eachLayer((group) => {
        if (group.setStyle) group.setStyle({ color: contourInput.value });
      });
      trackEvent('color_changed', { type: 'contours', value: contourInput.value });
    });
  }
};

const tileNames = {
  osm: "Open Street Map",
  opentopo: "OpenTopoMap",
  "carto-light": "Carto Light",
  "carto-voyager": "Carto Voyager",
  "carto-dark": "Carto Dark",
  "osm-hot": "OSM Humanitarian"
};

const updateTileCaption = (styleKey) => {
  const caption = document.getElementById("tile-caption");
  if (caption) caption.textContent = tileNames[styleKey] ?? styleKey;
};

const bindTileStylePicker = () => {
  const select = document.getElementById("tile-style-select");
  if (!select) return;
  select.value = uiState.tileStyle ?? "osm";
  updateTileCaption(select.value);
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
    updateTileCaption(styleKey);
    // Track tile source change
    trackEvent('tile_source_changed', { source: styleKey });
  });
};

const bindLineControls = (parties) => {
  const widthInput = document.getElementById("line-width");
  const opacityInput = document.getElementById("line-opacity");
  const fillOpacityInput = document.getElementById("fill-opacity");

  if (widthInput) {
    widthInput.value = String(storedUi.widthSlider ?? 0.57);
    widthInput.addEventListener("input", () => {
      const t = parseFloat(widthInput.value);
      styleState.lineWidth = expScale(t, widthRange.min, widthRange.max, widthRange.exponent);
      persistUi({ widthSlider: t });
      refreshPartyFill(parties);
    });
    styleState.lineWidth = expScale(parseFloat(widthInput.value), widthRange.min, widthRange.max, widthRange.exponent);
  }

  if (opacityInput) {
    opacityInput.value = String(storedUi.opacitySlider ?? 0.83);
    opacityInput.addEventListener("input", () => {
      const t = parseFloat(opacityInput.value);
      styleState.lineOpacity = expScale(t, opacityRange.min, opacityRange.max, opacityRange.exponent);
      persistUi({ opacitySlider: t });
      refreshPartyFill(parties);
    });
    styleState.lineOpacity = expScale(parseFloat(opacityInput.value), opacityRange.min, opacityRange.max, opacityRange.exponent);
  }

  if (fillOpacityInput) {
    fillOpacityInput.value = String(storedUi.fillOpacity ?? 0.58);
    fillOpacityInput.addEventListener("input", () => {
      styleState.fillOpacity = parseFloat(fillOpacityInput.value);
      persistUi({ fillOpacity: styleState.fillOpacity });
      refreshPartyFill(parties);
    });
    styleState.fillOpacity = parseFloat(fillOpacityInput.value);
  }
};

const init = async () => {
  const [boundary, house, senate, congressCurrent, congressFuture, parties, countyBounds] = await Promise.all([
    loadJson("data/utah_boundary.geojson"),
    loadJson("data/utah_house_2022.geojson"),
    loadJson("data/utah_senate_2022.geojson"),
    loadJson("data/utah_congress_2022.geojson"),
    loadJson("data/utah_congress_2026.geojson"),
    loadJson("data/utah_parties.json"),
    loadJson("data/utah_county_bounds.json")
  ]);
  countyBoundsData = countyBounds;

  layerState.boundary = L.geoJSON(boundary, { style: boundaryStyle }).addTo(map);
  if (!storedView) {
    map.fitBounds(layerState.boundary.getBounds(), { padding: [20, 20] });
  }

  const buildCombinedPopup = (latlng) => {
    const point = [latlng.lng, latlng.lat];
    const sections = [];
    const checkLayer = (layerGroup, label, partyMap, districtProp, suffix) => {
      if (!layerGroup || !map.hasLayer(layerGroup)) return;
      layerGroup.eachLayer((sublayer) => {
        if (!sublayer.feature) return;
        if (pointInGeometry(point, sublayer.feature.geometry)) {
          const district = String(sublayer.feature.properties[districtProp]);
          const info = partyMap?.[district];
          const partyLabel = info?.party || "Unknown";
          const nameLabel = info?.name && info.name !== "TBD" ? ` — ${info.name}` : "";
          sections.push(`${label} ${district}${suffix}<br />${partyLabel}${nameLabel}`);
        }
      });
    };
    checkLayer(layerState.house, "House District", parties.house, "DIST", "");
    checkLayer(layerState.senate, "Senate District", parties.senate, "DIST", "");
    checkLayer(layerState.congressCurrent, "Federal House District", parties.congress_current, "DISTRICT", "");
    checkLayer(layerState.congressFuture, "Federal House District", parties.congress_future, "DISTRICT", " (coming)");
    return sections.length > 0 ? sections.join('<hr style="margin:6px 0;border:none;border-top:1px solid #ddd">') : null;
  };

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
      const popupContent = `House District ${district}<br />${partyLabel}${nameLabel}`;
      layer.on('click', (e) => {
        const content = styleState.partyFill ? buildCombinedPopup(e.latlng) : popupContent;
        if (content) L.popup().setLatLng(e.latlng).setContent(content).openOn(map);
        trackEvent('district_click', { type: 'house', district: district });
      });
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
      const popupContent = `Senate District ${district}<br />${partyLabel}${nameLabel}`;
      layer.on('click', (e) => {
        const content = styleState.partyFill ? buildCombinedPopup(e.latlng) : popupContent;
        if (content) L.popup().setLatLng(e.latlng).setContent(content).openOn(map);
        trackEvent('district_click', { type: 'senate', district: district });
      });
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
      const popupContent = `Federal House District ${district}<br />${partyLabel}${nameLabel}`;
      layer.on('click', (e) => {
        const content = styleState.partyFill ? buildCombinedPopup(e.latlng) : popupContent;
        if (content) L.popup().setLatLng(e.latlng).setContent(content).openOn(map);
        trackEvent('district_click', { type: 'congress_current', district: district });
      });
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
      const popupContent = `Federal House District ${district} (coming)<br />${partyLabel}${nameLabel}`;
      layer.on('click', (e) => {
        const content = styleState.partyFill ? buildCombinedPopup(e.latlng) : popupContent;
        if (content) L.popup().setLatLng(e.latlng).setContent(content).openOn(map);
        trackEvent('district_click', { type: 'congress_future', district: district });
      });
    }
  });

  const toggleConfig = [
    { id: "toggle-boundary", key: "boundary" },
    { id: "toggle-tiles", key: "tiles" },
    { id: "toggle-population", key: "population" },
    { id: "toggle-house", key: "house" },
    { id: "toggle-senate", key: "senate" },
    { id: "toggle-congress-current", key: "congressCurrent" },
    { id: "toggle-congress-future", key: "congressFuture" },
    { id: "toggle-parcels", key: "parcels" },
    { id: "toggle-contours", key: "contours" }
  ];

  toggleConfig.forEach(({ id, key }) => {
    const checkbox = document.getElementById(id);
    if (!checkbox) return;
    if (storedUi.toggles && typeof storedUi.toggles[id] === "boolean") {
      checkbox.checked = storedUi.toggles[id];
    }
    attachToggle(id, key);
    // Parcels and contours use pane visibility, not add/remove
    if (key === "parcels") {
      parcelLayer.addTo(map);
      if (checkbox.checked) {
        parcelState.enabled = true;
        parcelPane.style.display = "";
        loadParcelsForView().catch(err => console.error("Parcel load:", err));
      } else {
        parcelPane.style.display = "none";
      }
    } else if (key === "contours") {
      contourLayer.addTo(map);
      if (checkbox.checked) {
        contourState.enabled = true;
        contourPane.style.display = "";
        loadContoursForView().catch(err => console.error("Contour load:", err));
      } else {
        contourPane.style.display = "none";
      }
    } else if (!checkbox.checked) {
      map.removeLayer(layerState[key]);
    } else if (!map.hasLayer(layerState[key])) {
      layerState[key].addTo(map);
    }
    // Background load is started separately in init, don't call here
  });

  // Show "Other / Unknown" legend row only when congress-future is enabled
  const otherRow = document.getElementById("other-legend-row");
  const congressFutureToggle = document.getElementById("toggle-congress-future");
  const syncOtherRow = () => {
    if (otherRow) otherRow.classList.toggle("show", congressFutureToggle?.checked);
  };
  syncOtherRow();
  if (congressFutureToggle) congressFutureToggle.addEventListener("change", syncOtherRow);

  const partyFillToggle = document.getElementById("toggle-party-fill");
  if (partyFillToggle) {
    partyFillToggle.checked = styleState.partyFill;
    partyFillToggle.addEventListener("change", () => {
      styleState.partyFill = partyFillToggle.checked;
      persistUi({ partyFill: styleState.partyFill });
      refreshPartyFill(parties);
    });
  }

  // Set initial pointer-events based on party fill state
  bindColorPickers(parties);
  bindLineControls(parties);
  bindPopulationColor();
  bindParcelContourColors();
  bindTileStylePicker();

  // Render after all controls are bound and styleState is set from HTML inputs
  refreshPartyFill(parties);

  // Tile swatch opens Appearance group and focuses tile dropdown
  const tileSwatch = document.getElementById("tile-swatch");
  if (tileSwatch) {
    tileSwatch.addEventListener("click", () => {
      const details = document.querySelector(".appearance-group");
      if (details) {
        details.open = true;
        const tileSelect = document.getElementById("tile-style-select");
        if (tileSelect) tileSelect.focus();
      }
    });
  }

  // Bind recenter map button
  const recenterMapBtn = document.getElementById("recenter-map-btn");
  if (recenterMapBtn) {
    recenterMapBtn.addEventListener("click", () => {
      recenterMap(parties);
    });
  }

  // Start loading population data in background for instant toggle
  const bgStatus = document.getElementById("population-status");
  if (bgStatus) bgStatus.textContent = "preloading...";
  loadPopulationPoints().then(() => {
    console.log('Background population preload complete');
  }).catch((error) => {
    console.error('Background population load failed:', error);
    if (bgStatus) bgStatus.textContent = String(error.message || error).substring(0, 60);
  });

  const panel = document.getElementById("controls");
  const panelToggle = document.getElementById("panel-toggle");
  if (panel && panelToggle) {
    panelToggle.addEventListener("click", () => {
      panel.classList.toggle("collapsed");
      const collapsed = panel.classList.contains("collapsed");
      panelToggle.setAttribute("aria-expanded", String(!collapsed));
      updateToggleDirection();
      // Track panel toggle
      trackEvent('panel_toggle', { expanded: !collapsed });
    });
  }

  // Start collapsed on mobile so users see the full map + FAB
  // Use matchMedia (CSS pixels) instead of innerWidth (device pixels on some phones)
  if (panel && window.matchMedia("(max-width: 480px)").matches) {
    panel.classList.add("collapsed");
  }

  // Mobile FAB click handler - opens the control panel
  const fab = document.getElementById("mobile-fab");
  if (fab && panel) {
    fab.addEventListener("click", () => {
      panel.classList.remove("collapsed");
      trackEvent("fab_open_panel");
    });
  }

  // Mobile close button handler - collapses the control panel
  const panelCloseBtn = document.getElementById("panel-close-btn");
  if (panelCloseBtn && panel) {
    panelCloseBtn.addEventListener("click", () => {
      panel.classList.add("collapsed");
      trackEvent("panel_close_btn");
    });
  }

  // Corner rotation button
  const cornerBtn = document.getElementById("panel-corner-btn");
  if (cornerBtn) {
    cornerBtn.addEventListener("click", rotateCorner);
  }

  // Load saved corner position
  loadCornerPosition();

  // Mobile touch gesture handling for bottom sheet panel
  const dragHandle = document.querySelector(".panel-drag-handle");
  if (panel && dragHandle) {
    let touchStartY = 0;
    let touchStartTime = 0;
    let isDragging = false;

    // Check if we're on mobile viewport (use matchMedia for CSS pixels, not device pixels)
    const isMobile = () => window.matchMedia("(max-width: 480px)").matches;

    // Handle touch start
    dragHandle.addEventListener("touchstart", (e) => {
      if (!isMobile()) return;

      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isDragging = true;
    }, { passive: true });

    // Handle touch move
    dragHandle.addEventListener("touchmove", (e) => {
      if (!isMobile() || !isDragging) return;

      // Prevent default scroll behavior during swipe
      e.preventDefault();
    }, { passive: false });

    // Handle touch end
    dragHandle.addEventListener("touchend", (e) => {
      if (!isMobile() || !isDragging) return;

      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const deltaY = touchEndY - touchStartY;
      const deltaTime = touchEndTime - touchStartTime;
      const velocity = Math.abs(deltaY) / deltaTime;

      isDragging = false;

      // Threshold: 50px swipe or fast velocity
      const swipeThreshold = 50;
      const velocityThreshold = 0.5; // px/ms

      const isSwipeUp = deltaY < -swipeThreshold || (deltaY < -20 && velocity > velocityThreshold);
      const isSwipeDown = deltaY > swipeThreshold || (deltaY > 20 && velocity > velocityThreshold);

      if (isSwipeUp && panel.classList.contains("collapsed")) {
        // Swipe up: expand panel
        panel.classList.remove("collapsed");
        trackEvent("panel_swipe_expand");
      } else if (isSwipeDown && !panel.classList.contains("collapsed")) {
        // Swipe down: collapse panel
        panel.classList.add("collapsed");
        trackEvent("panel_swipe_collapse");
      }

      // Reset
      touchStartY = 0;
      touchStartTime = 0;
    }, { passive: true });

    // Handle touch cancel
    dragHandle.addEventListener("touchcancel", () => {
      isDragging = false;
      touchStartY = 0;
      touchStartTime = 0;
    }, { passive: true });

    // Make drag handle tappable to toggle
    dragHandle.addEventListener("click", () => {
      if (!isMobile()) return;

      const wasCollapsed = panel.classList.toggle("collapsed");
      trackEvent(wasCollapsed ? "panel_tap_collapse" : "panel_tap_expand");
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

  // Debounced zoom tracking
  let zoomTrackTimeout = null;
  map.on("zoomend", () => {
    clearTimeout(zoomTrackTimeout);
    zoomTrackTimeout = setTimeout(() => {
      trackEvent('map_zoom', { zoom_level: map.getZoom() });
    }, 300);
  });

  storeView();
  map.on("moveend", storeView);
  map.on("zoomend", storeView);

  // Viewport-driven loading for parcels and contours
  map.on("moveend", () => {
    debouncedParcelLoad();
    debouncedContourLoad();
  });
  map.on("zoomend", () => {
    debouncedParcelLoad();
    debouncedContourLoad();
  });
};

init().catch((error) => {
  console.error(error);
  const panel = document.getElementById("controls");
  const errorDiv = document.createElement("div");
  errorDiv.className = "panel-section";
  errorDiv.textContent = "Failed to load data. Check the console for details.";
  panel.appendChild(errorDiv);
});

// Localhost detection and Save Defaults functionality
const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

if (isLocalhost) {
  document.body.classList.add('is-localhost');
}

const getCurrentDefaults = () => ({
  colors: {
    party: { ...colorConfig.party },
    outline: { ...colorConfig.outline, boundary: colorConfig.outline.boundary }
  },
  layers: {
    boundary: document.getElementById('toggle-boundary')?.checked ?? true,
    tiles: document.getElementById('toggle-tiles')?.checked ?? true,
    population: document.getElementById('toggle-population')?.checked ?? false,
    house: document.getElementById('toggle-house')?.checked ?? true,
    senate: document.getElementById('toggle-senate')?.checked ?? true,
    congressCurrent: document.getElementById('toggle-congress-current')?.checked ?? true,
    congressFuture: document.getElementById('toggle-congress-future')?.checked ?? false,
    partyFill: document.getElementById('toggle-party-fill')?.checked ?? true
  },
  sliders: {
    lineWidth: document.getElementById('line-width')?.value ?? '0.57',
    lineOpacity: document.getElementById('line-opacity')?.value ?? '0.83',
    fillOpacity: document.getElementById('fill-opacity')?.value ?? '0.58'
  },
  tileStyle: document.getElementById('tile-style-select')?.value ?? 'osm',
  populationColor: document.getElementById('color-population')?.value ?? '#ff0000'
});

const saveDefaults = (target) => {
  const defaults = getCurrentDefaults();
  const json = JSON.stringify(defaults, null, 2);
  
  console.log(`\n========== DEFAULTS FOR ${target.toUpperCase()} ==========`);
  console.log(json);
  console.log(`========== END DEFAULTS ==========\n`);
  
  // Try to show modal
  try {
    let modal = document.getElementById('defaults-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'defaults-modal';
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;font-family:system-ui;';
      modal.innerHTML = `
        <div style="background:white;border-radius:10px;padding:20px;max-width:600px;max-height:80vh;overflow:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
          <h3 style="margin:0 0 10px 0;font-size:16px;font-weight:600;">Defaults for ${target}</h3>
          <p style="margin:0 0 10px 0;font-size:12px;color:#666;">Copy this and share with Claude to deploy:</p>
          <textarea id="defaults-json" readonly style="width:100%;height:300px;font-family:'Courier New', monospace;font-size:11px;padding:8px;border:1px solid #ccc;border-radius:4px;resize:none;"></textarea>
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button id="copy-defaults-btn" style="flex:1;padding:10px;background:#3b6ea5;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:14px;">Copy</button>
            <button id="close-defaults-modal" style="flex:1;padding:10px;background:#e0e0e0;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:14px;">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      document.getElementById('copy-defaults-btn').addEventListener('click', () => {
        const textarea = document.getElementById('defaults-json');
        textarea.select();
        try {
          document.execCommand('copy');
          alert('✓ Copied to clipboard!');
        } catch (err) {
          alert('Copy failed - please highlight and copy manually');
        }
      });
      
      document.getElementById('close-defaults-modal').addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
    
    document.getElementById('defaults-json').value = json;
    modal.style.display = 'flex';
  } catch (err) {
    console.error('Modal error:', err);
    // Fallback: just alert the user to check console
    alert(`Defaults for ${target} saved to console. Press Ctrl+Shift+J (or F12) to view.`);
  }
  
  trackEvent('save_defaults', { target });
};

// Expose for debugging
window.getCurrentDefaults = getCurrentDefaults;
window.saveDefaults = saveDefaults;

// Bind save defaults buttons
window.addEventListener('load', () => {
  const saveBtn = document.getElementById('save-defaults-btn');
  const dropdown = document.getElementById('save-defaults-dropdown');
  const saveLocal = document.getElementById('save-local');
  const saveDeployed = document.getElementById('save-deployed');

  if (saveBtn && dropdown) {
    saveBtn.addEventListener('click', () => {
      dropdown.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!saveBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }

  if (saveLocal) {
    saveLocal.addEventListener('click', () => {
      saveDefaults('local');
      dropdown?.classList.remove('open');
    });
  }

  if (saveDeployed) {
    saveDeployed.addEventListener('click', () => {
      saveDefaults('deployed');
      dropdown?.classList.remove('open');
    });
  }
});

// Tour initialization
// Wait for tour.js to load and map to be initialized
window.addEventListener('load', () => {
  // Give a small delay to ensure all scripts are fully loaded
  setTimeout(() => {
    if (typeof TourController !== 'undefined' && typeof tourSteps !== 'undefined' && window.map && window.layerState) {
      // Initialize tour controller
      const tour = new TourController(window.map, window.layerState);

      // Expose for debugging
      window.tour = tour;

      // Bind "Take Tour" button
      const tourBtn = document.getElementById('tour-btn');
      if (tourBtn) {
        tourBtn.addEventListener('click', () => {
          console.log('Tour button clicked, isActive:', tour.isActive);
          try {
            tour.start();
            console.log('Tour started, overlay:', !!document.getElementById('tour-overlay'));
          } catch (err) {
            console.error('Tour start error:', err);
          }
        });
      } else {
        console.warn('Tour button not found');
      }

      // Auto-start tour for first-time visitors
      if (tour.shouldShowTour()) {
        // Wait a bit longer for first-time users to see the map
        setTimeout(() => {
          tour.start();

          // Track auto-start
          if (typeof trackEvent !== 'undefined') {
            trackEvent('tour_auto_started');
          }
        }, 1500);
      }
    } else {
      console.warn('Tour system not available:', {
        TourController: typeof TourController,
        tourSteps: typeof tourSteps,
        map: !!window.map,
        layerState: !!window.layerState
      });
    }
  }, 500);
});
