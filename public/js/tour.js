/**
 * @file tour.js
 * Interactive guided tour for Utah Political Layers
 */

/**
 * @typedef {Object} TourStep
 * @property {string} id - Unique identifier for the step
 * @property {string} title - Title displayed in the tour callout
 * @property {string} content - HTML content describing the step
 * @property {string} position - Position of callout: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
 * @property {Object} [mapView] - Optional map view to set for this step
 * @property {[number, number]} [mapView.center] - Lat/lng center coordinates
 * @property {number} [mapView.zoom] - Zoom level
 * @property {[[number, number], [number, number]]} [mapView.bounds] - Alternative to center/zoom: fit to bounds
 * @property {Object} layers - Layer visibility for this step
 * @property {boolean} [layers.boundary] - Show Utah boundary
 * @property {boolean} [layers.house] - Show State House districts
 * @property {boolean} [layers.senate] - Show State Senate districts
 * @property {boolean} [layers.congressCurrent] - Show current Congressional districts
 * @property {boolean} [layers.congressFuture] - Show future Congressional districts
 * @property {boolean} [layers.population] - Show population density
 * @property {Function} [onEnter] - Callback when entering this step
 * @property {Function} [onExit] - Callback when exiting this step
 * @property {number} [duration] - Optional auto-advance duration in milliseconds
 */

/**
 * Tour step definitions
 * @type {TourStep[]}
 */
