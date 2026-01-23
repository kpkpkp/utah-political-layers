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
    /* Hide the sidebar */
    [data-testid="stSidebar"] {display: none !important}
    aside {display: none !important}
    [class*="Sidebar"] {display: none !important}
    section {background: transparent !important; padding: 0 !important; margin: 0 !important; width: 100% !important}
    .stMainBlockContainer {padding: 0 !important; margin: 0 !important; height: 100vh !important; overflow: hidden !important; width: 100% !important}
    .appViewContainer {padding: 0 !important; margin: 0 !important; width: 100% !important}
    .stElementContainer {padding: 0 !important; margin: 0 !important}
    main {padding: 0 !important; margin: 0 !important; width: 100% !important}
    [data-testid="stAppViewContainer"] {padding: 0 !important; overflow: hidden !important; width: 100% !important}
    div[data-testid="stVerticalBlock"] > [data-testid="stElementContainer"] {padding: 0 !important}
    [data-testid="manage-app-button"] {display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; position: fixed !important; left: -9999px !important; opacity: 0 !important; pointer-events: none !important}
    /* Hide Streamlit's terminal/manage button */
    button[class*="terminal" i] {display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; position: absolute !important; left: -99999px !important}
    button[class*="Manage"] {display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important}
    [class*="StateContainer"] {height: 100vh !important; max-height: 100vh !important; overflow: hidden !important; width: 100% !important}
    body {background: white !important; overflow: hidden !important}
    html {background: white !important; overflow: hidden !important}
</style>
"""
st.markdown(hide_streamlit_style, unsafe_allow_html=True)

# Hide manage button by removing it from DOM
st.markdown("""
<script>
function removeButton() {
  // Try to find and delete the button
  var buttons = document.querySelectorAll('[class*="terminalButton"], [class*="Terminal"], [data-testid="manage-app-button"], button:not([type="button"])');
  buttons.forEach(function(btn) {
    // Check if it contains "Manage" text
    if (btn.textContent.includes('Manage') || btn.className.includes('terminal')) {
      btn.parentElement.removeChild(btn);
      return;
    }
    // Otherwise just hide it aggressively
    btn.style.cssText = 'display:none!important;visibility:hidden!important;width:0!important;height:0!important;position:fixed!important;left:-99999px!important;';
  });
}
// Execute immediately and repeatedly
removeButton();
setTimeout(removeButton, 10);
setTimeout(removeButton, 50);
setTimeout(removeButton, 200);
setTimeout(removeButton, 500);
setTimeout(removeButton, 1000);
setTimeout(removeButton, 2000);
// Watch for new buttons added dynamically
window.addEventListener('load', removeButton);
document.addEventListener('DOMContentLoaded', removeButton);
var observer = new MutationObserver(removeButton);
observer.observe(document.documentElement, {childList: true, subtree: true, attributes: false});
</script>
""", unsafe_allow_html=True)

# Embed the GitHub Pages map - full screen
st.components.v1.html(
    '''
    <iframe
        src="https://kpkpkp.github.io/utah-political-layers/"
        width="100%"
        height="100vh"
        frameborder="0"
        scrolling="no"
        style="border: none; overflow: hidden; width: 100%; height: 100vh;"
    ></iframe>
    ''',
    height=1200
)

