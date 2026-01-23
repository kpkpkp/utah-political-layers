import streamlit as st
import requests

st.set_page_config(
    page_title="Utah Political Layers",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("🗺️ Utah Political Layers")
st.markdown("Interactive map of Utah State House, Senate, and Congressional districts with party affiliation and population data.")

# Embed the GitHub Pages map
st.components.v1.html(
    '''
    <iframe
        src="https://kpkpkp.github.io/utah-political-layers/"
        width="100%"
        height="900"
        frameborder="0"
        scrolling="no"
        style="border: 1px solid #ddd; border-radius: 5px; overflow: hidden;"
    ></iframe>
    ''',
    height=910
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
