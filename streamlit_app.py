import streamlit as st

st.set_page_config(
    page_title="Utah Political Layers",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide Streamlit chrome and maximize map space
hide_streamlit_style = """
<style>
    header {display: none !important}
    footer {display: none !important}
    #MainMenu {display: none !important}
    [data-testid="stSidebar"] {display: none !important}
    aside {display: none !important}
    section {background: transparent !important; padding: 0 !important; margin: 0 !important; width: 100% !important}
    .stMainBlockContainer {padding: 0 !important; margin: 0 !important; height: 100vh !important; overflow: visible !important; width: 100% !important}
    .appViewContainer {padding: 0 !important; margin: 0 !important; width: 100% !important}
    .stElementContainer {padding: 0 !important; margin: 0 !important}
    main {padding: 0 !important; margin: 0 !important; width: 100% !important}
    [data-testid="stAppViewContainer"] {padding: 0 !important; overflow: visible !important; width: 100% !important}
    div[data-testid="stVerticalBlock"] > [data-testid="stElementContainer"] {padding: 0 !important}
    [data-testid="manage-app-button"] {display: none !important}
    button[class*="terminal" i] {display: none !important}
    button[class*="Manage"] {display: none !important}
    [class*="StateContainer"] {height: 100vh !important; max-height: 100vh !important; overflow: visible !important; width: 100% !important}
    body {background: white !important}
    html {background: white !important}
</style>
"""
st.markdown(hide_streamlit_style, unsafe_allow_html=True)

# Base URL for raw data files from GitHub
DATA_BASE_URL = "https://raw.githubusercontent.com/kpkpkp/utah-political-layers/main/docs/data"

# Build the complete HTML with inlined CSS and JS
html_content = f'''
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Utah House & Senate Districts - Party Map</title>
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <style>
/* ===== Main Styles ===== */
* {{
  box-sizing: border-box;
}}

body {{
  margin: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: #1b1b1b;
}}

.app {{
  position: relative;
  min-height: 100vh;
}}

.header {{
  display: none;
}}

#map {{
  height: 100vh;
  width: 100%;
  overflow: visible !important;
  position: relative;
}}

.panel {{
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  padding: 14px 16px;
  min-width: 220px;
  width: 230px;
  font-size: 13px;
  transition: transform 0.2s ease;
}}

.control-panel {{
  width: 220px;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    "header"
    "layers"
    "legend"
    "footer"
    "save";
  gap: 12px;
}}

.panel.collapsed {{
  transform: translateX(calc(100% - 28px));
}}

.panel-toggle {{
  position: absolute;
  top: 8px;
  left: -16px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid #d0d0d0;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}}

.panel-header {{
  grid-area: header;
  display: flex;
  flex-direction: column;
  gap: 8px;
}}

.panel-layers {{
  grid-area: layers;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #efefef;
  padding-bottom: 8px;
  overflow: hidden;
}}

.panel-legend {{
  grid-area: legend;
  display: flex;
  flex-direction: column;
}}

.panel-footer {{
  grid-area: footer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}}

.panel-save-defaults {{
  grid-area: save;
  display: flex;
  flex-direction: column;
  position: relative;
}}

.panel-save-defaults.localhost-only {{
  display: none;
}}

body.is-localhost .panel-save-defaults.localhost-only {{
  display: flex;
}}

.panel-title {{
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 8px;
  color: #3f3f3f;
}}

.toggle {{
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  cursor: pointer;
  font-size: 12px;
}}

.toggle input {{
  accent-color: #3b6ea5;
  flex-shrink: 0;
}}

.note {{
  margin-top: 6px;
  color: #6b6b6b;
  font-size: 12px;
  line-height: 1.3;
}}

.layer-row {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 4px;
}}

.layer-row .toggle {{
  margin-bottom: 0;
  flex: 1;
}}

.layer-row input[type="color"] {{
  border: none;
  background: transparent;
  width: 28px;
  height: 22px;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}}

.tile-select {{
  width: auto;
  min-width: 70px;
  max-width: 85px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #bdbdbd;
  background: #ffffff;
  padding: 0 2px;
  font-size: 10px;
  cursor: pointer;
  flex-shrink: 1;
}}

.population-tooltip {{
  background: #ffffff;
  border: 1px solid #c9c9c9;
  border-radius: 6px;
  color: #1b1b1b;
  padding: 6px 8px;
  font-size: 12px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
}}

.leaflet-interactive {{
  outline: none;
}}

.slider-row {{
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}}

.slider-row label {{
  color: #3f3f3f;
  font-size: 11px;
}}

.slider-row input[type="range"] {{
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}}

.legend {{
  display: flex;
  flex-direction: column;
  gap: 5px;
}}

.legend-row {{
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}}

.swatch {{
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}}

.swatch.republican {{
  background: #d73027;
}}

.swatch.democrat {{
  background: #4575b4;
}}

.swatch.forward {{
  background: #8b5cf6;
}}

.swatch.other {{
  background: #9e9e9e;
}}

.leaflet-bottom-left {{
  position: absolute !important;
  bottom: 10px !important;
  left: 10px !important;
  z-index: 999 !important;
  visibility: visible !important;
  display: flex !important;
  flex-direction: column-reverse !important;
  gap: 5px !important;
}}

.leaflet-control {{
  z-index: 999 !important;
  visibility: visible !important;
  display: block !important;
  opacity: 1 !important;
}}

.leaflet-control-zoom {{
  position: relative !important;
  background: white !important;
  border: 2px solid #777 !important;
  border-radius: 4px !important;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.65) !important;
}}

.leaflet-control-scale {{
  position: relative !important;
  background: white !important;
  padding: 5px !important;
  border: 2px solid #777 !important;
  border-radius: 4px !important;
  font-size: 12px !important;
}}

.reset-colors-btn {{
  padding: 8px 10px;
  border: 1px solid #bdbdbd;
  border-radius: 6px;
  background: #ffffff;
  color: #3b6ea5;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}}

.reset-colors-btn:hover {{
  background: #f5f5f5;
  border-color: #3b6ea5;
}}

.tour-btn {{
  width: auto;
  flex: 0 0 auto;
  padding: 8px 14px;
  margin: 0;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}}

.tour-btn:hover {{
  background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
  transform: translateY(-1px);
}}

.fill-toggle {{
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #efefef;
}}

.population-status {{
  font-size: 10px;
  color: #6b6b6b;
  white-space: nowrap;
}}

.save-defaults-btn {{
  width: 100%;
  padding: 8px 14px;
  background: #f5f5f5;
  color: #3f3f3f;
  border: 1px solid #bdbdbd;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}}

.save-defaults-dropdown {{
  display: none;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}}

.save-defaults-dropdown.open {{
  display: flex;
}}

.save-option {{
  width: 100%;
  padding: 8px 12px;
  background: #ffffff;
  color: #3f3f3f;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}}

/* Mobile Responsiveness */
@media (max-width: 480px) {{
  .control-panel {{
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 60vh;
    min-width: unset;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
    padding: 8px 16px 16px;
    transform: translateY(0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }}

  .panel-save-defaults {{
    display: none !important;
  }}

  .panel-footer {{
    flex-direction: column;
    gap: 8px;
  }}

  .panel-footer .tour-btn,
  .panel-footer .reset-colors-btn {{
    width: 100%;
  }}

  .panel-toggle {{
    display: none;
  }}

  .panel-drag-handle {{
    width: 40px;
    height: 4px;
    background: #d0d0d0;
    border-radius: 2px;
    margin: 8px auto 12px;
    cursor: grab;
  }}

  .control-panel.collapsed {{
    transform: translateY(calc(100% - 48px)) !important;
  }}
}}

/* ===== Tour Styles ===== */
.tour-overlay {{
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 9998;
  pointer-events: none;
}}

@keyframes tour-overlay-fade-in {{
  from {{ opacity: 0; }}
  to {{ opacity: 1; }}
}}

.tour-callout {{
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  padding: 24px;
  z-index: 9999;
  max-width: 500px;
  min-width: 320px;
  animation: tour-callout-slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}}

@keyframes tour-callout-slide-in {{
  from {{ opacity: 0; transform: translateY(-20px) scale(0.95); }}
  to {{ opacity: 1; transform: translateY(0) scale(1); }}
}}

.tour-position-center {{ top: 50%; left: 50%; transform: translate(-50%, -50%); }}
.tour-position-top {{ top: 80px; left: 50%; transform: translateX(-50%); }}
.tour-position-bottom {{ bottom: 80px; left: 50%; transform: translateX(-50%); }}
.tour-position-left {{ top: 50%; left: 80px; transform: translateY(-50%); }}
.tour-position-right {{ top: 50%; right: 80px; transform: translateY(-50%); }}
.tour-position-top-left {{ top: 80px; left: 80px; }}
.tour-position-top-right {{ top: 80px; right: 80px; }}
.tour-position-bottom-left {{ bottom: 80px; left: 80px; }}
.tour-position-bottom-right {{ bottom: 80px; right: 80px; }}

@media (max-width: 768px) {{
  .tour-callout {{
    position: fixed;
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    transform: none !important;
    max-width: none;
    border-radius: 12px 12px 0 0;
    max-height: 70vh;
    overflow-y: auto;
  }}
}}

.tour-progress {{
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  font-weight: 600;
}}

.tour-title {{
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 16px 0;
  line-height: 1.3;
}}

.tour-content {{
  font-size: 15px;
  line-height: 1.6;
  color: #34495e;
  margin-bottom: 24px;
}}

.tour-content p {{ margin: 0 0 12px 0; }}
.tour-content p:last-child {{ margin-bottom: 0; }}
.tour-content ul {{ margin: 8px 0 12px 0; padding-left: 24px; }}
.tour-content li {{ margin: 6px 0; }}
.tour-content strong {{ color: #2c3e50; font-weight: 600; }}

.tour-buttons {{
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
}}

.tour-button {{
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}}

.tour-button:hover {{
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}}

.tour-next {{ background: #3498db; color: white; }}
.tour-next:hover {{ background: #2980b9; }}

.tour-prev {{ background: #95a5a6; color: white; }}
.tour-prev:hover {{ background: #7f8c8d; }}

.tour-skip {{
  background: transparent;
  color: #7f8c8d;
  margin-right: auto;
  padding: 10px 16px;
  border: 1px solid #bdc3c7;
}}

.tour-skip:hover {{
  background: #ecf0f1;
  color: #2c3e50;
  border-color: #95a5a6;
}}

.tour-highlight {{
  position: relative;
  z-index: 10000 !important;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.6),
              0 0 0 8px rgba(52, 152, 219, 0.3),
              0 8px 24px rgba(0, 0, 0, 0.2);
  animation: tour-highlight-pulse 2s ease-in-out infinite;
}}

@keyframes tour-highlight-pulse {{
  0%, 100% {{
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.6),
                0 0 0 8px rgba(52, 152, 219, 0.3),
                0 8px 24px rgba(0, 0, 0, 0.2);
  }}
  50% {{
    box-shadow: 0 0 0 6px rgba(52, 152, 219, 0.8),
                0 0 0 12px rgba(52, 152, 219, 0.4),
                0 12px 32px rgba(0, 0, 0, 0.3);
  }}
}}
  </style>
</head>
<body>
  <div class="app">
    <div id="map"></div>

    <aside class="panel control-panel" id="controls">
      <div class="panel-drag-handle" aria-hidden="true"></div>
      <button class="panel-toggle" id="panel-toggle">◀</button>

      <div class="panel-header">
        <div class="panel-title">Utah Political Layers</div>
      </div>

      <div class="panel-layers">
        <div class="panel-title">Layers</div>
        <label class="toggle">
          <input type="checkbox" id="toggle-boundary" checked />
          <span>Utah boundary</span>
        </label>
        <div class="layer-row">
          <label class="toggle">
            <input type="checkbox" id="toggle-tiles" checked />
            <span>Map tiles</span>
          </label>
          <select class="tile-select" id="tile-style-select" aria-label="Map tile style">
            <option value="osm">OSM</option>
            <option value="carto-light">Carto Light</option>
            <option value="carto-voyager">Carto Voyager</option>
            <option value="carto-dark">Carto Dark</option>
            <option value="osm-hot">OSM HOT</option>
            <option value="opentopo">OpenTopoMap</option>
          </select>
        </div>
        <div class="layer-row">
          <input type="color" id="color-population" value="#8b6bff" aria-label="Population color" />
          <label class="toggle">
            <input type="checkbox" id="toggle-population" />
            <span>Population</span>
          </label>
          <span class="population-status" id="population-status"></span>
        </div>
        <div class="layer-row">
          <input type="color" id="outline-color-house" value="#ff6f00" aria-label="House outline color" />
          <label class="toggle">
            <input type="checkbox" id="toggle-house" />
            <span>House</span>
          </label>
        </div>
        <div class="layer-row">
          <input type="color" id="outline-color-senate" value="#66777f" aria-label="Senate outline color" />
          <label class="toggle">
            <input type="checkbox" id="toggle-senate" />
            <span>Senate</span>
          </label>
        </div>
        <div class="layer-row">
          <input type="color" id="outline-color-congress-current" value="#fbd037" aria-label="Congress current outline color" />
          <label class="toggle">
            <input type="checkbox" id="toggle-congress-current" checked />
            <span>Congress (current)</span>
          </label>
        </div>
        <div class="layer-row">
          <input type="color" id="outline-color-congress-future" value="#f68a0e" aria-label="Congress coming outline color" />
          <label class="toggle">
            <input type="checkbox" id="toggle-congress-future" />
            <span>Congress (coming)</span>
          </label>
        </div>
        <div class="note">Coming districts have unknown party.</div>
        <div class="slider-row">
          <label for="line-width">Line width</label>
          <input type="range" id="line-width" min="0" max="1" step="0.01" value="0.83" />
        </div>
        <div class="slider-row">
          <label for="line-opacity">Line opacity</label>
          <input type="range" id="line-opacity" min="0" max="1" step="0.01" value="1" />
        </div>
      </div>

      <div class="panel-legend">
        <div class="panel-title">Party Legend</div>
        <div class="legend">
          <div class="legend-row"><span class="swatch republican"></span>Republican</div>
          <div class="legend-row"><span class="swatch democrat"></span>Democratic</div>
          <div class="legend-row"><span class="swatch forward"></span>Forward</div>
          <div class="legend-row"><span class="swatch other"></span>Other / Unknown</div>
        </div>
        <label class="toggle fill-toggle">
          <input type="checkbox" id="toggle-party-fill" />
          <span>Fill on map</span>
        </label>
      </div>

      <div class="panel-footer">
        <button class="tour-btn" id="tour-btn">Take Tour</button>
        <button class="reset-colors-btn" id="reset-colors-btn">Reset to Defaults</button>
      </div>
      <div class="panel-save-defaults localhost-only" id="save-defaults-container">
        <button class="save-defaults-btn" id="save-defaults-btn">Save as Defaults</button>
        <div class="save-defaults-dropdown" id="save-defaults-dropdown">
          <button class="save-option" id="save-local">Save for Local</button>
          <button class="save-option" id="save-deployed">Save for Deployed</button>
        </div>
      </div>
    </aside>
  </div>

  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script src="https://unpkg.com/esri-leaflet@3.0.12/dist/esri-leaflet.js"></script>
  <script>
// Data base URL for raw GitHub files
const DATA_BASE_URL = "{DATA_BASE_URL}";

// Google Analytics 4 tracking helper (noop for Streamlit)
const trackEvent = (eventName, params = {{}}) => {{}};

const MAP_VIEW_STORAGE_KEY = "utah-map-view";
const POP_POINT_CACHE_KEY = "utah-pop-point-cache";
const POP_POINT_CACHE_VERSION_KEY = "utah-pop-point-cache-version";
const POP_POINT_CACHE_VERSION = 2;

const loadStoredView = () => {{
  try {{
    const raw = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.center) || parsed.center.length !== 2) return null;
    if (typeof parsed.zoom !== "number") return null;
    return parsed;
  }} catch (error) {{
    console.warn("Failed to load stored map view", error);
    return null;
  }}
}};

const map = L.map("map", {{
  zoomSnap: 0.25,
  zoomDelta: 0.25,
  zoomControl: false
}});

L.control.zoom({{
  position: 'bottomleft',
  zoomInTitle: 'Zoom in (0.25x)',
  zoomOutTitle: 'Zoom out (0.25x)'
}}).addTo(map);

L.control.scale({{
  position: 'bottomleft',
  imperial: true,
  metric: true
}}).addTo(map);

window.map = map;

const utahBounds = [[37.0, -114.05], [42.0, -109.04]];

const storedView = loadStoredView();
if (storedView) {{
  map.setView(storedView.center, storedView.zoom);
}} else {{
  map.fitBounds(utahBounds, {{ padding: [20, 20] }});
}}

const populationPane = map.createPane("populationPane");
populationPane.style.zIndex = "250";
populationPane.style.pointerEvents = "none";

const populationOutlinePane = map.createPane("populationOutlinePane");
populationOutlinePane.style.zIndex = "260";
populationOutlinePane.style.pointerEvents = "auto";

const populationRenderer = L.canvas({{ padding: 0.5, pane: "populationPane" }});
const populationLayer = L.layerGroup();
let populationHighlight = null;

const enablePopulationCanvasClicks = () => {{
  const canvas = populationPane.querySelector('canvas');
  if (canvas && canvas.style.pointerEvents !== "auto") {{
    canvas.style.pointerEvents = "auto";
    console.log('Enabled pointer-events on population canvas');
  }}
}};

window.populationLayer = populationLayer;
window.populationRenderer = populationRenderer;

const COLOR_CONFIG_STORAGE_KEY = "utah-color-config";

const defaultColorConfig = {{
  party: {{
    republican: "#d73027",
    democratic: "#4575b4",
    forward: "#8b5cf6",
    other: "#9e9e9e"
  }},
  outline: {{
    house: "#ff6f00",
    senate: "#66777f",
    congressCurrent: "#fbd037",
    congressFuture: "#f68a0e"
  }}
}};

const loadColorConfig = () => {{
  try {{
    const raw = localStorage.getItem(COLOR_CONFIG_STORAGE_KEY);
    if (!raw) return {{ ...defaultColorConfig }};
    const parsed = JSON.parse(raw);
    return {{
      party: {{ ...defaultColorConfig.party, ...parsed.party }},
      outline: {{ ...defaultColorConfig.outline, ...parsed.outline }}
    }};
  }} catch (error) {{
    return {{ ...defaultColorConfig }};
  }}
}};

const persistColorConfig = (config) => {{
  try {{
    localStorage.setItem(COLOR_CONFIG_STORAGE_KEY, JSON.stringify(config));
  }} catch (error) {{}}
}};

const updateColorConfig = (updates) => {{
  const current = loadColorConfig();
  const updated = {{
    party: {{ ...current.party, ...updates.party }},
    outline: {{ ...current.outline, ...updates.outline }}
  }};
  persistColorConfig(updated);
  return updated;
}};

const colorConfig = loadColorConfig();

const partyColor = (partyRaw) => {{
  const party = (partyRaw || "").toLowerCase();
  if (party.startsWith("rep")) return colorConfig.party.republican;
  if (party.startsWith("dem")) return colorConfig.party.democratic;
  if (party.startsWith("forward") || party.startsWith("fwd")) return colorConfig.party.forward;
  return colorConfig.party.other;
}};

const boundaryStyle = {{
  color: "#2c3e50",
  weight: 2,
  fillOpacity: 0,
  interactive: false  // Allow clicks to pass through to population dots
}};

const COLOR_STORAGE_KEY = "utah-layer-colors";
const UI_STORAGE_KEY = "utah-view-settings";

// Clear stored settings on Streamlit so hardcoded defaults always apply
localStorage.removeItem(COLOR_STORAGE_KEY);
localStorage.removeItem(UI_STORAGE_KEY);
localStorage.removeItem(COLOR_CONFIG_STORAGE_KEY);

const defaultLineColors = {{
  house: colorConfig.outline.house,
  senate: colorConfig.outline.senate,
  congressCurrent: colorConfig.outline.congressCurrent,
  congressFuture: colorConfig.outline.congressFuture
}};

const loadStoredColors = () => {{
  try {{
    const raw = localStorage.getItem(COLOR_STORAGE_KEY);
    if (!raw) return {{ ...defaultLineColors }};
    return {{ ...defaultLineColors, ...JSON.parse(raw) }};
  }} catch (error) {{
    return {{ ...defaultLineColors }};
  }}
}};

const loadStoredUi = () => {{
  try {{
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return {{}};
    return JSON.parse(raw);
  }} catch (error) {{
    return {{}};
  }}
}};

const storedUi = loadStoredUi();
const uiState = {{ ...storedUi }};
const defaultPopulationColor = "#8b6bff";
let populationTintColor = storedUi.populationColor ?? defaultPopulationColor;
let populationPointCache = null;

const tileSources = {{
  osm: {{
    url: "https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }},
  "carto-light": {{
    url: "https://{{s}}.basemaps.cartocdn.com/light_all/{{z}}/{{x}}/{{y}}{{r}}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19
  }},
  "carto-voyager": {{
    url: "https://{{s}}.basemaps.cartocdn.com/rastertiles/voyager/{{z}}/{{x}}/{{y}}{{r}}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19
  }},
  "carto-dark": {{
    url: "https://{{s}}.basemaps.cartocdn.com/dark_all/{{z}}/{{x}}/{{y}}{{r}}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19
  }},
  "osm-hot": {{
    url: "https://{{s}}.tile.openstreetmap.fr/hot/{{z}}/{{x}}/{{y}}.png",
    attribution: "&copy; OpenStreetMap contributors, HOT",
    maxZoom: 19
  }},
  opentopo: {{
    url: "https://{{s}}.tile.opentopomap.org/{{z}}/{{x}}/{{y}}.png",
    attribution: "&copy; OpenStreetMap contributors, &copy; OpenTopoMap",
    maxZoom: 17
  }}
}};

let baseTiles = null;
const selectedTileStyle = uiState.tileStyle ?? "osm";

const createBaseTiles = (styleKey) =>
  L.tileLayer(tileSources[styleKey].url, {{
    maxZoom: tileSources[styleKey].maxZoom,
    attribution: tileSources[styleKey].attribution
  }});

baseTiles = createBaseTiles(selectedTileStyle).addTo(map);

const populationState = {{
  loaded: false,
  loading: false,
  maxDensity: 1,
  totalCount: 0
}};

const styleState = {{
  partyFill: storedUi.partyFill ?? false,
  lineColors: loadStoredColors(),
  lineWidth: storedUi.lineWidth ?? 1.2,
  lineOpacity: Math.max(0.1, storedUi.lineOpacity ?? 1)
}};

window.styleState = styleState;
window.getColorConfig = loadColorConfig;
window.updateColorConfig = updateColorConfig;

const persistUi = (next = {{}}) => {{
  Object.assign(uiState, next, {{
    partyFill: styleState.partyFill,
    lineWidth: styleState.lineWidth,
    lineOpacity: styleState.lineOpacity
  }});
  localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(uiState));
}};

const persistColors = () => {{
  localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(styleState.lineColors));
}};

const widthRange = {{ min: 0.5, max: 10, exponent: 2 }};
const opacityRange = {{ min: 0.1, max: 1, exponent: 2 }};

const expScale = (t, min, max, exponent) => {{
  const clamped = Math.min(1, Math.max(0, t));
  const scaled = Math.pow(clamped, exponent);
  return min + (max - min) * scaled;
}};

const hexToRgb = (hex) => {{
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return {{ r: 255, g: 0, b: 0 }};
  return {{
    r: parseInt(sanitized.slice(0, 2), 16),
    g: parseInt(sanitized.slice(2, 4), 16),
    b: parseInt(sanitized.slice(4, 6), 16)
  }};
}};

const mixColor = (base, t) => {{
  const clamped = Math.min(1, Math.max(0, t));
  const r = Math.round(255 + (base.r - 255) * clamped);
  const g = Math.round(255 + (base.g - 255) * clamped);
  const b = Math.round(255 + (base.b - 255) * clamped);
  return `rgb(${{r}}, ${{g}}, ${{b}})`;
}};

const lineWeight = (base) => base * styleState.lineWidth;

const withPartyFill = (fillColor, fillOpacity) => ({{
  fill: styleState.partyFill,
  fillColor: styleState.partyFill ? fillColor : fillColor,
  fillOpacity: styleState.partyFill ? fillOpacity : 0
}});

const houseStyle = (party) => ({{
  color: styleState.lineColors.house,
  weight: lineWeight(0.7),
  opacity: styleState.lineOpacity,
  ...withPartyFill(partyColor(party), 0.55)
}});

const senateStyle = (party) => ({{
  color: styleState.lineColors.senate,
  weight: lineWeight(1.2),
  opacity: styleState.lineOpacity,
  ...withPartyFill(partyColor(party), 0.35)
}});

const congressCurrentStyle = (party) => ({{
  color: styleState.lineColors.congressCurrent,
  weight: lineWeight(1.4),
  opacity: styleState.lineOpacity,
  ...withPartyFill(partyColor(party), 0.25)
}});

const congressFutureStyle = (party) => ({{
  color: styleState.lineColors.congressFuture,
  weight: lineWeight(1.2),
  opacity: styleState.lineOpacity,
  dashArray: "6 4",
  ...withPartyFill(partyColor(party), 0.15)
}});

const layerState = {{
  tiles: baseTiles,
  population: populationLayer,
  boundary: null,
  house: null,
  senate: null,
  congressCurrent: null,
  congressFuture: null
}};

window.layerState = layerState;

const loadJson = async (url) => {{
  const response = await fetch(url);
  if (!response.ok) {{
    throw new Error(`Failed to load ${{url}}: ${{response.status}}`);
  }}
  return response.json();
}};

const attachToggle = (checkboxId, layerKey) => {{
  const checkbox = document.getElementById(checkboxId);
  checkbox.addEventListener("change", () => {{
    const layer = layerState[layerKey];
    if (!layer) return;
    if (checkbox.checked) {{
      layer.addTo(map);
      if (layerKey === "population") {{
        // Data is loaded in background - just ensure layer is on map
        // If still loading, the status indicator will show progress
        if (!populationState.loaded && !populationState.loading) {{
          // Fallback: start load if somehow not started
          loadPopulationPoints().catch((error) => console.error(error));
        }}
        // Force redraw if data already loaded
        if (populationState.loaded && populationRenderer && populationRenderer._reset) {{
          populationRenderer._reset();
        }}
        trackEvent('population_toggle', {{ enabled: true }});
      }}
    }} else {{
      map.removeLayer(layer);
    }}
  }});
}};

const setDistrictPointerEvents = () => {{
  const pointerEvents = styleState.partyFill ? "auto" : "stroke";
  [layerState.house, layerState.senate, layerState.congressCurrent, layerState.congressFuture].forEach((layer) => {{
    if (layer) {{
      layer.eachLayer((sublayer) => {{
        if (sublayer._path) {{
          sublayer._path.style.pointerEvents = pointerEvents;
        }}
      }});
    }}
  }});
}};

window.setDistrictPointerEvents = setDistrictPointerEvents;

const refreshPartyFill = (parties) => {{
  const houseLayer = layerState.house;
  const senateLayer = layerState.senate;
  const congressCurrentLayer = layerState.congressCurrent;
  const congressFutureLayer = layerState.congressFuture;

  if (houseLayer) {{
    houseLayer.setStyle((feature) => {{
      const district = String(feature.properties.DIST);
      const info = parties.house[district];
      return houseStyle(info?.party);
    }});
  }}

  if (senateLayer) {{
    senateLayer.setStyle((feature) => {{
      const district = String(feature.properties.DIST);
      const info = parties.senate[district];
      return senateStyle(info?.party);
    }});
  }}

  if (congressCurrentLayer) {{
    congressCurrentLayer.setStyle((feature) => {{
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_current?.[district];
      return congressCurrentStyle(info?.party);
    }});
  }}

  if (congressFutureLayer) {{
    congressFutureLayer.setStyle((feature) => {{
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_future?.[district];
      return congressFutureStyle(info?.party);
    }});
  }}

  requestAnimationFrame(() => {{
    setDistrictPointerEvents();
  }});
}};

const densityScale = (value) => {{
  const max = populationState.maxDensity || 1;
  const t = Math.log(value + 1) / Math.log(max + 1);
  return Math.min(1, Math.max(0, t));
}};

const updatePopulationStyles = () => {{
  const base = hexToRgb(populationTintColor);
  populationLayer.eachLayer((layer) => {{
    if (!layer.options || typeof layer.options.density !== "number") return;
    const t = Math.max(0.25, densityScale(layer.options.density));
    const color = mixColor(base, t);
    layer.setStyle({{
      color: "#444444",
      fillColor: color,
      opacity: styleState.lineOpacity,
      fillOpacity: 0.7
    }});
    const radius = 2 + t * 6;
    layer.setRadius(radius);
  }});
}};

// Simplified population loading functions
const loadPopulationPointCache = () => {{
  if (populationPointCache) return populationPointCache;
  try {{
    const version = Number(localStorage.getItem(POP_POINT_CACHE_VERSION_KEY));
    if (version !== POP_POINT_CACHE_VERSION) {{
      localStorage.removeItem(POP_POINT_CACHE_KEY);
      localStorage.setItem(POP_POINT_CACHE_VERSION_KEY, String(POP_POINT_CACHE_VERSION));
    }}
    const raw = localStorage.getItem(POP_POINT_CACHE_KEY);
    populationPointCache = raw ? JSON.parse(raw) : {{}};
  }} catch (error) {{
    populationPointCache = {{}};
  }}
  return populationPointCache;
}};

const persistPopulationPointCache = () => {{
  try {{
    localStorage.setItem(POP_POINT_CACHE_KEY, JSON.stringify(populationPointCache));
    localStorage.setItem(POP_POINT_CACHE_VERSION_KEY, String(POP_POINT_CACHE_VERSION));
  }} catch (error) {{}}
}};

const ensurePopulationStatus = () => {{
  let status = document.getElementById("population-status");
  return status;
}};

const outerRingsFromGeometry = (geometry) => {{
  if (!geometry) return [];
  const {{ type, coordinates }} = geometry;
  if (type === "Polygon" && coordinates.length) return [coordinates[0]];
  if (type === "MultiPolygon" && coordinates.length) return coordinates.map((polygon) => polygon[0]).filter(Boolean);
  return [];
}};

const pointInRing = (point, ring) => {{
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {{
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }}
  return inside;
}};

const pointInGeometry = (point, geometry) => {{
  const rings = outerRingsFromGeometry(geometry);
  return rings.some((ring) => ring && ring.length && pointInRing(point, ring));
}};

const geometryBounds = (geometry) => {{
  const rings = outerRingsFromGeometry(geometry);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rings.forEach((ring) => {{
    ring.forEach(([x, y]) => {{
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }});
  }});
  if (!Number.isFinite(minX)) return null;
  return {{ minX, minY, maxX, maxY }};
}};

const polygonCentroid = (ring) => {{
  let area = 0, cx = 0, cy = 0;
  const len = ring.length;
  for (let i = 0, j = len - 1; i < len; j = i++) {{
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }}
  if (area === 0) return ring[0];
  area *= 0.5;
  return [cx / (6 * area), cy / (6 * area)];
}};

const distanceToSegmentSquared = (point, a, b) => {{
  const [x, y] = point;
  const [x1, y1] = a;
  const [x2, y2] = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {{
    const vx = x - x1;
    const vy = y - y1;
    return vx * vx + vy * vy;
  }}
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const vx = x - px;
  const vy = y - py;
  return vx * vx + vy * vy;
}};

const distanceToRingSquared = (point, ring) => {{
  let min = Infinity;
  for (let i = 0, len = ring.length; i < len; i += 1) {{
    const a = ring[i];
    const b = ring[(i + 1) % len];
    min = Math.min(min, distanceToSegmentSquared(point, a, b));
  }}
  return min;
}};

const findInteriorPoint = (ring, geometry) => {{
  const bounds = geometryBounds(geometry);
  if (!bounds) return ring[0];
  let bestPoint = ring[0];
  let bestDist = 0;
  const {{ minX, minY, maxX, maxY }} = bounds;
  const width = maxX - minX;
  const height = maxY - minY;
  const steps = 8;
  let step = Math.min(width, height) / steps;
  for (let iter = 0; iter < 3; iter += 1) {{
    for (let x = minX; x <= maxX; x += step) {{
      for (let y = minY; y <= maxY; y += step) {{
        const point = [x, y];
        if (!pointInGeometry(point, geometry)) continue;
        const dist = distanceToRingSquared(point, ring);
        if (dist > bestDist) {{
          bestDist = dist;
          bestPoint = point;
        }}
      }}
    }}
    const span = step * 2;
    const bx = bestPoint[0];
    const by = bestPoint[1];
    step /= 2;
    bounds.minX = Math.max(minX, bx - span);
    bounds.maxX = Math.min(maxX, bx + span);
    bounds.minY = Math.max(minY, by - span);
    bounds.maxY = Math.min(maxY, by + span);
  }}
  return bestPoint;
}};

const pointInsideGeometry = (geometry) => {{
  if (!geometry) return null;
  if (geometry.type === "Point") return geometry.coordinates;
  const rings = outerRingsFromGeometry(geometry);
  if (!rings.length || !rings[0].length) return null;
  const ring = rings[0];
  const centroid = polygonCentroid(ring);
  if (pointInGeometry(centroid, geometry)) return centroid;
  return findInteriorPoint(ring, geometry);
}};

const earthRadius = 6378137;
const ringAreaMeters = (coords) => {{
  if (!coords || coords.length < 3) return 0;
  let area = 0;
  for (let i = 0, len = coords.length; i < len; i += 1) {{
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[(i + 1) % len];
    const lam1 = (lon1 * Math.PI) / 180;
    const lam2 = (lon2 * Math.PI) / 180;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    area += (lam2 - lam1) * (2 + Math.sin(phi1) + Math.sin(phi2));
  }}
  return (area * earthRadius * earthRadius) / 2;
}};

const geometryAreaMeters = (geometry) => {{
  if (!geometry) return 0;
  const {{ type, coordinates }} = geometry;
  if (type === "Polygon") {{
    let area = Math.abs(ringAreaMeters(coordinates[0]));
    for (let i = 1; i < coordinates.length; i += 1) {{
      area -= Math.abs(ringAreaMeters(coordinates[i]));
    }}
    return Math.abs(area);
  }}
  if (type === "MultiPolygon") {{
    return coordinates.reduce((sum, polygon) => {{
      if (!polygon.length) return sum;
      let polyArea = Math.abs(ringAreaMeters(polygon[0]));
      for (let i = 1; i < polygon.length; i += 1) {{
        polyArea -= Math.abs(ringAreaMeters(polygon[i]));
      }}
      return sum + Math.abs(polyArea);
    }}, 0);
  }}
  return 0;
}};

const buildPopulationMarker = (feature, baseColor, cache) => {{
  if (!feature) return null;
  const density = Number(feature.properties?.PopDensity || 0);
  const population = Number(feature.properties?.POP10 || 0);
  const objectId = String(feature.properties?.FID || "");
  let centerLonLat = cache[objectId];
  if (centerLonLat && (centerLonLat.length !== 2 || centerLonLat[0] < -130 || centerLonLat[0] > -100 || centerLonLat[1] < 30 || centerLonLat[1] > 50)) {{
    centerLonLat = null;
  }}
  if (!centerLonLat) {{
    centerLonLat = pointInsideGeometry(feature.geometry);
    if (centerLonLat) cache[objectId] = centerLonLat;
  }}
  if (!centerLonLat) return null;
  const center = [centerLonLat[1], centerLonLat[0]];
  if (density > populationState.maxDensity) populationState.maxDensity = density;
  const marker = L.circleMarker(center, {{
    renderer: populationRenderer,
    radius: 4,
    weight: 0.4,
    color: "#444444",
    fillColor: baseColor,
    fillOpacity: 0.7,
    opacity: styleState.lineOpacity,
    density
  }});
  const areaSqMi = geometryAreaMeters(feature.geometry) * 3.8610216e-7;
  let areaLabel = "n/a";
  if (areaSqMi > 0) {{
    if (areaSqMi >= 1) areaLabel = `${{areaSqMi.toFixed(2)}} mi²`;
    else areaLabel = `${{(areaSqMi * 640).toFixed(2)}} acres`;
  }}
  const popupHtml = `Population: ${{population}}<br />Block area: ${{areaLabel}}`;
  marker.bindTooltip(popupHtml, {{
    direction: "top",
    offset: [0, -8],
    opacity: 0.95,
    className: "population-tooltip",
    sticky: true
  }});
  marker.on("click", (e) => {{
    L.DomEvent.stopPropagation(e);
    const highlightId = String(feature.properties?.FID ?? "");
    if (populationHighlight) {{
      if (populationHighlight._highlightId === highlightId) {{
        map.removeLayer(populationHighlight);
        populationHighlight = null;
        return;
      }}
      map.removeLayer(populationHighlight);
      populationHighlight = null;
    }}
    populationHighlight = L.geoJSON(feature.geometry, {{
      pane: "populationOutlinePane",
      style: {{ color: "#111111", weight: 2, fillOpacity: 0 }}
    }}).addTo(map);
    populationHighlight._highlightId = highlightId;
    populationHighlight.bindTooltip(popupHtml, {{
      direction: "top",
      offset: [0, -8],
      opacity: 0.95,
      className: "population-tooltip",
      sticky: true
    }});
    populationHighlight.on("click", () => {{
      map.removeLayer(populationHighlight);
      populationHighlight = null;
    }});
  }});
  return marker;
}};

const fetchPopulationCount = async () => {{
  const baseUrl = "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";
  const params = new URLSearchParams({{ where: "STATEFP10='49'", returnCountOnly: "true", f: "json" }});
  const response = await fetch(`${{baseUrl}}?${{params.toString()}}`);
  if (!response.ok) throw new Error(`Population count failed: ${{response.status}}`);
  const data = await response.json();
  return data.count || 0;
}};

const loadPopulationPointsViaRest = async (baseColor, cache, status) => {{
  const baseUrl = "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";
  const pageSize = 2000;
  let offset = 0;
  let received = 0;
  while (true) {{
    const params = new URLSearchParams({{
      where: "STATEFP10='49'",
      outFields: "*",
      outSR: "4326",
      f: "geojson",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize)
    }});
    const response = await fetch(`${{baseUrl}}?${{params.toString()}}`);
    if (!response.ok) throw new Error(`Population query failed: ${{response.status}}`);
    const data = await response.json();
    const features = data.features || [];
    if (!features.length) break;
    const markers = [];
    features.forEach((feature) => {{
      const marker = buildPopulationMarker(feature, baseColor, cache);
      if (marker) markers.push(marker);
    }});
    if (markers.length) {{
      await new Promise((resolve) => {{
        const chunkSize = 400;
        let index = 0;
        const addChunk = () => {{
          const end = Math.min(index + chunkSize, markers.length);
          for (; index < end; index += 1) populationLayer.addLayer(markers[index]);
          if (populationRenderer && populationRenderer._redraw) populationRenderer._redraw();
          if (index === chunkSize) enablePopulationCanvasClicks();
          if (index < markers.length) requestAnimationFrame(addChunk);
          else resolve();
        }};
        addChunk();
      }});
    }}
    received += features.length;
    if (status) status.textContent = `${{received.toLocaleString()}} blocks`;
    offset += pageSize;
    if (features.length < pageSize) break;
  }}
  return received;
}};

const loadPopulationPoints = async () => {{
  if (populationState.loaded || populationState.loading) return;
  populationState.loading = true;
  const status = ensurePopulationStatus();
  let loadingDots = 0;
  let loadingTimer = null;
  if (status) {{
    status.textContent = "loading";
    loadingTimer = setInterval(() => {{
      loadingDots = (loadingDots + 1) % 6;
      status.textContent = `loading${{".".repeat(loadingDots)}}`;
    }}, 5000);
  }}
  try {{
    populationState.totalCount = await fetchPopulationCount();
  }} catch (error) {{}}
  try {{
    const baseColor = mixColor(hexToRgb(populationTintColor), 0.5);
    const cache = loadPopulationPointCache();
    const restCount = await loadPopulationPointsViaRest(baseColor, cache, status);
    populationState.loaded = true;
    populationState.loading = false;
    updatePopulationStyles();
    persistPopulationPointCache();
    if (loadingTimer) clearInterval(loadingTimer);
    if (status) status.textContent = restCount ? `${{restCount.toLocaleString()}} blocks` : "ready";
    const populationToggle = document.getElementById("toggle-population");
    if (populationToggle && populationToggle.checked && !map.hasLayer(populationLayer)) {{
      populationLayer.addTo(map);
      setTimeout(() => {{
        if (populationRenderer && populationRenderer._redraw) populationRenderer._redraw();
        map.invalidateSize();
      }}, 100);
    }}
  }} catch (error) {{
    populationState.loading = false;
    if (loadingTimer) clearInterval(loadingTimer);
    throw error;
  }}
}};

const bindColorPickers = (parties) => {{
  const outlineConfig = [
    {{ id: "outline-color-house", key: "house" }},
    {{ id: "outline-color-senate", key: "senate" }},
    {{ id: "outline-color-congress-current", key: "congressCurrent" }},
    {{ id: "outline-color-congress-future", key: "congressFuture" }}
  ];
  outlineConfig.forEach(({{ id, key }}) => {{
    const input = document.getElementById(id);
    if (!input) return;
    input.value = colorConfig.outline[key];
    input.addEventListener("input", () => {{
      const updatedConfig = updateColorConfig({{ outline: {{ [key]: input.value }} }});
      Object.assign(colorConfig, updatedConfig);
      styleState.lineColors[key] = input.value;
      persistColors();
      refreshPartyFill(parties);
    }});
  }});
}};

const resetColorConfig = (parties) => {{
  localStorage.removeItem(COLOR_CONFIG_STORAGE_KEY);
  Object.assign(colorConfig, defaultColorConfig);
  const outlineInputs = [
    {{ id: "outline-color-house", key: "house" }},
    {{ id: "outline-color-senate", key: "senate" }},
    {{ id: "outline-color-congress-current", key: "congressCurrent" }},
    {{ id: "outline-color-congress-future", key: "congressFuture" }}
  ];
  outlineInputs.forEach(({{ id, key }}) => {{
    const input = document.getElementById(id);
    if (input) input.value = defaultColorConfig.outline[key];
  }});
  Object.assign(styleState.lineColors, defaultColorConfig.outline);
  persistColors();
  refreshPartyFill(parties);
}};

const bindPopulationColor = () => {{
  const input = document.getElementById("color-population");
  if (!input) return;
  populationTintColor = uiState.populationColor ?? defaultPopulationColor;
  input.value = populationTintColor;
  updatePopulationStyles();
  input.addEventListener("input", () => {{
    populationTintColor = input.value;
    uiState.populationColor = input.value;
    persistUi({{ populationColor: input.value }});
    updatePopulationStyles();
  }});
}};

const bindTileStylePicker = () => {{
  const select = document.getElementById("tile-style-select");
  if (!select) return;
  select.value = uiState.tileStyle ?? "osm";
  select.addEventListener("change", () => {{
    const styleKey = select.value;
    if (!tileSources[styleKey]) return;
    uiState.tileStyle = styleKey;
    persistUi({{ tileStyle: styleKey }});
    if (layerState.tiles) map.removeLayer(layerState.tiles);
    baseTiles = createBaseTiles(styleKey);
    layerState.tiles = baseTiles;
    const tilesToggle = document.getElementById("toggle-tiles");
    if (!tilesToggle || tilesToggle.checked) baseTiles.addTo(map);
  }});
}};

const bindLineControls = (parties) => {{
  const widthInput = document.getElementById("line-width");
  const opacityInput = document.getElementById("line-opacity");
  if (widthInput) {{
    widthInput.value = String(storedUi.widthSlider ?? 0.6);
    widthInput.addEventListener("input", () => {{
      const t = parseFloat(widthInput.value);
      styleState.lineWidth = expScale(t, widthRange.min, widthRange.max, widthRange.exponent);
      persistUi({{ widthSlider: t }});
      refreshPartyFill(parties);
    }});
    styleState.lineWidth = expScale(parseFloat(widthInput.value), widthRange.min, widthRange.max, widthRange.exponent);
  }}
  if (opacityInput) {{
    opacityInput.value = String(storedUi.opacitySlider ?? 1);
    opacityInput.addEventListener("input", () => {{
      const t = parseFloat(opacityInput.value);
      styleState.lineOpacity = expScale(t, opacityRange.min, opacityRange.max, opacityRange.exponent);
      persistUi({{ opacitySlider: t }});
      refreshPartyFill(parties);
    }});
    styleState.lineOpacity = expScale(parseFloat(opacityInput.value), opacityRange.min, opacityRange.max, opacityRange.exponent);
  }}
}};

const init = async () => {{
  const [boundary, house, senate, congressCurrent, congressFuture, parties] = await Promise.all([
    loadJson(`${{DATA_BASE_URL}}/utah_boundary.geojson`),
    loadJson(`${{DATA_BASE_URL}}/utah_house_2022.geojson`),
    loadJson(`${{DATA_BASE_URL}}/utah_senate_2022.geojson`),
    loadJson(`${{DATA_BASE_URL}}/utah_congress_2022.geojson`),
    loadJson(`${{DATA_BASE_URL}}/utah_congress_2026.geojson`),
    loadJson(`${{DATA_BASE_URL}}/utah_parties.json`)
  ]);

  layerState.boundary = L.geoJSON(boundary, {{ style: boundaryStyle }}).addTo(map);
  if (!storedView) map.fitBounds(layerState.boundary.getBounds(), {{ padding: [20, 20] }});

  layerState.house = L.geoJSON(house, {{
    style: (feature) => {{
      const district = String(feature.properties.DIST);
      const info = parties.house[district];
      return houseStyle(info?.party);
    }},
    onEachFeature: (feature, layer) => {{
      const district = String(feature.properties.DIST);
      const info = parties.house[district];
      const partyLabel = info?.party || "Unknown";
      const nameLabel = info?.name ? ` — ${{info.name}}` : "";
      layer.bindPopup(`House District ${{district}}<br />${{partyLabel}}${{nameLabel}}`);
    }}
  }}).addTo(map);

  layerState.senate = L.geoJSON(senate, {{
    style: (feature) => {{
      const district = String(feature.properties.DIST);
      const info = parties.senate[district];
      return senateStyle(info?.party);
    }},
    onEachFeature: (feature, layer) => {{
      const district = String(feature.properties.DIST);
      const info = parties.senate[district];
      const partyLabel = info?.party || "Unknown";
      const nameLabel = info?.name ? ` — ${{info.name}}` : "";
      layer.bindPopup(`Senate District ${{district}}<br />${{partyLabel}}${{nameLabel}}`);
    }}
  }}).addTo(map);

  layerState.congressCurrent = L.geoJSON(congressCurrent, {{
    style: (feature) => {{
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_current?.[district];
      return congressCurrentStyle(info?.party);
    }},
    onEachFeature: (feature, layer) => {{
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_current?.[district];
      const partyLabel = info?.party || "Unknown";
      const nameLabel = info?.name ? ` — ${{info.name}}` : "";
      layer.bindPopup(`Federal House District ${{district}}<br />${{partyLabel}}${{nameLabel}}`);
    }}
  }}).addTo(map);

  layerState.congressFuture = L.geoJSON(congressFuture, {{
    style: (feature) => {{
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_future?.[district];
      return congressFutureStyle(info?.party);
    }},
    onEachFeature: (feature, layer) => {{
      const district = String(feature.properties.DISTRICT);
      const info = parties.congress_future?.[district];
      const partyLabel = info?.party || "Unknown";
      const nameLabel = info?.name && info?.name !== "TBD" ? ` — ${{info.name}}` : "";
      layer.bindPopup(`Federal House District ${{district}} (coming)<br />${{partyLabel}}${{nameLabel}}`);
    }}
  }});

  const toggleConfig = [
    {{ id: "toggle-boundary", key: "boundary" }},
    {{ id: "toggle-tiles", key: "tiles" }},
    {{ id: "toggle-population", key: "population" }},
    {{ id: "toggle-house", key: "house" }},
    {{ id: "toggle-senate", key: "senate" }},
    {{ id: "toggle-congress-current", key: "congressCurrent" }},
    {{ id: "toggle-congress-future", key: "congressFuture" }}
  ];

  toggleConfig.forEach(({{ id, key }}) => {{
    const checkbox = document.getElementById(id);
    if (!checkbox) return;
    if (storedUi.toggles && typeof storedUi.toggles[id] === "boolean") checkbox.checked = storedUi.toggles[id];
    attachToggle(id, key);
    if (!checkbox.checked) map.removeLayer(layerState[key]);
    else if (key === "population") {{
      layerState.population.addTo(map);
    }}
    // Background load is started separately in init, don't call here
  }});

  const partyFillToggle = document.getElementById("toggle-party-fill");
  if (partyFillToggle) {{
    partyFillToggle.checked = styleState.partyFill;
    partyFillToggle.addEventListener("change", () => {{
      styleState.partyFill = partyFillToggle.checked;
      persistUi({{ partyFill: styleState.partyFill }});
      refreshPartyFill(parties);
    }});
  }}

  refreshPartyFill(parties);
  bindColorPickers(parties);
  bindLineControls(parties);
  bindPopulationColor();
  bindTileStylePicker();

  const resetColorsBtn = document.getElementById("reset-colors-btn");
  if (resetColorsBtn) resetColorsBtn.addEventListener("click", () => resetColorConfig(parties));

  const panel = document.getElementById("controls");
  const panelToggle = document.getElementById("panel-toggle");
  if (panel && panelToggle) {{
    panelToggle.addEventListener("click", () => {{
      const collapsed = panel.classList.toggle("collapsed");
      panelToggle.textContent = collapsed ? "▶" : "◀";
      panelToggle.setAttribute("aria-expanded", String(!collapsed));
    }});
  }}

  // Mobile touch gesture handling
  const dragHandle = document.querySelector(".panel-drag-handle");
  if (panel && dragHandle) {{
    let touchStartY = 0;
    let isDragging = false;
    const isMobile = () => window.innerWidth <= 480;
    dragHandle.addEventListener("touchstart", (e) => {{
      if (!isMobile()) return;
      touchStartY = e.touches[0].clientY;
      isDragging = true;
    }}, {{ passive: true }});
    dragHandle.addEventListener("touchend", (e) => {{
      if (!isMobile() || !isDragging) return;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchEndY - touchStartY;
      isDragging = false;
      const swipeThreshold = 50;
      if (deltaY < -swipeThreshold && panel.classList.contains("collapsed")) panel.classList.remove("collapsed");
      else if (deltaY > swipeThreshold && !panel.classList.contains("collapsed")) panel.classList.add("collapsed");
      touchStartY = 0;
    }}, {{ passive: true }});
    dragHandle.addEventListener("click", () => {{
      if (!isMobile()) return;
      panel.classList.toggle("collapsed");
    }});
  }}

  const toggleInputs = toggleConfig.map(({{ id }}) => document.getElementById(id)).filter(Boolean);
  toggleInputs.forEach((input) => {{
    input.addEventListener("change", () => {{
      const toggles = toggleInputs.reduce((acc, el) => {{
        acc[el.id] = el.checked;
        return acc;
      }}, {{}});
      persistUi({{ toggles }});
    }});
  }});

  const storeView = () => {{
    const center = map.getCenter();
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify({{ center: [center.lat, center.lng], zoom: map.getZoom() }}));
  }};
  storeView();
  map.on("moveend", storeView);
  map.on("zoomend", storeView);

  // Start loading population data in background for instant toggle
  loadPopulationPoints().catch((error) => {{
    console.error('Background population load failed:', error);
  }});
}};

init().catch((error) => {{
  console.error(error);
  const panel = document.getElementById("controls");
  const errorDiv = document.createElement("div");
  errorDiv.className = "panel-section";
  errorDiv.textContent = "Failed to load data. Check the console for details.";
  panel.appendChild(errorDiv);
}});

// Localhost detection (for Streamlit, always false)
const isLocalhost = false;

// Tour step definitions
const tourSteps = [
  {{
    id: 'welcome',
    title: 'Welcome to Utah Political Layers',
    content: '<p>This interactive map helps you explore Utah\\'s political districts and population distribution.</p><p>You can view:</p><ul><li>State House districts (75 total)</li><li>State Senate districts (29 total)</li><li>Federal Congressional districts (current and future)</li><li>Population density patterns</li></ul><p>Let\\'s take a quick tour to see what you can do!</p>',
    position: 'center',
    mapView: {{ bounds: [[37.0, -114.05], [42.0, -109.04]] }},
    layers: {{ boundary: true, house: false, senate: false, congressCurrent: false, congressFuture: false, population: false }}
  }},
  {{
    id: 'utah-boundary',
    title: 'Utah State Boundary',
    content: '<p>The dark outline shows Utah\\'s state boundary.</p><p>Utah is the 13th largest state by area (84,899 square miles) and stretches from the Colorado Plateau in the south to the Wasatch Range in the north.</p>',
    position: 'top-right',
    mapView: {{ bounds: [[37.0, -114.05], [42.0, -109.04]] }},
    layers: {{ boundary: true, house: false, senate: false, congressCurrent: false, congressFuture: false, population: false }}
  }},
  {{
    id: 'state-house',
    title: 'State House Districts',
    content: '<p>Utah\\'s House of Representatives has <strong>75 districts</strong>, shown here in orange outlines.</p><p>Each district elects one representative to the state legislature.</p><p><em>Tip: Click any district to see details about its representative!</em></p>',
    position: 'top-left',
    mapView: {{ center: [40.7608, -111.8910], zoom: 11 }},
    layers: {{ boundary: true, house: true, senate: false, congressCurrent: false, congressFuture: false, population: false }}
  }},
  {{
    id: 'state-senate',
    title: 'State Senate Districts',
    content: '<p>Utah\\'s Senate has <strong>29 districts</strong>, shown in blue outlines.</p><p>Senate districts are larger than House districts, as each senator represents more constituents.</p>',
    position: 'top-left',
    mapView: {{ center: [40.7608, -111.8910], zoom: 10.5 }},
    layers: {{ boundary: true, house: true, senate: true, congressCurrent: false, congressFuture: false, population: false }}
  }},
  {{
    id: 'congress-current',
    title: 'Federal Congressional Districts',
    content: '<p>Utah currently has <strong>4 Congressional districts</strong> (shown in purple outlines).</p><p>These are for U.S. House of Representatives seats in Washington, D.C.</p>',
    position: 'top-right',
    mapView: {{ center: [39.3210, -111.0937], zoom: 7.5 }},
    layers: {{ boundary: true, house: false, senate: false, congressCurrent: true, congressFuture: false, population: false }}
  }},
  {{
    id: 'conclusion',
    title: 'Start Exploring!',
    content: '<p>You\\'re all set to explore Utah\\'s political landscape!</p><p><strong>Try these actions:</strong></p><ul><li>Pan and zoom to explore different regions</li><li>Click districts to see representatives</li><li>Toggle layers to compare boundaries</li><li>Adjust colors and styles to your preference</li></ul>',
    position: 'center',
    mapView: {{ bounds: [[37.0, -114.05], [42.0, -109.04]] }},
    layers: {{ boundary: true, house: true, senate: true, congressCurrent: true, congressFuture: false, population: false }}
  }}
];

class TourController {{
  constructor(map, layerState) {{
    this.map = map;
    this.layerState = layerState;
    this.currentStepIndex = -1;
    this.isActive = false;
    this.elements = {{}};
    this.originalLayerState = {{}};
    this.originalMapView = null;
    this.TOUR_STORAGE_KEY = 'utah-tour-completed';
    this.hasSeenTour = localStorage.getItem(this.TOUR_STORAGE_KEY) === 'true';
  }}

  createTourElements() {{
    const overlay = document.createElement('div');
    overlay.id = 'tour-overlay';
    overlay.className = 'tour-overlay';
    document.body.appendChild(overlay);

    const callout = document.createElement('div');
    callout.id = 'tour-callout';
    callout.className = 'tour-callout';
    document.body.appendChild(callout);

    const progress = document.createElement('div');
    progress.id = 'tour-progress';
    progress.className = 'tour-progress';
    callout.appendChild(progress);

    const title = document.createElement('h2');
    title.id = 'tour-title';
    title.className = 'tour-title';
    callout.appendChild(title);

    const content = document.createElement('div');
    content.id = 'tour-content';
    content.className = 'tour-content';
    callout.appendChild(content);

    const buttons = document.createElement('div');
    buttons.id = 'tour-buttons';
    buttons.className = 'tour-buttons';
    callout.appendChild(buttons);

    const skipBtn = document.createElement('button');
    skipBtn.className = 'tour-button tour-skip';
    skipBtn.textContent = 'Skip Tour';
    skipBtn.onclick = () => this.skip();
    buttons.appendChild(skipBtn);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'tour-button tour-prev';
    prevBtn.textContent = '← Previous';
    prevBtn.onclick = () => this.previous();
    buttons.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'tour-button tour-next';
    nextBtn.textContent = 'Next →';
    nextBtn.onclick = () => this.next();
    buttons.appendChild(nextBtn);

    this.elements = {{ overlay, callout, progress, title, content, buttons, skipBtn, prevBtn, nextBtn }};
  }}

  saveCurrentState() {{
    this.originalLayerState = {{
      boundary: this.map.hasLayer(this.layerState.boundary),
      house: this.map.hasLayer(this.layerState.house),
      senate: this.map.hasLayer(this.layerState.senate),
      congressCurrent: this.map.hasLayer(this.layerState.congressCurrent),
      congressFuture: this.map.hasLayer(this.layerState.congressFuture),
      population: this.map.hasLayer(this.layerState.population)
    }};
    const center = this.map.getCenter();
    this.originalMapView = {{ center: [center.lat, center.lng], zoom: this.map.getZoom() }};
  }}

  restoreOriginalState() {{
    Object.keys(this.originalLayerState).forEach(layerKey => {{
      const layer = this.layerState[layerKey];
      const shouldShow = this.originalLayerState[layerKey];
      if (layer) {{
        if (shouldShow && !this.map.hasLayer(layer)) layer.addTo(this.map);
        else if (!shouldShow && this.map.hasLayer(layer)) this.map.removeLayer(layer);
      }}
    }});
    if (this.originalMapView) this.map.setView(this.originalMapView.center, this.originalMapView.zoom);
  }}

  start() {{
    if (this.isActive) return;
    this.isActive = true;
    this.currentStepIndex = -1;
    this.saveCurrentState();
    this.createTourElements();
    this.next();
  }}

  next() {{
    if (!this.isActive) return;
    const nextIndex = this.currentStepIndex + 1;
    if (nextIndex >= tourSteps.length) {{ this.complete(); return; }}
    this.goToStep(nextIndex);
  }}

  previous() {{
    if (!this.isActive || this.currentStepIndex <= 0) return;
    this.goToStep(this.currentStepIndex - 1);
  }}

  skip() {{
    if (!this.isActive) return;
    this.end();
  }}

  complete() {{
    localStorage.setItem(this.TOUR_STORAGE_KEY, 'true');
    this.hasSeenTour = true;
    this.end();
  }}

  end() {{
    if (!this.isActive) return;
    this.isActive = false;
    this.currentStepIndex = -1;
    Object.values(this.elements).forEach(el => {{ if (el && el.parentNode) el.parentNode.removeChild(el); }});
    this.elements = {{}};
    this.restoreOriginalState();
  }}

  goToStep(stepIndex) {{
    if (!this.isActive || stepIndex < 0 || stepIndex >= tourSteps.length) return;
    this.currentStepIndex = stepIndex;
    const step = tourSteps[stepIndex];
    this.executeStep(step);
    this.updateStepUI(step);
  }}

  executeStep(step) {{
    if (step.mapView) {{
      if (step.mapView.bounds) this.map.fitBounds(step.mapView.bounds, {{ padding: [20, 20], animate: true, duration: 1.0 }});
      else if (step.mapView.center && typeof step.mapView.zoom === 'number') this.map.setView(step.mapView.center, step.mapView.zoom, {{ animate: true, duration: 1.0 }});
    }}
    if (step.layers) {{
      Object.keys(step.layers).forEach(layerKey => {{
        const layer = this.layerState[layerKey];
        const shouldShow = step.layers[layerKey];
        if (layer) {{
          if (shouldShow && !this.map.hasLayer(layer)) {{
            layer.addTo(this.map);
            const checkboxId = `toggle-${{layerKey === 'congressCurrent' ? 'congress-current' : layerKey === 'congressFuture' ? 'congress-future' : layerKey}}`;
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) checkbox.checked = true;
          }} else if (!shouldShow && this.map.hasLayer(layer)) {{
            this.map.removeLayer(layer);
            const checkboxId = `toggle-${{layerKey === 'congressCurrent' ? 'congress-current' : layerKey === 'congressFuture' ? 'congress-future' : layerKey}}`;
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) checkbox.checked = false;
          }}
        }}
      }});
    }}
  }}

  updateStepUI(step) {{
    const {{ callout, progress, title, content, prevBtn, nextBtn }} = this.elements;
    callout.className = `tour-callout tour-position-${{step.position}}`;
    progress.textContent = `Step ${{this.currentStepIndex + 1}} of ${{tourSteps.length}}`;
    title.textContent = step.title;
    content.innerHTML = step.content;
    prevBtn.style.display = this.currentStepIndex > 0 ? 'inline-block' : 'none';
    nextBtn.textContent = this.currentStepIndex === tourSteps.length - 1 ? 'Finish' : 'Next →';
  }}

  shouldShowTour() {{ return !this.hasSeenTour; }}
  resetTourStatus() {{ localStorage.removeItem(this.TOUR_STORAGE_KEY); this.hasSeenTour = false; }}
}}

window.TourController = TourController;
window.tourSteps = tourSteps;

// Tour initialization
window.addEventListener('load', () => {{
  setTimeout(() => {{
    if (typeof TourController !== 'undefined' && typeof tourSteps !== 'undefined' && window.map && window.layerState) {{
      const tour = new TourController(window.map, window.layerState);
      window.tour = tour;
      const tourBtn = document.getElementById('tour-btn');
      if (tourBtn) tourBtn.addEventListener('click', () => tour.start());
      if (tour.shouldShowTour()) setTimeout(() => tour.start(), 1500);
    }}
  }}, 500);
}});
  </script>
</body>
</html>
'''

# Render the complete HTML
st.components.v1.html(html_content, height=1200, scrolling=False)
