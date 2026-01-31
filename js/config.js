/**
 * Configuration constants for World Opinion Chrome Extension
 */

const CONFIG = {
  // Content extraction limits
  CONTENT_MAX_LENGTH: 5000,
  NANO_CONTENT_MAX_LENGTH: 3000,

  // Search and display limits
  MAX_KEYWORDS_TO_SEARCH: 5,
  MAX_MARKETS_TO_DISPLAY: 8,

  // Gemini API settings
  GEMINI_TEMPERATURE: 0.7,
  GEMINI_MAX_TOKENS: 2048,
  FILTER_TEMPERATURE: 0.1,
  FILTER_MAX_TOKENS: 256,
  FILTER_MODEL: 'gemini-2.5-flash-lite',

  // Nano settings
  NANO_TOP_K: 3,

  // Sparkline visualization
  SPARKLINE_WIDTH: 60,
  SPARKLINE_HEIGHT: 20,
  SPARKLINE_SMALL_WIDTH: 40,
  SPARKLINE_SMALL_HEIGHT: 16,

  // Colors
  COLOR_TREND_UP: '#22c55e',
  COLOR_TREND_DOWN: '#ef4444',

  // API endpoints
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
  POLYMARKET_SEARCH_API: 'https://gamma-api.polymarket.com/public-search',
  POLYMARKET_PRICE_HISTORY_API: 'https://clob.polymarket.com/prices-history',

  // Progress stages
  STAGES: ['chrome', 'gemini', 'polymarket', 'filter']
};

// Freeze to prevent accidental modification
Object.freeze(CONFIG);
Object.freeze(CONFIG.STAGES);
