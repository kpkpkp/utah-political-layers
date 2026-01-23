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
    [data-testid="manage-app-button"] {display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; position: fixed !important; left: -9999px !important; opacity: 0 !important; pointer-events: none !important}
    /* Hide Streamlit's terminal/manage button */
    button[class*="terminal" i] {display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; position: absolute !important; left: -99999px !important}
    button[class*="Manage"] {display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important}
    [class*="StateContainer"] {height: 100vh !important; max-height: 100vh !important; overflow: hidden !important}
    body {background: white !important; overflow: hidden !important}
    html {background: white !important; overflow: hidden !important}
</style>
"""
st.markdown(hide_streamlit_style, unsafe_allow_html=True)

# Hide manage button with JavaScript
st.markdown("""
<script>
function hideButton() {
  // Target the specific terminal button class
  var buttons = document.querySelectorAll('[class*="terminalButton"], [class*="Terminal"], [data-testid="manage-app-button"]');
  buttons.forEach(function(btn) {
    btn.style.display = 'none';
    btn.style.visibility = 'hidden';
    btn.style.width = '0';
    btn.style.height = '0';
    btn.style.position = 'absolute';
    btn.style.left = '-99999px';
    btn.style.opacity = '0';
    btn.style.pointerEvents = 'none';
  });
}
// Try at multiple time intervals
hideButton();
setTimeout(hideButton, 50);
setTimeout(hideButton, 200);
setTimeout(hideButton, 500);
setTimeout(hideButton, 1000);
// Also monitor for dynamic changes
document.addEventListener('DOMContentLoaded', hideButton);
window.addEventListener('load', hideButton);
setTimeout(function() {
  var observer = new MutationObserver(hideButton);
  observer.observe(document.body, {childList: true, subtree: true, attributes: true});
}, 100);
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
