#!/usr/bin/env python3
"""
Build streamlit_app.py from canonical public/ source files.

Reads:
  public/index.html, public/styles.css, public/css/tour.css,
  public/app.js, public/js/tour.js

Produces:
  streamlit_app.py  (at repo root)

Streamlit-specific transforms applied:
  - Brace escaping for f-string safety
  - DATA_BASE_URL injection + path rewriting
  - trackEvent noop replacement
  - localStorage clearing on load
  - GA script removal
  - External CSS/JS ref removal
  - Inlined CSS and JS
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def escape_braces(text: str) -> str:
    """Escape { and } for Python f-string safety."""
    return text.replace("{", "{{").replace("}", "}}")


def extract_body_content(html: str) -> str:
    """Extract content between <body> and </body>."""
    match = re.search(r"<body[^>]*>(.*)</body>", html, re.DOTALL)
    if not match:
        raise ValueError("Could not find <body> in index.html")
    return match.group(1).strip()


def extract_head_cdns(html: str) -> str:
    """Extract CDN <link> tags from <head> (Leaflet CSS)."""
    links = []
    for match in re.finditer(r'<link\s[^>]*href="https://[^"]*"[^>]*/?\s*>', html):
        links.append(match.group(0))
    return "\n  ".join(links)


def remove_local_script_tags(body: str) -> str:
    """Remove <script src="app.js..."> and <script src="js/tour.js..."> tags."""
    body = re.sub(r'\s*<script\s+src="app\.js[^"]*"\s*>\s*</script>', "", body)
    body = re.sub(r'\s*<script\s+src="js/tour\.js[^"]*"\s*>\s*</script>', "", body)
    return body


def rewrite_data_paths(js: str) -> str:
    """Rewrite 'data/' fetch paths to use DATA_BASE_URL.

    Works on ESCAPED JS (braces already doubled).
    Original:  loadJson("data/foo.geojson")
    Escaped:   loadJson("data/foo.geojson")   (no braces, so unchanged)
    Result:    loadJson(DATA_BASE_URL + "/foo.geojson")

    DATA_BASE_URL already ends with /data, so we strip the data/ prefix.
    """
    js = re.sub(
        r'loadJson\("data/',
        'loadJson(DATA_BASE_URL + "/',
        js,
    )
    return js


def noop_track_event(js: str) -> str:
    """Replace trackEvent function with a noop.

    Works on ESCAPED JS. The original function body has { } which become {{ }}.
    """
    js = re.sub(
        r"const trackEvent = \(eventName, params = \{\{\}\}\) => \{\{[\s\S]*?\}\};",
        "const trackEvent = () => {{}};",
        js,
    )
    return js


def add_localstorage_clearing(js: str) -> str:
    """Insert localStorage.removeItem() calls after storage key constants.

    Works on ESCAPED JS.
    """
    storage_keys = [
        "MAP_VIEW_STORAGE_KEY",
        "POP_POINT_CACHE_KEY",
        "POP_POINT_CACHE_VERSION_KEY",
        "CORNER_STORAGE_KEY",
        "COLOR_CONFIG_STORAGE_KEY",
        "COLOR_STORAGE_KEY",
        "UI_STORAGE_KEY",
    ]
    for key in storage_keys:
        pattern = rf"(const {key} = [^\n]+\n)"
        replacement = rf"\1localStorage.removeItem({key});\n"
        js = re.sub(pattern, replacement, js)
    return js


def build() -> str:
    """Build the complete streamlit_app.py content."""
    # Read source files
    index_html = read(PUBLIC / "index.html")
    styles_css = read(PUBLIC / "styles.css")
    tour_css = read(PUBLIC / "css" / "tour.css")
    app_js = read(PUBLIC / "app.js")
    tour_js = read(PUBLIC / "js" / "tour.js")

    # --- Extract parts from index.html ---
    cdn_links = extract_head_cdns(index_html)
    body_content = extract_body_content(index_html)

    # Remove local script tags from body (app.js, tour.js)
    body_content = remove_local_script_tags(body_content)

    # Extract CDN script tags from body (Leaflet JS, Esri)
    cdn_scripts = []

    def collect_cdn_script(match):
        cdn_scripts.append(match.group(0).strip())
        return ""

    body_content = re.sub(
        r'\s*<script\s[^>]*src="https://[^"]*"[^>]*>\s*</script>',
        collect_cdn_script,
        body_content,
    )

    # --- Combine CSS ---
    # Streamlit-specific override: disable mobile bottom sheet layout because
    # position:fixed doesn't work inside a fixed-height iframe (height=2000).
    # Instead, force the desktop panel layout at all viewport widths.
    streamlit_mobile_override = """

/* ===== Streamlit iframe fix: restore full desktop panel on mobile ===== */
/* The base @media (max-width:480px) destroys the desktop layout.
   This override restores EVERY desktop property for the Streamlit iframe
   where position:fixed doesn't work (height=2000 iframe). */
