# World Opinion

A Chrome extension that analyzes the current tab, finds related prediction markets on Polymarket, and displays the current probability. The analysis is performed using the Gemini API, and prediction market data is accessed through the Polymarket API.

## Features

- 🔍 **Smart Content Analysis**: Uses Google's Gemini AI to analyze the current web page and extract relevant topics
- 📊 **Polymarket Integration**: Automatically finds related prediction markets on Polymarket
- 💹 **Real-time Probabilities**: Displays current market probabilities for related predictions
- ⚙️ **Easy Configuration**: Simple setup with your Gemini API key
- 🎨 **Modern UI**: Clean, intuitive interface with gradient design

## Installation

### Prerequisites

- Google Chrome browser
- Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Steps

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/DavyMorgan/market-insight.git
   cd market-insight
   ```

2. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked"
   - Select the `market-insight` directory

3. **Configure your API key**
   - Click the World Opinion extension icon in your Chrome toolbar
   - Click the ⚙️ Settings button
   - Enter your Gemini API key
   - Click "Save Settings"

## Usage

1. Navigate to any web page you want to analyze (news article, blog post, etc.)
2. Click the World Opinion extension icon
3. Click "🔍 Analyze Current Tab"
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

- Your Gemini API key is stored locally in Chrome's storage (never sent to external servers except Google's API)
- Page content is only sent to the Gemini API for analysis
- No personal data is collected or transmitted to third parties
- All API calls are made directly from your browser

## Development

### Project Structure

```
market-insight/
├── manifest.json       # Chrome extension manifest
├── popup.html         # Extension popup UI
├── popup.css          # Popup styling
├── popup.js           # Main popup logic and API integration
├── background.js      # Background service worker
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
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
