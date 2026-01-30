// Popup script - handles user interactions
document.addEventListener('DOMContentLoaded', init);

let geminiApiKey = '';

async function init() {
  // Load saved settings
  const settings = await chrome.storage.local.get(['geminiApiKey']);
  if (settings.geminiApiKey) {
    geminiApiKey = settings.geminiApiKey;
    document.getElementById('geminiKey').value = '••••••••';
  }

  // Setup event listeners
  document.getElementById('settingsBtn').addEventListener('click', toggleSettings);
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('analyzeBtn').addEventListener('click', analyzeCurrentTab);
}

function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.classList.toggle('hidden');
}

async function saveSettings() {
  const geminiKey = document.getElementById('geminiKey').value;
  const messageDiv = document.getElementById('settingsMessage');

  if (!geminiKey || geminiKey === '••••••••') {
    showMessage(messageDiv, 'Please enter a valid API key', 'error');
    return;
  }

  try {
    await chrome.storage.local.set({ geminiApiKey: geminiKey });
    geminiApiKey = geminiKey;
    showMessage(messageDiv, 'Settings saved successfully!', 'success');

    // Hide message after 2 seconds
    setTimeout(() => {
      messageDiv.className = 'message';
      messageDiv.textContent = '';
    }, 2000);
  } catch (error) {
    showMessage(messageDiv, 'Error saving settings: ' + error.message, 'error');
  }
}

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type}`;
}

async function analyzeCurrentTab() {
  // Check if API key is configured
  if (!geminiApiKey) {
    showError('Please configure your Gemini API key in settings first.');
    return;
  }

  try {
    // Show loading state
    showLoading();
    hideError();
    hideResults();

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('No active tab found');
    }

    // Extract page content and capture screenshot
    const [pageContent, screenshot] = await Promise.all([
      extractPageContent(tab),
      captureScreenshot()
    ]);

    // Analyze with Gemini (text + image)
    const analysis = await analyzeWithGemini(pageContent, tab.title, tab.url, screenshot);

    // Search Polymarket
    const markets = await searchPolymarket(analysis.keywords);

    // Display results
    displayResults(analysis, markets);

  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message);
    hideLoading();
  }
}

async function captureScreenshot() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 });
    // Extract base64 data from data URL (remove "data:image/jpeg;base64," prefix)
    return dataUrl.split(',')[1];
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return null; // Continue without screenshot if capture fails
  }
}

async function extractPageContent(tab) {
  try {
    // Inject content script to extract page text
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

async function analyzeWithGemini(pageContent, pageTitle, pageUrl, screenshot) {
  const prompt = `Analyze this web page (both the screenshot and extracted text) and extract key topics, entities, and events that could be related to prediction markets on Polymarket.

Page Title: ${pageTitle}
Page URL: ${pageUrl}
Page Description: ${pageContent.description}

Extracted Text:
${pageContent.text}

Please analyze both the visual content (charts, images, layout) and the text to provide:
1. A brief summary (2-3 sentences) of what this page is about
2. 3-5 keywords or phrases that could be used to search for related prediction markets
3. Specific entities, events, or topics mentioned that people might bet on

Format your response as JSON with the following structure:
{
  "summary": "Brief summary here",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "topics": ["topic1", "topic2", "topic3"]
}`;

  // Build parts array with text, and optionally image
  const parts = [{ text: prompt }];

  if (screenshot) {
    parts.unshift({
      inline_data: {
        mime_type: 'image/jpeg',
        data: screenshot
      }
    });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;

    // Remove markdown code fences if present
    let cleanedText = generatedText
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    // Try to extract JSON from the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }

    // Smarter fallback - try to extract summary from partial JSON
    const summaryMatch = cleanedText.match(/"summary"\s*:\s*"([^"]+)/);
    return {
      summary: summaryMatch ? summaryMatch[1] : 'Unable to analyze this page.',
      keywords: [pageTitle],
      topics: []
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze content with Gemini: ${error.message}`);
  }
}

async function searchPolymarket(keywords) {
  try {
    const allMarkets = [];

    // Search for each keyword (use more keywords since search is now effective)
    for (const keyword of keywords.slice(0, 5)) {
      const markets = await searchPolymarketByKeyword(keyword);
      allMarkets.push(...markets);
    }

    // Remove duplicates by condition ID and limit results
    const uniqueMarkets = Array.from(new Map(allMarkets.map(m => [m.id, m])).values());
    return uniqueMarkets.slice(0, 8); // Return more results since they're relevant

  } catch (error) {
    console.error('Polymarket search error:', error);
    throw new Error(`Failed to search Polymarket: ${error.message}`);
  }
}

async function searchPolymarketByKeyword(keyword) {
  try {
    const response = await fetch(
      `https://gamma-api.polymarket.com/public-search?q=${encodeURIComponent(keyword)}&limit_per_type=10`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.statusText}`);
    }

    const data = await response.json();
    const markets = [];

    // Extract markets from events in search results
    for (const event of (data.events || [])) {
      for (const market of (event.markets || [])) {
        if (market.closed) continue; // Skip closed markets

        markets.push({
          id: market.conditionId || market.id,
          title: market.question,
          description: market.description,
          probability: calculateProbabilityFromPrices(market.outcomePrices),
          volume: market.volume || event.volume || '0',
          url: `https://polymarket.com/event/${event.slug}`
        });
      }
    }

    return markets;
  } catch (error) {
    console.error('Error searching Polymarket:', error);
    return [];
  }
}

function calculateProbabilityFromPrices(outcomePrices) {
  try {
    if (!outcomePrices) return 50;
    const prices = typeof outcomePrices === 'string'
      ? JSON.parse(outcomePrices)
      : outcomePrices;
    if (prices && prices.length > 0) {
      return Math.round(parseFloat(prices[0]) * 100);
    }
  } catch (e) {
    console.error('Error parsing prices:', e);
  }
  return 50;
}

function displayResults(analysis, markets) {
  const resultsDiv = document.getElementById('results');
  const analysisDiv = document.getElementById('analysisText');
  const marketsListDiv = document.getElementById('marketsList');

  // Display analysis
  analysisDiv.textContent = analysis.summary;

  // Display markets
  if (markets.length === 0) {
    marketsListDiv.innerHTML = '<div class="no-markets">No related prediction markets found</div>';
  } else {
    marketsListDiv.innerHTML = markets.map(market => `
      <div class="market-card">
        <div class="market-title">${escapeHtml(market.title)}</div>
        <div class="market-probability">${market.probability}%</div>
        <div class="market-info">
          <span>Volume: $${formatVolume(market.volume)}</span>
        </div>
        <a href="${market.url}" target="_blank" class="market-link">View on Polymarket →</a>
      </div>
    `).join('');
  }

  // Show results, hide loading
  resultsDiv.classList.remove('hidden');
  hideLoading();
}

function formatVolume(volume) {
  const num = parseFloat(volume);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error').classList.add('hidden');
}

function hideResults() {
  document.getElementById('results').classList.add('hidden');
}
