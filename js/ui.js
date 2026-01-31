/**
 * UI module for DOM manipulation and rendering
 */

const UI = {
  // Cached DOM element references
  elements: {},

  /**
   * Initialize UI and cache DOM references
   */
  init() {
    this.elements = {
      loading: document.getElementById('loading'),
      results: document.getElementById('results'),
      error: document.getElementById('error'),
      analysis: document.getElementById('analysis'),
      analysisText: document.getElementById('analysisText'),
      keywords: document.getElementById('keywords'),
      keywordsList: document.getElementById('keywordsList'),
      marketsList: document.getElementById('marketsList'),
      progressText: document.getElementById('progressText'),
      screenshotPreview: document.getElementById('screenshotPreview'),
      screenshotImg: document.getElementById('screenshotImg'),
      settingsPanel: document.getElementById('settingsPanel'),
      geminiKey: document.getElementById('geminiKey'),
      geminiModel: document.getElementById('geminiModel'),
      showAnalysis: document.getElementById('showAnalysis'),
      apiKeyGroup: document.getElementById('apiKeyGroup'),
      nanoOption: document.getElementById('nanoOption'),
      saveBtn: document.getElementById('saveSettings'),
      refreshBtn: document.getElementById('refreshBtn')
    };
  },

  // ============ Loading State ============

  /**
   * Show loading indicator
   */
  showLoading() {
    this.elements.loading.classList.remove('hidden');
  },

  /**
   * Hide loading indicator with fade-out animation
   */
  hideLoading() {
    const loading = this.elements.loading;
    loading.classList.add('fade-out');
    setTimeout(() => {
      loading.classList.add('hidden');
      loading.classList.remove('fade-out');
      this.resetProgress();
    }, 400);
  },

  /**
   * Update progress milestone display
   * @param {string} stage - Current stage name
   * @param {string} text - Progress text to display
   */
  updateProgress(stage, text) {
    const milestones = document.querySelectorAll('.milestone');
    const connectors = document.querySelectorAll('.milestone-connector');
    const stageIndex = CONFIG.STAGES.indexOf(stage);

    milestones.forEach((milestone, index) => {
      milestone.classList.remove('active', 'completed');
      if (index < stageIndex) {
        milestone.classList.add('completed');
      } else if (index === stageIndex) {
        milestone.classList.add('active');
      }
    });

    connectors.forEach((connector, index) => {
      connector.classList.toggle('active', index < stageIndex);
    });

    if (this.elements.progressText) {
      this.elements.progressText.textContent = text;
    }
  },

  /**
   * Reset progress indicators to initial state
   */
  resetProgress() {
    const milestones = document.querySelectorAll('.milestone');
    const connectors = document.querySelectorAll('.milestone-connector');
    milestones.forEach(m => m.classList.remove('active', 'completed'));
    connectors.forEach(c => c.classList.remove('active'));

    // Hide screenshot preview
    if (this.elements.screenshotPreview) {
      this.elements.screenshotPreview.classList.add('hidden');
    }
  },

  // ============ Results Display ============

  /**
   * Show results container
   */
  showResults() {
    this.elements.results.classList.remove('hidden');
  },

  /**
   * Hide results container
   */
  hideResults() {
    this.elements.results.classList.add('hidden');
  },

  /**
   * Display analysis and market results
   * @param {Object} analysis - Analysis result with summary and keywords
   * @param {Array} events - Market events to display
   */
  displayResults(analysis, events) {
    // Display analysis and keywords (conditionally)
    if (AppState.showAnalysis) {
      this.renderAnalysis(analysis);
    } else {
      this.elements.analysis.classList.add('hidden');
      this.elements.keywords.classList.add('hidden');
    }

    // Display events/markets
    this.renderMarkets(events);

    // Show results, hide loading
    this.showResults();
    this.hideLoading();
  },

  /**
   * Render analysis section
   * @param {Object} analysis - Analysis result
   */
  renderAnalysis(analysis) {
    this.elements.analysisText.textContent = analysis.summary;
    this.elements.analysis.classList.remove('hidden');

    // Display keywords
    const keywords = analysis.keywords || [];
    this.elements.keywordsList.innerHTML = keywords.length > 0
      ? keywords.map(kw => `<span class="tag">${Utils.escapeHtml(kw)}</span>`).join('')
      : '';

    // Show keywords section if there are any keywords
    if (keywords.length > 0) {
      this.elements.keywords.classList.remove('hidden');
    } else {
      this.elements.keywords.classList.add('hidden');
    }
  },

  /**
   * Render markets list
   * @param {Array} events - Market events to display
   */
  renderMarkets(events) {
    if (events.length === 0) {
      this.elements.marketsList.innerHTML = `
        <div class="no-markets">
          <div class="no-markets-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <div class="no-markets-title">No matching markets found</div>
          <div class="no-markets-text">Try analyzing a page with topics that have active prediction markets on Polymarket</div>
        </div>
      `;
      return;
    }

    this.elements.marketsList.innerHTML = events.map(event => {
      // Sort markets by probability (highest first)
      const sortedMarkets = [...event.markets].sort((a, b) => b.probability - a.probability);

      // For events with multiple markets, show grouped view
      if (sortedMarkets.length > 1) {
        return this._renderMultiMarketEvent(event, sortedMarkets);
      } else {
        return this._renderSingleMarketEvent(event, sortedMarkets[0]);
      }
    }).join('');
  },

  /**
   * Render event card with multiple markets
   * @private
   */
  _renderMultiMarketEvent(event, sortedMarkets) {
    return `
      <div class="event-card">
        <div class="event-header">
          ${event.eventImage ? `<img class="event-image" src="${event.eventImage}" alt="" />` : ''}
          <div class="event-info">
            <div class="event-title">${Utils.escapeHtml(event.eventTitle)}</div>
            <div class="event-volume">$${Utils.formatVolume(event.eventVolume)} Vol.</div>
          </div>
        </div>
        <div class="outcomes-table">
          ${sortedMarkets.map(market => {
            const priceChange = Utils.calculatePriceChange(market.priceHistory);
            return `
            <div class="outcome-row">
              <span class="outcome-label">${Utils.escapeHtml(market.title)}</span>
              <div class="probability-circle" style="--progress: ${market.probability}">
                <svg viewBox="0 0 36 36">
                  <circle class="circle-bg" cx="18" cy="18" r="15.5"/>
                  <circle class="circle-fill" cx="18" cy="18" r="15.5"
                    stroke-dasharray="${market.probability}, 100"/>
                </svg>
                <span class="circle-text">${market.probability}</span>
              </div>
              ${priceChange ? `<span class="price-change ${priceChange.direction}">${priceChange.arrow}${priceChange.value}%</span>` : '<span class="price-change-placeholder"></span>'}
              ${Utils.generateSparkline(market.priceHistory, CONFIG.SPARKLINE_SMALL_WIDTH, CONFIG.SPARKLINE_SMALL_HEIGHT)}
              <span class="outcome-volume">$${Utils.formatVolume(market.volume)}</span>
            </div>
          `}).join('')}
        </div>
        <a href="${event.url}" target="_blank" class="market-link">View on Polymarket \u2192</a>
      </div>
    `;
  },

  /**
   * Render single market event card
   * @private
   */
  _renderSingleMarketEvent(event, market) {
    const priceChange = Utils.calculatePriceChange(market.priceHistory);
    return `
      <div class="market-card">
        <div class="market-title">${Utils.escapeHtml(market.question || event.eventTitle)}</div>
        <div class="market-probability-row">
          <div class="probability-circle large" style="--progress: ${market.probability}">
            <svg viewBox="0 0 36 36">
              <circle class="circle-bg" cx="18" cy="18" r="15.5"/>
              <circle class="circle-fill" cx="18" cy="18" r="15.5"
                stroke-dasharray="${market.probability}, 100"/>
            </svg>
            <span class="circle-text">${market.probability}</span>
          </div>
          ${priceChange ? `<span class="price-change ${priceChange.direction}">${priceChange.arrow}${priceChange.value}%</span>` : ''}
          ${Utils.generateSparkline(market.priceHistory)}
        </div>
        <div class="market-info">
          <span>Volume: $${Utils.formatVolume(market.volume || event.eventVolume)}</span>
        </div>
        <a href="${event.url}" target="_blank" class="market-link">View on Polymarket \u2192</a>
      </div>
    `;
  },

  // ============ Screenshot ============

  /**
   * Display screenshot preview
   * @param {string} dataUrl - Screenshot data URL
   */
  showScreenshot(dataUrl) {
    this.elements.screenshotImg.src = dataUrl;
    this.elements.screenshotPreview.classList.remove('hidden');
  },

  // ============ Settings ============

  /**
   * Toggle settings panel visibility
   */
  toggleSettings() {
    this.elements.settingsPanel.classList.toggle('hidden');
  },

  /**
   * Update API key input visibility based on model
   */
  updateApiKeyVisibility() {
    if (AppState.isUsingNano()) {
      this.elements.apiKeyGroup.classList.add('hidden');
    } else {
      this.elements.apiKeyGroup.classList.remove('hidden');
    }
  },

  /**
   * Show Nano option in model dropdown
   */
  showNanoOption() {
    this.elements.nanoOption.classList.remove('hidden');
  },

  /**
   * Show save success animation
   */
  showSaveSuccess() {
    const saveBtn = this.elements.saveBtn;
    const iconSave = saveBtn.querySelector('.icon-save');
    const iconCheck = saveBtn.querySelector('.icon-check');

    iconSave.classList.add('hidden');
    iconCheck.classList.remove('hidden');
    saveBtn.classList.add('saved');

    // Revert to save icon after 2 seconds
    setTimeout(() => {
      iconSave.classList.remove('hidden');
      iconCheck.classList.add('hidden');
      saveBtn.classList.remove('saved');
    }, 2000);
  },

  /**
   * Shake save button to indicate error
   */
  shakeSaveButton() {
    const saveBtn = this.elements.saveBtn;
    saveBtn.style.animation = 'shake 0.3s';
    setTimeout(() => saveBtn.style.animation = '', 300);
  },

  /**
   * Apply saved settings to UI
   */
  applySavedSettings() {
    if (AppState.geminiApiKey) {
      this.elements.geminiKey.value = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
    }
    this.elements.geminiModel.value = AppState.geminiModel;
    this.elements.showAnalysis.checked = AppState.showAnalysis;
  },

  // ============ Refresh Button ============

  /**
   * Show refresh button (for cached results)
   */
  showRefreshButton() {
    this.elements.refreshBtn.classList.remove('hidden');
  },

  /**
   * Hide refresh button
   */
  hideRefreshButton() {
    this.elements.refreshBtn.classList.add('hidden');
  },

  /**
   * Set refresh button spinning state
   * @param {boolean} spinning - Whether to show spinning animation
   */
  setRefreshSpinning(spinning) {
    if (spinning) {
      this.elements.refreshBtn.classList.add('spinning');
    } else {
      this.elements.refreshBtn.classList.remove('spinning');
    }
  },

  // ============ Error Handling ============

  /**
   * Show error message with retry button
   * @param {string} message - Error message to display
   */
  showError(message) {
    this.elements.error.innerHTML = `
      <div class="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="error-message">${Utils.escapeHtml(message)}</div>
      <button class="btn-retry" id="retryBtn">Try Again</button>
    `;
    this.elements.error.classList.remove('hidden');

    // Bind retry button
    document.getElementById('retryBtn').addEventListener('click', () => {
      this.hideError();
      // Trigger analysis through the global function
      if (typeof analyzeCurrentTab === 'function') {
        analyzeCurrentTab();
      }
    });
  },

  /**
   * Hide error message
   */
  hideError() {
    this.elements.error.classList.add('hidden');
  },

  // ============ Fallback Notice ============

  /**
   * Show fallback notice when rule-based analysis is used
   */
  showFallbackNotice() {
    const notice = document.getElementById('fallbackNotice');
    if (!notice) return;

    notice.innerHTML = `
      <div class="fallback-notice-content">
        <svg class="fallback-notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="fallback-notice-text">Using basic analysis mode. For better results, check your Gemini API key in settings.</span>
        <button class="fallback-notice-dismiss" title="Dismiss">&times;</button>
      </div>
    `;
    notice.classList.remove('hidden');

    // Bind dismiss button
    notice.querySelector('.fallback-notice-dismiss').addEventListener('click', () => {
      this.hideFallbackNotice();
    });
  },

  /**
   * Hide fallback notice
   */
  hideFallbackNotice() {
    const notice = document.getElementById('fallbackNotice');
    if (notice) {
      notice.classList.add('hidden');
    }
  },

  /**
   * Reset UI to initial state (no results displayed)
   * Used when navigating to a page with no cached results
   */
  resetToInitialState() {
    this.hideResults();
    this.hideError();
    this.hideRefreshButton();
    this.hideFallbackNotice();
    this.hideLoading();
    if (this.elements.screenshotPreview) {
      this.elements.screenshotPreview.classList.add('hidden');
    }
  }
};
