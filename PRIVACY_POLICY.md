# Privacy Policy for World Opinion

**Last Updated:** January 30, 2026

## Overview

World Opinion is a Chrome extension that analyzes web page content using AI and finds related prediction markets. This privacy policy explains what data is collected, how it's used, and your rights regarding that data.

## Data Collection

### Data We Collect

1. **Page Content** (temporarily processed)
   - Page title
   - Meta description
   - Main text content (up to 5,000 characters)
   - Screenshots of the current tab (when using multimodal analysis)

2. **User Preferences** (stored locally)
   - Your Gemini API key
   - Selected AI model preference

### Data We Do NOT Collect

- Personal information (name, email, address)
- Browsing history
- Cookies or tracking data
- Analytics or usage statistics
- Financial information
- Location data

## How Data Is Used

### External Services

1. **Google Gemini API**
   - **What's sent:** Page content and/or screenshots for AI analysis
   - **Purpose:** Extract keywords and generate summaries to find relevant prediction markets
   - **Data retention:** Processed in real-time; we do not store this data

2. **Polymarket API**
   - **What's sent:** Search keywords extracted from page analysis (typically 5 keywords)
   - **Purpose:** Find prediction markets related to the page content
   - **Data retention:** No data is stored; queries are processed in real-time

### Local Storage

Your Gemini API key is stored locally on your device using Chrome's `chrome.storage.local` API. This data:
- Never leaves your device (except when making API calls to Google)
- Is not accessible to websites or other extensions
- Can be deleted by removing the extension or clearing extension data

## Data Sharing

We do not:
- Sell your data to third parties
- Share your data for advertising purposes
- Track your browsing activity
- Store any data on our servers

The only data transmission occurs directly between your browser and the third-party APIs (Google Gemini and Polymarket) as described above.

## Your Rights

You can:
- **View stored data:** Check your API key in the extension settings
- **Delete stored data:** Remove your API key from settings or uninstall the extension
- **Control data transmission:** The extension only processes data when you click "Analyze"

## Security

- All API communications use HTTPS encryption
- Your API key is stored locally and never transmitted to our servers
- No user accounts or authentication systems are used

## Third-Party Services

This extension relies on third-party services with their own privacy policies:
- [Google Gemini API Privacy Policy](https://policies.google.com/privacy)
- [Polymarket Privacy Policy](https://polymarket.com/privacy)

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date above.

## Contact

For questions about this privacy policy or the extension, please open an issue on our GitHub repository.

## Open Source

This extension is open source. You can review the complete source code to verify our privacy practices.
