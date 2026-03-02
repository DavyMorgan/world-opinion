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

  // Cache settings
  CACHE_TTL_MS: 300000, // 5 minutes

  // URL tracking parameters to strip for cache normalization
  TRACKING_PARAMS: [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid',
    'ref', 'source', 'referrer', 'ref_src', 'ref_url',
    '_ga', '_gl', 'mc_cid', 'mc_eid'
  ],

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
  STAGES: ['chrome', 'gemini', 'polymarket', 'filter'],

  // Agent mode settings
  AGENT_MAX_ITERATIONS: 20,
  AGENT_MAX_SEARCHES: 8,
  AGENT_TEMPERATURE: 0.7,
  AGENT_MAX_TOKENS: 65536,

  AGENT_TOOL_DECLARATION: {
    functionDeclarations: [{
      name: 'search_polymarket',
      description: 'Search Polymarket prediction markets using one or more search queries. Results are automatically deduplicated across queries.',
      parameters: {
        type: 'OBJECT',
        properties: {
          queries: {
            type: 'ARRAY',
            description: 'Array of 1-5 search queries for prediction markets. Each query should target different aspects of the content.',
            items: { type: 'STRING' }
          }
        },
        required: ['queries']
      }
    }]
  },

  AGENT_SYSTEM_PROMPT: `You are a prediction market analyst. Given a web page's content:
1. Understand what the page is about
2. Identify 3-5 diverse search queries covering different aspects of the content
3. Call search_polymarket once with all your queries
4. If results are poor, try again with different/refined queries
5. Return your final analysis

You MUST call search_polymarket at least once with an array of 3-5 queries. When done, respond with JSON (no tool calls):
{
  "summary": "2-3 sentence summary",
  "keywords": ["keyword1", "keyword2", ...],
  "relevant_event_ids": ["eventId1", "eventId2", ...]
}
List up to 8 most relevant eventId values, ordered by relevance.`
};

// Freeze to prevent accidental modification
Object.freeze(CONFIG);
Object.freeze(CONFIG.STAGES);