const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Utah Political Layers',
    content: `
      <p>This interactive map helps you explore Utah's political districts and population distribution.</p>
      <p>You can view:</p>
      <ul>
        <li>State House districts (75 total)</li>
        <li>State Senate districts (29 total)</li>
        <li>Federal Congressional districts (current and future)</li>
        <li>Population density patterns</li>
      </ul>
      <p>Let's take a quick tour to see what you can do!</p>
    `,
    position: 'center',
    mapView: {
      bounds: [[37.0, -114.05], [42.0, -109.04]]
    },
    layers: {
      boundary: true,
      house: false,
      senate: false,
      congressCurrent: false,
      congressFuture: false,
      population: false
    }
  },

  {
    id: 'utah-boundary',
    title: 'Utah State Boundary',
    content: `
      <p>The dark outline shows Utah's state boundary.</p>
      <p>Utah is the 13th largest state by area (84,899 square miles) and stretches from the Colorado Plateau in the south to the Wasatch Range in the north.</p>
      <p>Notice how the state's borders follow longitude and latitude lines, creating a distinctive rectangular shape.</p>
    `,
    position: 'top-left',
    mapView: {
      bounds: [[37.0, -114.05], [42.0, -109.04]]
    },
    layers: {
      boundary: true,
      house: false,
      senate: false,
      congressCurrent: false,
      congressFuture: false,
      population: false
    }
  },

  {
    id: 'state-house',
    title: 'State House Districts',
    content: `
      <p>Utah's House of Representatives has <strong>75 districts</strong>, shown here in orange outlines.</p>
      <p>Each district elects one representative to the state legislature.</p>
      <p>We're zoomed in on the Salt Lake City area, where districts are smaller due to higher population density.</p>
      <p><em>Tip: Click any district to see details about its representative!</em></p>
    `,
    position: 'top-left',
    mapView: {
      center: [40.7608, -111.8910],
      zoom: 11
    },
    layers: {
      boundary: true,
      house: true,
      senate: false,
      congressCurrent: false,
      congressFuture: false,
      population: false
    }
  },

  {
    id: 'state-senate',
    title: 'State Senate Districts',
    content: `
      <p>Utah's Senate has <strong>29 districts</strong>, shown in gray outlines.</p>
      <p>Senate districts are larger than House districts, as each senator represents more constituents.</p>
      <p>Notice how the districts are layered - you can see both House and Senate boundaries at the same time!</p>
      <p>The color fills show which party currently holds each seat.</p>
    `,
    position: 'top-left',
    mapView: {
      center: [40.7608, -111.8910],
      zoom: 10.5
    },
    layers: {
      boundary: true,
      house: true,
      senate: true,
      congressCurrent: false,
      congressFuture: false,
      population: false
    }
  },

  {
    id: 'congress-current',
    title: 'Federal Congressional Districts',
    content: `
      <p>Utah currently has <strong>4 Congressional districts</strong> (shown in gold outlines).</p>
      <p>These are for U.S. House of Representatives seats in Washington, D.C.</p>
      <p>Congressional districts are much larger than state legislative districts, as they represent significantly more people.</p>
      <p>Let's zoom out to see all four districts across the entire state.</p>
    `,
    position: 'top-left',
    mapView: {
      bounds: [[36.9, -114.1], [42.1, -109.0]]
    },
    layers: {
      boundary: true,
      house: false,
      senate: false,
      congressCurrent: true,
      congressFuture: false,
      population: false
    }
  },

  {
    id: 'congress-future',
    title: 'Future Congressional Districts',
    content: `
      <p>After the 2020 Census, Utah's <strong>4 Congressional districts</strong> were redrawn to reflect population shifts (shown with orange dashed lines).</p>
      <p>Compare these boundaries with the current districts to see how representation areas have changed.</p>
      <p>Notice the dashed style - this helps distinguish the redrawn districts from current ones.</p>
    `,
    position: 'top-left',
    mapView: {
      bounds: [[36.9, -114.1], [42.1, -109.0]]
    },
    layers: {
      boundary: true,
      house: false,
      senate: false,
      congressCurrent: true,
      congressFuture: true,
      population: false
    }
  },

  {
    id: 'population',
    title: 'Population Density',
    content: `
      <p>The peach dots show <strong>population density</strong> across Utah.</p>
      <p>Each dot represents a census block with 5 or more residents.</p>
      <p>Larger, darker dots indicate higher population density.</p>
      <p>Notice how most of Utah's population clusters along the Wasatch Front (the I-15 corridor from Provo to Ogden).</p>
      <p><em>Tip: Click any dot to see the population and area of that census block!</em></p>
    `,
    position: 'top-left',
    mapView: {
      center: [40.2338, -111.6585],
      zoom: 8.5
    },
    layers: {
      boundary: true,
      house: false,
      senate: false,
      congressCurrent: true,
      congressFuture: false,
      population: true
    }
  },

  {
    id: 'layering',
    title: 'Combining Layers',
    content: `
      <p>The real power comes from viewing multiple layers together!</p>
      <p>Here you can see how House districts, Senate districts, and population density all interact.</p>
      <p>This helps you understand:</p>
      <ul>
        <li>How district boundaries align with population centers</li>
        <li>Which areas are more densely represented</li>
        <li>How state and federal districts overlap</li>
      </ul>
    `,
    position: 'top-left',
    mapView: {
      center: [40.7608, -111.8910],
      zoom: 11
    },
    layers: {
      boundary: true,
      house: true,
      senate: true,
      congressCurrent: false,
      congressFuture: false,
      population: true
    }
  },

  {
    id: 'controls',
    title: 'Interactive Controls',
    content: `
      <p>Use the control panel on the right to:</p>
      <ul>
        <li><strong>Toggle layers</strong> on/off with checkboxes</li>
        <li><strong>Change colors</strong> for each layer type</li>
        <li><strong>Adjust line width & opacity</strong> for better visibility</li>
        <li><strong>Enable/disable party colors</strong> to focus on boundaries</li>
        <li><strong>Switch base map styles</strong> (street, terrain, satellite, etc.)</li>
      </ul>
      <p>Click the collapse button (◀) to hide the panel and expand your map view.</p>
    `,
    position: 'top-left',
    mapView: {
      bounds: [[37.0, -114.05], [42.0, -109.04]]
    },
    layers: {
      boundary: true,
      house: true,
      senate: true,
      congressCurrent: true,
      congressFuture: false,
      population: false
    }
  },

  {
    id: 'conclusion',
    title: 'Start Exploring!',
    content: `
      <p>You're all set to explore Utah's political landscape!</p>
      <p><strong>Try these actions:</strong></p>
      <ul>
        <li>Pan and zoom to explore different regions</li>
        <li>Click districts to see representatives</li>
        <li>Toggle layers to compare boundaries</li>
        <li>Adjust colors and styles to your preference</li>
        <li>Click population dots to see census block details</li>
      </ul>
      <p>Your view settings are automatically saved, so you can pick up where you left off.</p>
      <p><em>Enjoy exploring!</em></p>
    `,
    position: 'top-left',
    mapView: {
      bounds: [[37.0, -114.05], [42.0, -109.04]]
    },
    layers: {
      boundary: true,
      house: true,
      senate: true,
      congressCurrent: true,
      congressFuture: false,
      population: false
    }
  }
];