@media (max-width: 480px) {
  /* --- Panel container: desktop two-column grid, right-side --- */
  .control-panel {
    position: absolute !important;
    top: 8px !important;
    right: 8px !important;
    bottom: auto !important;
    left: auto !important;
    width: 390px !important;
    min-width: unset !important;
    max-height: none !important;
    border-radius: 10px !important;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15) !important;
    padding: 8px 10px !important;
    transform: none !important;
    overflow-y: visible !important;
    overflow-x: visible !important;
    z-index: 1000 !important;
    font-size: 11px !important;
    display: grid !important;
    grid-template-columns: 3fr 2fr !important;
    grid-template-areas:
      "header header"
      "layers legend"
      "save   save" !important;
    gap: 6px !important;
    transition: transform 0.2s ease !important;
  }

  /* --- Collapsed: slide right, show toggle tab --- */
  .control-panel.collapsed {
    transform: translateX(calc(100% - 28px)) !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  }

  /* --- Toggle button: visible, left edge of right-side panel --- */
  .panel-toggle {
    display: block !important;
    position: absolute !important;
    top: 8px !important;
    left: -16px !important;
    right: auto !important;
    width: 28px !important;
    height: 28px !important;
    border-radius: 999px !important;
    border: 1px solid #d0d0d0 !important;
    background: #ffffff !important;
    cursor: pointer !important;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1) !important;
    z-index: 1001 !important;
  }

  /* --- Hide Layers heading (redundant with panel title) --- */
  .panel-layers > .panel-title { display: none !important; }

  /* --- Hide mobile-only elements --- */
  .panel-corner-btn { display: none !important; }
  .mobile-fab { display: none !important; }
  .panel-mobile-header { display: none !important; }
  .panel-drag-handle { display: none !important; }
  .panel-save-defaults { display: none !important; }

  /* --- Restore column borders/padding --- */
  .panel-layers {
    border-right: 1px solid #efefef !important;
    padding-right: 12px !important;
    border-bottom: none !important;
    padding-bottom: 0 !important;
  }
  .panel-legend {
    border-right: none !important;
    padding-right: 0 !important;
    position: relative !important;
  }

  /* --- Uniform layer rows: zero spacing --- */
  .layer-row {
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 4px !important;
    min-height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1 !important;
  }
  /* Force all first-child swatches (color input + tile-swatch) to same box */
  .layer-row input[type="color"],
  .layer-row .tile-swatch {
    width: 28px !important;
    height: 20px !important;
    min-width: 28px !important;
    flex-shrink: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    border-radius: 0 !important;
  }
  /* Match browser color-input inset without visible outline */
  .layer-row .tile-swatch {
    padding: 2px !important;
    border: none !important;
    background-clip: content-box !important;
  }
  .toggle {
    padding: 0 !important;
    margin: 0 !important;
    min-height: auto !important;
    flex: 1 !important;
    line-height: 1 !important;
  }
  .toggle input[type="checkbox"] {
    margin: 0 2px 0 0 !important;
    vertical-align: middle !important;
  }
  .toggle span {
    vertical-align: middle !important;
  }
  /* Hide tile caption — tile style is in Appearance accordion */
  .tile-caption {
    display: none !important;
  }
  /* Show population status text */
  .population-status {
    font-size: 9px !important;
    opacity: 0.7 !important;
  }
  .layer-row .note {
    display: none !important;
  }
  .legend-row {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1 !important;
  }
  .panel-header {
    gap: 6px !important;
  }
  .fill-toggle {
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    white-space: nowrap !important;
  }
  /* Make all 3 header buttons the same height */
  .tour-btn,
  .recenter-map-btn,
  .feedback-btn {
    padding: 6px 12px !important;
    font-size: 11px !important;
    line-height: 1 !important;
    box-sizing: border-box !important;
    min-height: 0 !important;
  }
}

