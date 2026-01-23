import streamlit as st
import requests

st.set_page_config(
    page_title="Utah Political Layers",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Hide Streamlit chrome and maximize map space
hide_streamlit_style = """
<style>
    header {display: none !important}
    header.header {display: none !important}
    footer {display: none !important}
    #MainMenu {display: none !important}
    section {background: transparent !important; padding: 0 !important; margin: 0 !important}
    .stMainBlockContainer {padding: 0 !important; margin: 0 !important; height: 100vh !important; overflow: hidden !important}
    .appViewContainer {padding: 0 !important; margin: 0 !important}
    .stElementContainer {padding: 0 !important; margin: 0 !important}
    main {padding: 0 !important; margin: 0 !important}
    [data-testid="stAppViewContainer"] {padding: 0 !important; overflow: hidden !important}
    div[data-testid="stVerticalBlock"] > [data-testid="stElementContainer"] {padding: 0 !important}
    [data-testid="manage-app-button"] {display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; position: absolute !important}
    [class*="Terminal"] {display: none !important}
    [class*="StateContainer"] {overflow: hidden !important}
    body {background: white !important; overflow: hidden !important}
    html {background: white !important; overflow: hidden !important}
</style>
"""
st.markdown(hide_streamlit_style, unsafe_allow_html=True)

# Hide manage button with JavaScript
st.markdown("""
<script>
function hideButton() {
  var button = document.querySelector('[data-testid="manage-app-button"]') ||
               document.querySelector('button[class*="Terminal"]') ||
               Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Manage'));
  if (button) {
    button.style.display = 'none !important';
  }
}
// Try immediately and then periodically
hideButton();
setTimeout(hideButton, 500);
setTimeout(hideButton, 1000);
setTimeout(hideButton, 2000);
</script>
""", unsafe_allow_html=True)

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
    st.markdown("## 🗺️ Utah Political Layers")
    st.markdown("Interactive map of Utah State House, Senate, and Congressional districts with party affiliation and population data.")
    st.markdown("---")
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

    st.markdown("""
    ### ℹ️ About
    - **Source**: [GitHub Repository](https://github.com/kpkpkp/utah-political-layers)
    - **Map**: [Direct Link](https://kpkpkp.github.io/utah-political-layers/)
    - **License**: All data sources are public/open
    - **Updates**: Redrawn after each 2020+ census
    """)
