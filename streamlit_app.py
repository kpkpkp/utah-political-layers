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
    st.markdown("""
    **Links:**
    - [GitHub Repo](https://github.com/kpkpkp/utah-political-layers)
    - [GitHub Pages](https://kpkpkp.github.io/utah-political-layers/)
    - [Utah SGID](https://gis.utah.gov/)
    """)