/**
 * Tour Controller Class
 * Manages the guided tour experience
 */
class TourController {
  /**
   * @param {L.Map} map - Leaflet map instance
   * @param {Object} layerState - Layer state object from app.js
   */
  constructor(map, layerState) {
    this.map = map;
    this.layerState = layerState;
    this.currentStepIndex = -1;
    this.isActive = false;
    this.elements = {};
    this.originalLayerState = {};
    this.originalMapView = null;

    this.TOUR_STORAGE_KEY = 'utah-tour-completed';
    this.hasSeenTour = localStorage.getItem(this.TOUR_STORAGE_KEY) === 'true';
  }

  /**
   * Initialize tour UI elements
   */
  createTourElements() {
    // Create overlay backdrop
    const overlay = document.createElement('div');
    overlay.id = 'tour-overlay';
    overlay.className = 'tour-overlay';
    document.body.appendChild(overlay);

    // Create callout container
    const callout = document.createElement('div');
    callout.id = 'tour-callout';
    callout.className = 'tour-callout';
    document.body.appendChild(callout);

    // Create progress indicator
    const progress = document.createElement('div');
    progress.id = 'tour-progress';
    progress.className = 'tour-progress';
    callout.appendChild(progress);

    // Create title
    const title = document.createElement('h2');
    title.id = 'tour-title';
    title.className = 'tour-title';
    callout.appendChild(title);

    // Create content area
    const content = document.createElement('div');
    content.id = 'tour-content';
    content.className = 'tour-content';
    callout.appendChild(content);

    // Create button container
    const buttons = document.createElement('div');
    buttons.id = 'tour-buttons';
    buttons.className = 'tour-buttons';
    callout.appendChild(buttons);

    // Create Skip button
    const skipBtn = document.createElement('button');
    skipBtn.id = 'tour-skip';
    skipBtn.className = 'tour-button tour-skip';
    skipBtn.textContent = 'Skip Tour';
    skipBtn.onclick = () => this.skip();
    buttons.appendChild(skipBtn);

    // Create Previous button
    const prevBtn = document.createElement('button');
    prevBtn.id = 'tour-prev';
    prevBtn.className = 'tour-button tour-prev';
    prevBtn.textContent = '← Previous';
    prevBtn.onclick = () => this.previous();
    buttons.appendChild(prevBtn);

    // Create Next button
    const nextBtn = document.createElement('button');
    nextBtn.id = 'tour-next';
    nextBtn.className = 'tour-button tour-next';
    nextBtn.textContent = 'Next →';
    nextBtn.onclick = () => this.next();
    buttons.appendChild(nextBtn);

    this.elements = {
      overlay,
      callout,
      progress,
      title,
      content,
      buttons,
      skipBtn,
      prevBtn,
      nextBtn
    };

    this._isMobile = window.matchMedia('(max-width: 768px)').matches;
  }

  /**
   * Position the callout at the bottom of the visible viewport.
   * Uses screen.availHeight inside iframes where innerHeight is oversized.
   */
  positionCallout() {
    if (!this._isMobile) return;
    const callout = this.elements.callout;
    if (!callout) return;
    // In iframes, position:fixed uses the iframe viewport (2000px), not the
    // visible area. Use map height as proxy: the visible phone screen bottom
    // is approximately 68% of map height (map = screen.availHeight, minus
    // browser chrome). Align callout bottom to that edge.
    const mapEl = document.getElementById('map');
    const mapH = mapEl ? mapEl.offsetHeight : (screen.availHeight || 700);
    const visibleBottom = Math.round(mapH * 0.78);
    callout.style.position = 'fixed';
    requestAnimationFrame(() => {
      const h = callout.offsetHeight;
      const top = visibleBottom - h;
      callout.style.top = Math.max(8, top) + 'px';
      // If content is taller than available space, constrain and scroll
      if (top < 8) {
        callout.style.top = '8px';
        callout.style.maxHeight = (visibleBottom - 16) + 'px';
        callout.style.overflowY = 'auto';
      }
    });
  }

