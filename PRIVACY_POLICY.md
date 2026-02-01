# Privacy Policy for World Opinion

**Last Updated:** January 30, 2026

## Overview

World Opinion is a Chrome extension that analyzes web page content using AI and finds related prediction markets. This privacy policy explains what data is collected, how it's used, and your rights regarding that data.

## Our Privacy-First Architecture

**World Opinion operates with no backend servers.** This is a fundamental architectural decision that maximizes your privacy:

- **Direct Communication**: Your browser communicates directly with Google Gemini and Polymarket APIs. There is no intermediary server that could log, analyze, or expose your data.
- **No Data Collection Infrastructure**: We literally cannot collect your data because we have no servers to collect it on.
- **Verifiable Privacy**: As an open-source extension, you can inspect every line of code to verify these claims.

This "serverless" design means you only need to trust:
1. Your own browser
2. Google (for Gemini API calls)
3. Polymarket (for market data)

You do **not** need to trust us with your data—because we never see it.

### Maximum Privacy: Gemini Nano (On-Device AI)

For users who want the highest level of privacy, World Opinion supports **Gemini Nano**—an on-device AI model that runs entirely on your computer. When using Gemini Nano:

- **Your page content never leaves your device** — AI analysis happens 100% locally
- **No API key required** — no Google account or API setup needed
- **No data transmission for analysis** — the only network calls are to Polymarket for market data

With Gemini Nano, the trust model becomes even simpler: you only trust your own browser and Polymarket (for fetching public market data). The AI analysis—which processes your browsing content—stays completely on your machine.

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

1. **Google Gemini API** (Cloud)
   - **What's sent:** Page content and/or screenshots for AI analysis
   - **Purpose:** Extract keywords and generate summaries to find relevant prediction markets
   - **Data retention:** Processed in real-time; we do not store this data

2. **Gemini Nano** (On-Device) — *Optional, maximum privacy*
   - **What's sent:** Nothing — all processing happens locally on your device
   - **Purpose:** Same AI analysis as cloud Gemini, but 100% offline
   - **Data retention:** Data never leaves your device

3. **Polymarket API**
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

## Summary: Why World Opinion Is Different

| Aspect | Many Extensions | World Opinion | World Opinion + Gemini Nano |
|--------|-----------------|---------------|----------------------------|
| Backend Servers | Yes, your data passes through them | **None** | **None** |
| Data Collection | Often collect analytics, usage data | **Zero** | **Zero** |
| User Accounts | Required, storing your info | **None needed** | **None needed** |
| Data Flow | Browser → Their Server → API | Browser → API directly | **100% on-device** |
| AI Processing | Their servers | Google's servers | **Your device only** |
| Trust Model | Must trust the developer | Verifiable (open source) | **Minimal trust required** |

**Bottom line**: World Opinion is architecturally incapable of collecting your data because there's nowhere for it to go. With Gemini Nano, even AI analysis stays on your device—only public market data is fetched from the network.
