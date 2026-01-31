/**
 * Main application entry point and orchestration
 */

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the application
 */
async function init() {
  // Initialize UI and cache DOM elements
  UI.init();

  // Load saved settings
  await AppState.load();
  UI.applySavedSettings();

  // Check if Gemini Nano is available
  const nanoAvailable = await AppState.checkNanoAvailability();
  if (nanoAvailable) {
    UI.showNanoOption();
  }

  // Setup event listeners
  setupEventListeners();

  // Set initial API key visibility based on saved model
  UI.updateApiKeyVisibility();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  document.getElementById('settingsBtn').addEventListener('click', () => UI.toggleSettings());
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('analyzeBtn').addEventListener('click', analyzeCurrentTab);

  document.getElementById('showAnalysis').addEventListener('change', async (e) => {
    await AppState.save('showAnalysis', e.target.checked);
  });

  document.getElementById('geminiModel').addEventListener('change', async (e) => {
    await AppState.save('geminiModel', e.target.value);
    UI.updateApiKeyVisibility();
  });
}

/**
 * Save settings from UI
 */
async function saveSettings() {
  const geminiKey = UI.elements.geminiKey.value;

  if (!geminiKey || geminiKey === '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022') {
    UI.shakeSaveButton();
    return;
  }

  try {
    await AppState.save('geminiApiKey', geminiKey);
    UI.showSaveSuccess();
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Capture screenshot of current tab
 * @returns {Promise<string|null>} Base64 encoded screenshot or null
 */
async function captureScreenshot() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 });
    UI.showScreenshot(dataUrl);

    // Extract base64 data from data URL (remove "data:image/jpeg;base64," prefix)
    return dataUrl.split(',')[1];
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return null; // Continue without screenshot if capture fails
  }
}

/**
 * Extract content from the current page
 * @param {Object} tab - Chrome tab object
 * @returns {Promise<Object>} Extracted page content
 */
async function extractPageContent(tab) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Extract meaningful text from the page
        const title = document.title;
        const metaDescription = document.querySelector('meta[name="description"]')?.content || '';

        // Get main content (try to avoid navigation, headers, footers)
        const mainContent = document.querySelector('main, article, [role="main"]');
        const bodyText = mainContent ? mainContent.innerText : document.body.innerText;

        // Limit text length to avoid overwhelming the API
        const text = bodyText.substring(0, 5000);

        return {
          title,
          description: metaDescription,
          text
        };
      }
    });

    return results[0].result;
  } catch (error) {
    console.error('Error extracting page content:', error);
    throw new Error('Failed to extract page content. The page may not allow script injection.');
  }
}

/**
 * Main analysis pipeline - orchestrates the entire flow
 */
async function analyzeCurrentTab() {
  // Check if API key is configured (not required for Nano)
  if (!AppState.hasRequiredApiKey()) {
    UI.showError('Please configure your Gemini API key in settings first.');
    return;
  }

  try {
    // Show loading state
    UI.showLoading();
    UI.resetProgress();
    UI.hideError();
    UI.hideResults();

    // Stage 1: Chrome - Extract content
    UI.updateProgress('chrome', 'Extracting page content...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('No active tab found');
    }

    // Extract page content and capture screenshot in parallel
    const [pageContent, screenshot] = await Promise.all([
      extractPageContent(tab),
      captureScreenshot()
    ]);

    // Stage 2: Gemini - Analyze with AI
    const usingNano = AppState.isUsingNano();
    UI.updateProgress('gemini', usingNano ? 'Analyzing with on-device AI...' : 'Analyzing with AI...');
    const analysis = await GeminiService.analyze(pageContent, tab.title, tab.url, screenshot);

    // Stage 3: Polymarket - Search markets
    UI.updateProgress('polymarket', 'Searching prediction markets...');
    const markets = await PolymarketService.search(analysis.keywords);

    // Stage 4: Filter - Rank events by relevance
    UI.updateProgress('filter', 'Filtering results...');
    const filteredMarkets = await GeminiService.filterEvents(markets, analysis);

    // Fetch price history for all markets in parallel
    const marketsWithHistory = await PolymarketService.enrichWithPriceHistory(filteredMarkets);

    // Display results
    UI.displayResults(analysis, marketsWithHistory);

  } catch (error) {
    console.error('Analysis error:', error);
    UI.showError(error.message);
    UI.hideLoading();
  }
}