  /**
   * Save current layer and map state
   */
  saveCurrentState() {
    // Save layer visibility
    this.originalLayerState = {
      boundary: this.map.hasLayer(this.layerState.boundary),
      house: this.map.hasLayer(this.layerState.house),
      senate: this.map.hasLayer(this.layerState.senate),
      congressCurrent: this.map.hasLayer(this.layerState.congressCurrent),
      congressFuture: this.map.hasLayer(this.layerState.congressFuture),
      population: this.map.hasLayer(this.layerState.population)
    };

    // Save map view
    const center = this.map.getCenter();
    this.originalMapView = {
      center: [center.lat, center.lng],
      zoom: this.map.getZoom()
    };
  }

  /**
   * Restore original layer and map state
   */
  restoreOriginalState() {
    // Restore layer visibility and sync checkboxes
    Object.keys(this.originalLayerState).forEach(layerKey => {
      const layer = this.layerState[layerKey];
      const shouldShow = this.originalLayerState[layerKey];

      if (layer) {
        if (shouldShow && !this.map.hasLayer(layer)) {
          layer.addTo(this.map);
        } else if (!shouldShow && this.map.hasLayer(layer)) {
          this.map.removeLayer(layer);
        }
      }

      // Sync checkbox to match restored layer state
      const checkboxId = `toggle-${layerKey === 'congressCurrent' ? 'congress-current' :
                                    layerKey === 'congressFuture' ? 'congress-future' :
                                    layerKey}`;
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) {
        checkbox.checked = shouldShow;
      }
    });

