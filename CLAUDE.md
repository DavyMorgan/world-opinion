# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

World Opinion is a Chrome Extension (Manifest V3) that analyzes web page content using Google's Gemini AI and finds related prediction markets on Polymarket. It displays real-time probabilities for matching markets.

## Development Commands

This is a vanilla JavaScript Chrome extension with no build system, package manager, or test framework.

**Load the extension for development:**
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project directory

**Reload after changes:** Click the refresh icon on the extension card in `chrome://extensions`

## Architecture

```
User clicks "Analyze" → popup.js orchestrates:
  1. Content extraction (inject script into active tab)
  2. Gemini API analysis (extract keywords/topics)
  3. Polymarket API search (find matching markets)
  4. Render results as market cards
```

### Key Files

- **popup.js** (337 lines): Main application logic - content extraction, API calls, results rendering
- **popup.html/css**: Extension popup UI with gradient theme
- **background.js**: Minimal service worker (placeholder for future expansion)
- **manifest.json**: Manifest V3 config with `activeTab`, `storage`, `scripting` permissions

### External APIs

| API | Endpoint | Auth |
|-----|----------|------|
| Gemini | `generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent` | User API key |
| Polymarket | `gamma-api.polymarket.com/public-search` | None |

### Data Flow

1. `extractPageContent()` - Injects content script via `chrome.scripting.executeScript`, extracts title, meta description, and main content (max 5000 chars)
2. `analyzeWithGemini()` - Sends content to Gemini, expects JSON with `summary`, `keywords`, `topics`
3. `searchPolymarket()` - Searches first 5 keywords via Gamma API, deduplicates, returns top 8 markets
4. `displayResults()` - Renders analysis and market cards with probabilities

### Chrome APIs Used

- `chrome.tabs.query()` - Get active tab
- `chrome.storage.local` - Store Gemini API key
- `chrome.scripting.executeScript()` - Inject content extraction script

## Code Patterns

- Promise-based async/await for all API calls
- `escapeHtml()` used for XSS prevention when rendering market titles
- `formatVolume()` converts numbers to M/K notation
- Settings panel toggle with `chrome.storage.local` persistence
