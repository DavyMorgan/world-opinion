/**
 * Application state management
 */

const AppState = {
  geminiApiKey: '',
  geminiModel: 'gemini-3-flash-preview',
  showAnalysis: false,

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
      const availability = await LanguageModel.availability();
      return availability !== 'unavailable';
    } catch (e) {
      console.log('Gemini Nano not available:', e.message);
      return false;
    }
  }
};