    // Restore map view
    if (this.originalMapView) {
      this.map.setView(this.originalMapView.center, this.originalMapView.zoom);
    }
  }

  /**
   * Start the tour
   */
  start() {
    if (this.isActive) {
      console.warn('Tour is already active');
      return;
    }

    this.isActive = true;
    this.currentStepIndex = -1;

    // Save current state
    this.saveCurrentState();

    // Create tour elements
    this.createTourElements();

    // Start with first step
    this.next();

    // Track tour start
    if (typeof trackEvent !== 'undefined') {
      trackEvent('tour_started', { step_count: tourSteps.length });
    }
  }

  /**
   * Advance to next step
   */
  next() {
    if (!this.isActive) return;

    const nextIndex = this.currentStepIndex + 1;

    if (nextIndex >= tourSteps.length) {
      this.complete();
      return;
    }

    this.goToStep(nextIndex);
  }

  /**
   * Go to previous step
   */
  previous() {
    if (!this.isActive || this.currentStepIndex <= 0) return;

    this.goToStep(this.currentStepIndex - 1);
  }

  /**
   * Skip the tour
   */
  skip() {
    if (!this.isActive) return;

    if (typeof trackEvent !== 'undefined') {
      trackEvent('tour_skipped', {
        step_id: tourSteps[this.currentStepIndex]?.id,
        step_index: this.currentStepIndex
      });
    }

    this.end();
  }

  /**
   * Complete the tour
   */
  complete() {
    if (typeof trackEvent !== 'undefined') {
      trackEvent('tour_completed', { step_count: tourSteps.length });
    }

    // Mark tour as completed
    localStorage.setItem(this.TOUR_STORAGE_KEY, 'true');
    this.hasSeenTour = true;

    this.end();
  }

  /**
   * End the tour (cleanup)
   */
  end() {
    if (!this.isActive) return;

    // Call onExit for current step
    const currentStep = tourSteps[this.currentStepIndex];
    if (currentStep?.onExit) {
      currentStep.onExit(this);
    }

    this.isActive = false;
    this.currentStepIndex = -1;

    // Remove tour elements
    Object.values(this.elements).forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    this.elements = {};

    // Restore original state
    this.restoreOriginalState();
  }

  /**
   * Navigate to a specific step
   * @param {number} stepIndex - Index of the step to show
   */
  goToStep(stepIndex) {
    if (!this.isActive || stepIndex < 0 || stepIndex >= tourSteps.length) {
      return;
    }

    // Call onExit for current step
    const currentStep = tourSteps[this.currentStepIndex];
    if (currentStep?.onExit) {
      currentStep.onExit(this);
    }

    this.currentStepIndex = stepIndex;
    const step = tourSteps[stepIndex];

    // Execute step actions
    this.executeStep(step);

    // Update UI
    this.updateStepUI(step);
    this.positionCallout();

    // Call onEnter for new step
    if (step.onEnter) {
      step.onEnter(this);
    }

    // Track step view
    if (typeof trackEvent !== 'undefined') {
      trackEvent('tour_step_viewed', {
        step_id: step.id,
        step_index: stepIndex,
        step_title: step.title
      });
    }
  }

  /**
   * Execute step actions (map view, layer visibility)
   * @param {TourStep} step - The step to execute
   */
  executeStep(step) {
    // Update map view
    if (step.mapView) {
      if (step.mapView.bounds) {
        this.map.fitBounds(step.mapView.bounds, {
          padding: [20, 20],
          animate: true,
          duration: 1.0
        });
      } else if (step.mapView.center && typeof step.mapView.zoom === 'number') {
        this.map.setView(step.mapView.center, step.mapView.zoom, {
          animate: true,
          duration: 1.0
        });
      }
    }

    // Update layer visibility
    if (step.layers) {
      Object.keys(step.layers).forEach(layerKey => {
        const layer = this.layerState[layerKey];
        const shouldShow = step.layers[layerKey];

        if (layer) {
          if (shouldShow && !this.map.hasLayer(layer)) {
            layer.addTo(this.map);

            // Update checkbox if it exists
            const checkboxId = `toggle-${layerKey === 'congressCurrent' ? 'congress-current' :
                                        layerKey === 'congressFuture' ? 'congress-future' :
                                        layerKey}`;
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
              checkbox.checked = true;
            }
          } else if (!shouldShow && this.map.hasLayer(layer)) {
            this.map.removeLayer(layer);

            // Update checkbox if it exists
            const checkboxId = `toggle-${layerKey === 'congressCurrent' ? 'congress-current' :
                                        layerKey === 'congressFuture' ? 'congress-future' :
                                        layerKey}`;
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
              checkbox.checked = false;
            }
          }
        }
      });
    }
  }

  /**
   * Update the tour UI for the current step
   * @param {TourStep} step - The current step
   */
  updateStepUI(step) {
    const { callout, progress, title, content, prevBtn, nextBtn } = this.elements;

    // Update position class
    callout.className = `tour-callout tour-position-${step.position}`;

    // Update progress indicator
    progress.textContent = `Step ${this.currentStepIndex + 1} of ${tourSteps.length}`;

    // Update title
    title.textContent = step.title;

    // Update content
    content.innerHTML = step.content;

    // Update button visibility
    prevBtn.style.display = this.currentStepIndex > 0 ? 'inline-block' : 'none';

    // Update Next button text for last step
    if (this.currentStepIndex === tourSteps.length - 1) {
      nextBtn.textContent = 'Finish';
    } else {
      nextBtn.textContent = 'Next →';
    }

    // Auto-advance if duration is specified
    if (step.duration) {
      setTimeout(() => {
        if (this.isActive && this.currentStepIndex === tourSteps.indexOf(step)) {
          this.next();
        }
      }, step.duration);
    }
  }

  /**
   * Check if user should see the tour
   * @returns {boolean}
   */
  shouldShowTour() {
    return !this.hasSeenTour;
  }

  /**
   * Reset tour completion status
   */
  resetTourStatus() {
    localStorage.removeItem(this.TOUR_STORAGE_KEY);
    this.hasSeenTour = false;
  }
}

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.TourController = TourController;
  window.tourSteps = tourSteps;
}
