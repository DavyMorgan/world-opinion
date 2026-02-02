/**
 * Application state management
 */

const AppState = {
  geminiApiKey: '',
  geminiModel: 'gemini-3-flash-preview',
  showAnalysis: false,

  // Track when fallback to rule-based analysis is used
  fallbackUsed: {
    analysis: false,
    filter: false
  },

  /**
   * Reset fallback flags (call at start of analysis)
   */
  resetFallbackFlags() {
    this.fallbackUsed = { analysis: false, filter: false };
  },

  /**
   * Load state from Chrome storage
   */
  async load() {
    const settings = await chrome.storage.local.get(['geminiApiKey', 'geminiModel', 'showAnalysis']);

    if (settings.geminiApiKey) {
      this.geminiApiKey = settings.geminiApiKey;
    }
    if (settings.geminiModel) {
      this.geminiModel = settings.geminiModel;
    }
    this.showAnalysis = settings.showAnalysis || false;
  },

  /**
   * Save a single setting to Chrome storage
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  async save(key, value) {
    this[key] = value;
    await chrome.storage.local.set({ [key]: value });
  },

  /**
   * Check if using Gemini Nano (on-device)
   * @returns {boolean}
   */
  isUsingNano() {
    return this.geminiModel === 'gemini-nano';
  },

  /**
   * Check if API key is configured when required
   * @returns {boolean}
   */
  hasRequiredApiKey() {
    // Nano doesn't require API key
    if (this.isUsingNano()) return true;
    return Boolean(this.geminiApiKey);
  },

  /**
   * Check if Gemini Nano is available on this device
   * @returns {Promise<boolean>}
   */
  async checkNanoAvailability() {
    try {
      if (typeof LanguageModel === 'undefined') return false;
      const availability = await LanguageModel.availability({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }]
      });
      return availability !== 'unavailable';
    } catch (e) {
      console.log('Gemini Nano not available:', e.message);
      return false;
    }
  }
};
