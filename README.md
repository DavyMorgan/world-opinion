# World Opinion

A Chrome extension that analyzes the current tab, finds related prediction markets on Polymarket, and displays the current probability. The analysis is performed using the Gemini API, and prediction market data is accessed through the Polymarket API.

🌐 **Project Page**: [davymorgan.github.io/world-opinion](https://davymorgan.github.io/world-opinion/) | 🧩 **Chrome Web Store**: [Install Extension](https://chromewebstore.google.com/detail/world-opinion/mflfnnkpkkhcapmgaapjjhlncalfglce)

## Features

- 🔍 **Smart Content Analysis**: Uses Google's Gemini AI to analyze the current web page and extract relevant topics
- 📊 **Polymarket Integration**: Automatically finds related prediction markets on Polymarket
- 💹 **Real-time Probabilities**: Displays current market probabilities for related predictions
- ⚙️ **Easy Configuration**: Simple setup with your Gemini API key
- 🎨 **Modern UI**: Clean, intuitive interface with gradient design
- 🔒 **Privacy-First**: No backend servers, no data collection, no tracking—all processing happens directly in your browser
- 🏠 **On-Device AI Option**: Use Gemini Nano for 100% local analysis—your data never leaves your device

## Screenshot

![World Opinion extension](screenshots/screenshot.png)

## Installation

### Prerequisites

- Google Chrome browser
- Gemini API key (get one from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Option 1: Download CRX (Recommended)

1. Download `world-opinion.crx` from the [latest release](https://github.com/DavyMorgan/world-opinion/releases/latest)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Drag and drop the `.crx` file onto the page

### Option 2: Load Unpacked (For Developers)

1. Clone or download this repository
   ```bash
   git clone https://github.com/DavyMorgan/world-opinion.git
   cd world-opinion
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked" and select the project directory

### Configure Your API Key

1. Click the World Opinion extension icon in your Chrome toolbar
2. Click the ⚙️ Settings button
3. Enter your Gemini API key
4. Click "Save Settings"

## Usage

1. Navigate to any web page you want to analyze (news article, blog post, etc.)
2. Click the World Opinion extension icon
3. Click "🌍 See How World Says"
4. Wait for the analysis to complete
5. View related prediction markets and their current probabilities
6. Click on any market to view it on Polymarket

## How It Works

1. **Content Extraction**: The extension extracts text content from the current web page
2. **AI Analysis**: The Gemini API analyzes the content and identifies key topics, entities, and events
3. **Market Search**: Using the extracted keywords, the extension searches Polymarket's API for related prediction markets
4. **Display Results**: Related markets are displayed with their current probabilities and other relevant information

## API Integration

### Gemini API

The extension uses Google's Gemini Pro model to analyze web content. The API:
- Processes page titles, descriptions, and main content
- Extracts relevant keywords and topics
- Identifies entities and events that might have prediction markets

### Polymarket API

The extension queries Polymarket's CLOB (Central Limit Order Book) API to:
- Search for active prediction markets
- Retrieve market probabilities
- Get market metadata (volume, descriptions, etc.)

## Privacy & Security

**World Opinion is designed with privacy as a core principle.** Unlike many extensions that route your data through their servers, World Opinion has **no backend servers**—all processing happens directly in your browser.

### Why This Matters

| Traditional Extensions | World Opinion |
|------------------------|---------------|
| Your data → Their servers → API | Your data → API directly |
| They can log, analyze, sell your data | No intermediary, no data exposure |
| Requires trusting the extension developer | Trust is verifiable (open source) |

### Our Privacy Guarantees

- **🚫 No Backend Servers**: Your data never touches our servers because we don't have any
- **🔐 Local Storage Only**: Your API key is stored locally in Chrome's storage, never transmitted except to Google's API
- **📡 Direct API Calls**: Page content goes directly from your browser to Google Gemini—no middleman
- **🙈 No Tracking**: No analytics, no usage statistics, no cookies, no user accounts
- **👆 User-Initiated Only**: Data is only processed when you click "See How World Says"—never in the background
- **📖 Open Source**: Review our code anytime to verify these claims

### 🏠 Maximum Privacy: Gemini Nano (On-Device AI)

For users who want **absolute privacy**, World Opinion supports **Gemini Nano**—Google's on-device AI model that runs entirely on your computer:

- **Zero Network Transmission**: Your page content never leaves your device
- **No API Key Required**: Works without any external service
- **Instant Processing**: No network latency, faster results
- **Available Automatically**: If your device supports Gemini Nano, it appears as an option in Settings

With Gemini Nano, the only network calls are to Polymarket to fetch market data—the AI analysis happens 100% locally.

See our full [Privacy Policy](PRIVACY_POLICY.md) for complete details.

## Development

### Project Structure

```
world-opinion/
├── manifest.json          # Chrome extension manifest (V3)
├── sidepanel.html         # Extension side panel UI
├── sidepanel.css          # Side panel styling
├── background.js          # Background service worker
├── index.html             # Landing page
├── js/                    # JavaScript modules
│   ├── app.js             # Main application entry point
│   ├── api-gemini.js      # Gemini API integration
│   ├── api-polymarket.js  # Polymarket API integration
│   ├── cache.js           # Caching utilities
│   ├── config.js          # Configuration constants
│   ├── state.js           # State management
│   ├── ui.js              # UI rendering logic
│   └── utils.js           # Helper functions
├── icons/                 # Extension icons
│   ├── icon.svg           # Source icon (transparent)
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── chrome.png         # Progress indicator icon
│   ├── gemini.png         # Progress indicator icon
│   └── polymarket.png     # Progress indicator icon
├── assets/                # Landing page assets
├── screenshots/           # Store screenshots
├── PRIVACY_POLICY.md      # Privacy policy
└── README.md              # This file
```

### Technologies Used

- **Chrome Extension Manifest V3**: Latest extension format
- **Gemini API**: AI-powered content analysis
- **Polymarket API**: Prediction market data
- **Vanilla JavaScript**: No frameworks, lightweight and fast
- **CSS3**: Modern styling with gradients and animations

## Troubleshooting

### "Please configure your Gemini API key"
- Make sure you've entered a valid API key in the settings
- Verify your API key is active at [Google AI Studio](https://makersuite.google.com/)

### "Failed to extract page content"
- Some pages may block content script injection
- Try the extension on a different page
- Ensure the page has loaded completely

### "No related prediction markets found"
- The current page topic may not have active markets on Polymarket
- Try a page with more specific, event-driven content (politics, sports, etc.)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Disclaimer

This extension is for informational purposes only. Always do your own research before participating in prediction markets. The extension is not affiliated with Polymarket or Google.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
