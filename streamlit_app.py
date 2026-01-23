import streamlit as st
import requests

st.set_page_config(
    page_title="Utah Political Layers",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("🗺️ Utah Political Layers")
st.markdown("View Utah State House and Senate districts with party affiliation colors, population density, and congressional districts.")

with st.expander("ℹ️ About This Project", expanded=True):
    st.markdown("""
    **Utah Political Layers** is a transparent, open-source visualization of Utah's electoral districts.

    **What You're Seeing:**
    - Utah State House districts (75 total)
    - Utah State Senate districts (29 total)
    - US Congressional districts (4 total, current and upcoming)
    - State boundary outline
    - Population density mapping (44,069 census blocks)

    **Color Coding:**
    - 🔴 Red = Republican
    - 🔵 Blue = Democratic
    - 🟣 Purple = Forward Party
    - ⚫ Gray = Other/Unaffiliated

    **Data Transparency:**
    All data comes from official public sources. See sidebar for direct links to:
    - Utah State Legislature roster (party affiliations)
    - Utah SGID/ArcGIS services (district boundaries)
    - US Census/ArcGIS (population density)
    - Ballotpedia (Congressional delegation)

    **How It Works:**
    - Districts are loaded as GeoJSON from public SGID services
    - Party affiliation data comes from official state records
    - Population data is from Census Bureau via ArcGIS
    - Everything runs in your browser (no tracking, fully transparent)
    - Source code available on [GitHub](https://github.com/kpkpkp/utah-political-layers)
    """)

# Embed the GitHub Pages map
st.components.v1.html(
    '''
    <iframe
        src="https://kpkpkp.github.io/utah-political-layers/"
        width="100%"
        height="900"
        frameborder="0"
        style="border: 1px solid #ddd; border-radius: 5px;"
    ></iframe>
    ''',
    height=920,
    scrolling=True
)

# Sidebar info
with st.sidebar:
    st.markdown("### 📊 About This Map")
    st.markdown("""
    **Layers:**
    - State House districts (75)
    - State Senate districts (29)
    - US Congressional districts (4)
    - Utah state boundary
    - Population density (44k census blocks)

    **Features:**
    - Toggle layers on/off
    - Click districts for details
    - Zoom to explore
    - Party affiliation colors

    **Data Sources:**
    - Districts: Utah SGID ArcGIS
    - Party info: Utah Legislature
    - Population: ArcGIS FeatureServer
    - Congress: Ballotpedia
    """)

    st.markdown("---")
    st.markdown("### 🔗 Data Sources & Transparency")

    st.markdown("""
    **District Boundaries:**
    - [Utah SGID (State Geospatial Information Database)](https://gis.utah.gov/)
    - [SGID ArcGIS Data Catalog](https://sgid-ugs.opendata.arcgis.com/)
    - State House & Senate: 2022-2032 redistricting

    **Party Affiliation Data:**
    - [Utah State Legislature - House Roster](https://le.utah.gov/asp/roster/roster.asp?house=H)
    - [Utah State Legislature - Senate Roster](https://le.utah.gov/asp/roster/roster.asp?house=S)
    - Updated from official state records

    **Congressional Districts:**
    - [Ballotpedia - Utah Congressional Delegation](https://ballotpedia.org/United_States_congressional_delegations_from_Utah)
    - Current (2022) and upcoming (2026) districts

    **Population Data:**
    - [ArcGIS Rest Services (ESRI)](https://services1.arcgis.com/)
    - Utah census block groups with population density
    - 44,069 census blocks mapped

    **Technology Stack:**
    - [Leaflet.js - Open Source Map Library](https://leafletjs.com/)
    - [GeoJSON Specification](https://geojson.org/)
    - [GitHub - Source Code](https://github.com/kpkpkp/utah-political-layers)
    """)

    st.markdown("---")
    st.markdown("""
    ### ℹ️ About
    - **Source**: [GitHub Repository](https://github.com/kpkpkp/utah-political-layers)
    - **Map**: [Direct Link](https://kpkpkp.github.io/utah-political-layers/)
    - **License**: All data sources are public/open
    - **Updates**: Redrawn after each 2020+ census
    """)