/* Landscape: also force desktop layout */
@media (max-height: 500px) and (orientation: landscape) {
  .mobile-fab { display: none !important; }
  .panel-toggle { display: block !important; }
  .panel-corner-btn { display: none !important; }
}
"""
    combined_css = styles_css + "\n\n/* ===== Tour CSS ===== */\n" + tour_css + streamlit_mobile_override

    # --- Combine JS ---
    combined_js = app_js + "\n\n// ===== Tour JS =====\n" + tour_js

    # --- Escape braces for f-string ---
    combined_css = escape_braces(combined_css)
    combined_js = escape_braces(combined_js)
    body_content = escape_braces(body_content)
    cdn_links = escape_braces(cdn_links)
    cdn_scripts_str = escape_braces("\n  ".join(cdn_scripts))

    # --- Apply JS transforms (on already-escaped text) ---
    combined_js = noop_track_event(combined_js)
    combined_js = rewrite_data_paths(combined_js)
    combined_js = add_localstorage_clearing(combined_js)

    # Disable mobile auto-collapse since Streamlit uses desktop layout at all widths
    combined_js = combined_js.replace(
        'if (panel && window.matchMedia("(max-width: 480px)").matches) {{\n    panel.classList.add("collapsed");\n  }}',
        '// Mobile auto-collapse disabled for Streamlit iframe',
    )

    # Inject DATA_BASE_URL constant at the top of JS
    # {DATA_BASE_URL} is the ONE real f-string placeholder in the output
    data_base_url_line = 'const DATA_BASE_URL = "{DATA_BASE_URL}";'
    combined_js = data_base_url_line + "\n\n" + combined_js

    # --- Build the Python file by string concatenation ---
    # The hide_streamlit_style uses triple-quoted string (no f-string), so
    # the {{ }} there are literal CSS text that Python will keep as-is.
    # But wait — hide_streamlit_style is a regular """ string, not an f-string,
    # so we should use single braces there. Let's be careful.

    lines = []
    lines.append('# AUTO-GENERATED by scripts/build_streamlit.py \u2014 DO NOT EDIT BY HAND')
    lines.append('# Regenerate with: python3 scripts/build_streamlit.py')
    lines.append('')
    lines.append('import streamlit as st')
    lines.append('')
    lines.append('st.set_page_config(')
    lines.append('    page_title="Utah Political Layers",')
    lines.append('    page_icon="\U0001f5fa\ufe0f",')
    lines.append('    layout="wide",')
    lines.append('    initial_sidebar_state="collapsed"')
    lines.append(')')
    lines.append('')
    lines.append('# Hide Streamlit chrome and maximize map space')
    lines.append('hide_streamlit_style = """')
    lines.append('<style>')
    lines.append('    header {display: none !important}')
    lines.append('    footer {display: none !important}')
    lines.append('    #MainMenu {display: none !important}')
    lines.append('    [data-testid="stSidebar"] {display: none !important}')
    lines.append('    aside {display: none !important}')
    lines.append('    section {background: transparent !important; padding: 0 !important; margin: 0 !important; width: 100% !important}')
    lines.append('    .stMainBlockContainer {padding: 0 !important; margin: 0 !important; height: 100vh !important; overflow: visible !important; width: 100% !important}')
    lines.append('    .appViewContainer {padding: 0 !important; margin: 0 !important; width: 100% !important}')
    lines.append('    .stElementContainer {padding: 0 !important; margin: 0 !important}')
    lines.append('    main {padding: 0 !important; margin: 0 !important; width: 100% !important}')
    lines.append('    [data-testid="stAppViewContainer"] {padding: 0 !important; overflow: visible !important; width: 100% !important}')
    lines.append('    div[data-testid="stVerticalBlock"] > [data-testid="stElementContainer"] {padding: 0 !important}')
    lines.append('    [data-testid="manage-app-button"] {display: none !important}')
    lines.append('    button[class*="terminal" i] {display: none !important}')
    lines.append('    button[class*="Manage"] {display: none !important}')
    lines.append('    [class*="StateContainer"] {height: 100vh !important; max-height: 100vh !important; overflow: visible !important; width: 100% !important}')
    lines.append('    body {background: white !important}')
    lines.append('    html {background: white !important}')
    lines.append('</style>')
    lines.append('"""')
    lines.append('st.markdown(hide_streamlit_style, unsafe_allow_html=True)')
    lines.append('')
    lines.append('# Base URL for raw data files from GitHub')
    lines.append('DATA_BASE_URL = "https://raw.githubusercontent.com/kpkpkp/utah-political-layers/main/docs/data"')
    lines.append('')
    lines.append("# Build the complete HTML with inlined CSS and JS")
    lines.append("html_content = f'''")
    lines.append("<!DOCTYPE html>")
    lines.append('<html lang="en">')
    lines.append("<head>")
    lines.append('  <meta charset="utf-8" />')
    lines.append('  <meta name="viewport" content="width=device-width, initial-scale=1" />')
    lines.append("  <title>Utah House & Senate Districts - Party Map</title>")
    lines.append(f"  {cdn_links}")
    lines.append("  <style>")
    lines.append(combined_css)
    lines.append("  </style>")
    lines.append("</head>")
    lines.append("<body>")
    lines.append(body_content)
    lines.append("")
    lines.append(f"  {cdn_scripts_str}")
    lines.append("")
    lines.append("  <script>")
    lines.append(combined_js)
    lines.append("  </script>")
    lines.append("</body>")
    lines.append("</html>")
    lines.append("'''")
    lines.append("")
    lines.append("st.components.v1.html(html_content, height=2000, scrolling=False)")
    lines.append("")

    return "\n".join(lines)


def main():
    output = build()
    out_path = ROOT / "streamlit_app.py"
    out_path.write_text(output, encoding="utf-8")
    print(f"Generated {out_path} ({len(output):,} bytes)")


if __name__ == "__main__":
    main()
