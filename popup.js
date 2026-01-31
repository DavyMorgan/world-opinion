// Popup script - handles user interactions
document.addEventListener('DOMContentLoaded', init);

let geminiApiKey = '';
let geminiModel = 'gemini-3-flash-preview';
let showAnalysis = false;

async function init() {
  // Load saved settings
  const settings = await chrome.storage.local.get(['geminiApiKey', 'geminiModel', 'showAnalysis']);
  if (settings.geminiApiKey) {
    geminiApiKey = settings.geminiApiKey;
    document.getElementById('geminiKey').value = '••••••••';
  }
  if (settings.geminiModel) {
    geminiModel = settings.geminiModel;
    document.getElementById('geminiModel').value = geminiModel;
  }
  showAnalysis = settings.showAnalysis || false;
  document.getElementById('showAnalysis').checked = showAnalysis;

  // Check if Gemini Nano is available and show/hide the option
  const nanoAvailable = await checkNanoAvailability();
  const nanoOption = document.getElementById('nanoOption');
  if (nanoAvailable) {
    nanoOption.classList.remove('hidden');
  }

  // Setup event listeners
  document.getElementById('settingsBtn').addEventListener('click', toggleSettings);
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('analyzeBtn').addEventListener('click', analyzeCurrentTab);
  document.getElementById('showAnalysis').addEventListener('change', async (e) => {
    showAnalysis = e.target.checked;
    await chrome.storage.local.set({ showAnalysis });
  });
  document.getElementById('geminiModel').addEventListener('change', async (e) => {
    geminiModel = e.target.value;
    await chrome.storage.local.set({ geminiModel });
    updateApiKeyVisibility();
  });

  // Set initial API key visibility based on saved model
  updateApiKeyVisibility();
}

function updateApiKeyVisibility() {
  const apiKeyGroup = document.getElementById('apiKeyGroup');
  if (geminiModel === 'gemini-nano') {
    apiKeyGroup.classList.add('hidden');
  } else {
    apiKeyGroup.classList.remove('hidden');
  }
}

// Check if Gemini Nano (Chrome's built-in LanguageModel) is available
async function checkNanoAvailability() {
  try {
    if (typeof LanguageModel === 'undefined') return false;
    const availability = await LanguageModel.availability();
    return availability !== 'unavailable';
  } catch (e) {
    console.log('Gemini Nano not available:', e.message);
    return false;
  }
}

function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.classList.toggle('hidden');
}

async function saveSettings() {
  const geminiKey = document.getElementById('geminiKey').value;
  const saveBtn = document.getElementById('saveSettings');
  const iconSave = saveBtn.querySelector('.icon-save');
  const iconCheck = saveBtn.querySelector('.icon-check');

  if (!geminiKey || geminiKey === '••••••••') {
    // Shake the button to indicate error
    saveBtn.style.animation = 'shake 0.3s';
    setTimeout(() => saveBtn.style.animation = '', 300);
    return;
  }

  try {
    await chrome.storage.local.set({ geminiApiKey: geminiKey });
    geminiApiKey = geminiKey;

    // Show checkmark icon
    iconSave.classList.add('hidden');
    iconCheck.classList.remove('hidden');
    saveBtn.classList.add('saved');

    // Revert to save icon after 2 seconds
    setTimeout(() => {
      iconSave.classList.remove('hidden');
      iconCheck.classList.add('hidden');
      saveBtn.classList.remove('saved');
    }, 2000);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

async function analyzeCurrentTab() {
  const usingNano = geminiModel === 'gemini-nano';

  // Check if API key is configured (not required for Nano)
  if (!usingNano && !geminiApiKey) {
    showError('Please configure your Gemini API key in settings first.');
    return;
  }

  try {
    // Show loading state
    showLoading();
    resetProgress();
    hideError();
    hideResults();

    // Stage 1: Chrome - Extract content
    updateProgress('chrome', 'Extracting page content...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('No active tab found');
    }

    // Extract page content and capture screenshot for both modes
    const [pageContent, screenshot] = await Promise.all([
      extractPageContent(tab),
      captureScreenshot()
    ]);

    // Stage 2: Gemini - Analyze with AI
    updateProgress('gemini', usingNano ? 'Analyzing with on-device AI...' : 'Analyzing with AI...');
    const analysis = await analyzeWithGemini(pageContent, tab.title, tab.url, screenshot);

    // Stage 3: Polymarket - Search markets
    updateProgress('polymarket', 'Searching prediction markets...');
    const markets = await searchPolymarket(analysis.keywords);

    // Filter and rank events by relevance
    updateProgress('filter', 'Filtering results...');
    const filteredMarkets = await filterAndRankEvents(markets, analysis);

    // Fetch price history for all markets in parallel
    const marketsWithHistory = await Promise.all(
      filteredMarkets.map(async (event) => ({
        ...event,
        markets: await Promise.all(
          event.markets.map(async (market) => ({
            ...market,
            priceHistory: await fetchPriceHistory(market.clobTokenId)
          }))
        )
      }))
    );

    // Display results
    displayResults(analysis, marketsWithHistory);

  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message);
    hideLoading();
  }
}

async function captureScreenshot() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 });

    // Display screenshot in loading area
    const screenshotPreview = document.getElementById('screenshotPreview');
    const screenshotImg = document.getElementById('screenshotImg');
    screenshotImg.src = dataUrl;
    screenshotPreview.classList.remove('hidden');

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
  // Route to Nano if selected
  if (geminiModel === 'gemini-nano') {
    return await analyzeWithNano(pageContent, pageTitle, pageUrl, screenshot);
  }

  const prompt = `Analyze this web page (both the screenshot and extracted text) and extract key topics, entities, and events that could be related to prediction markets on Polymarket.

Page Title: ${pageTitle}
Page URL: ${pageUrl}
Page Description: ${pageContent.description}

Extracted Text:
${pageContent.text}

Please analyze both the visual content (charts, images, layout) and the text to provide:
1. A brief summary (2-3 sentences) of what this page is about
2. 3-5 keywords or phrases that could be used to search for related prediction markets

Format your response as JSON with the following structure:
{
  "summary": "Brief summary here",
  "keywords": ["keyword1", "keyword2", "keyword3"]
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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`, {
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
      keywords: [pageTitle]
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze content with Gemini: ${error.message}`);
  }
}

// Analyze using Chrome's built-in Gemini Nano with optional multimodal support
async function analyzeWithNano(pageContent, pageTitle, pageUrl, screenshot) {
  try {
    // Check if multimodal is available when screenshot provided
    let useMultimodal = false;
    if (screenshot) {
      try {
        const multimodalAvailability = await LanguageModel.availability({
          expectedInputs: [{ type: "image" }]
        });
        useMultimodal = multimodalAvailability !== 'unavailable';
        if (!useMultimodal) {
          console.log('Gemini Nano multimodal not available, using text-only mode');
        }
      } catch (e) {
        console.log('Multimodal availability check failed:', e.message);
      }
    }

    // Truncate content more aggressively for smaller context window
    const truncatedText = pageContent.text.substring(0, 3000);

    // Helper to build prompt text
    const buildPrompt = (isMultimodal) => `Analyze this web page ${isMultimodal ? '(both the screenshot and extracted text) ' : ''}and extract key topics, entities, and events that could be related to prediction markets on Polymarket.

Page Title: ${pageTitle}
Page URL: ${pageUrl}
Page Description: ${pageContent.description}

Extracted Text:
${truncatedText}

Please ${isMultimodal ? 'analyze both the visual content (charts, images, layout) and the text to ' : ''}provide:
1. A brief summary (2-3 sentences) of what this page is about
2. 3-5 keywords or phrases that could be used to search for related prediction markets

Format your response as JSON with the following structure:
{
  "summary": "Brief summary here",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    // Helper to run text-only session
    const runTextOnly = async () => {
      const session = await LanguageModel.create({
        temperature: 0.7,
        topK: 3
      });
      const result = await session.prompt(buildPrompt(false));
      session.destroy();
      return result;
    };

    let result;
    if (useMultimodal) {
      try {
        // Try multimodal session
        const session = await LanguageModel.create({
          temperature: 0.7,
          topK: 3,
          expectedInputs: [
            { type: "text" },
            { type: "image" }
          ]
        });
        const imageBlob = base64ToBlob(screenshot);
        result = await session.prompt([{
          role: "user",
          content: [
            { type: "text", value: buildPrompt(true) },
            { type: "image", value: imageBlob }
          ]
        }]);
        session.destroy();
      } catch (multimodalError) {
        // Multimodal failed at runtime - fall back to text-only
        console.warn('Multimodal session failed, falling back to text-only:', multimodalError.message);
        result = await runTextOnly();
      }
    } else {
      result = await runTextOnly();
    }

    // Remove markdown code fences if present
    let cleanedText = result
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
      keywords: [pageTitle]
    };
  } catch (error) {
    console.error('Gemini Nano error:', error);
    throw new Error(`Failed to analyze content with Gemini Nano: ${error.message}`);
  }
}

async function filterAndRankEvents(events, analysis) {
  if (events.length === 0) return events;

  // Use Nano if selected for fully local experience
  if (geminiModel === 'gemini-nano') {
    return await filterWithNano(events, analysis);
  }

  const prompt = `Given this page analysis:
Summary: ${analysis.summary}
Keywords: ${analysis.keywords.join(', ')}

Here are prediction market events found. Return ONLY the ones that are genuinely relevant to the page content, ordered by relevance (most relevant first).

Events:
${events.map((e, i) => `${i + 1}. "${e.eventTitle}"`).join('\n')}

Return a JSON array of the relevant event numbers in order of relevance, e.g. [3, 1, 5].
Return an empty array [] if none are relevant.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
        })
      }
    );

    if (!response.ok) {
      console.error('Filter API error, returning unfiltered results');
      return events.slice(0, 8);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // Parse JSON array from response
    const match = text.match(/\[[\d,\s]*\]/);
    if (!match) return events.slice(0, 8);

    const indices = JSON.parse(match[0]);
    return indices
      .filter(i => i >= 1 && i <= events.length)
      .map(i => events[i - 1])
      .slice(0, 8);
  } catch (error) {
    console.error('Filter error, returning unfiltered results:', error);
    return events.slice(0, 8);
  }
}

// Filter events using Chrome's built-in Gemini Nano
async function filterWithNano(events, analysis) {
  try {
    const session = await LanguageModel.create({
      temperature: 0.1,
      topK: 3
    });

    const prompt = `Given this page analysis:
Summary: ${analysis.summary}
Keywords: ${analysis.keywords.join(', ')}

Here are prediction market events found. Return ONLY the ones that are genuinely relevant to the page content, ordered by relevance (most relevant first).

Events:
${events.map((e, i) => `${i + 1}. "${e.eventTitle}"`).join('\n')}

Return a JSON array of the relevant event numbers in order of relevance, e.g. [3, 1, 5].
Return an empty array [] if none are relevant.`;

    const result = await session.prompt(prompt);
    session.destroy();

    // Parse JSON array from response
    const match = result.match(/\[[\d,\s]*\]/);
    if (!match) return events.slice(0, 8);

    const indices = JSON.parse(match[0]);
    return indices
      .filter(i => i >= 1 && i <= events.length)
      .map(i => events[i - 1])
      .slice(0, 8);
  } catch (error) {
    console.error('Nano filter error, returning unfiltered results:', error);
    return events.slice(0, 8);
  }
}

async function searchPolymarket(keywords) {
  try {
    const allEvents = [];

    // Search for each keyword (use more keywords since search is now effective)
    for (const keyword of keywords.slice(0, 5)) {
      const events = await searchPolymarketByKeyword(keyword);
      allEvents.push(...events);
    }

    // Remove duplicates by event ID and merge markets from same event
    const eventMap = new Map();
    for (const event of allEvents) {
      if (eventMap.has(event.eventId)) {
        // Merge markets from same event found via different keywords
        const existing = eventMap.get(event.eventId);
        const existingMarketIds = new Set(existing.markets.map(m => m.id));
        for (const market of event.markets) {
          if (!existingMarketIds.has(market.id)) {
            existing.markets.push(market);
          }
        }
      } else {
        eventMap.set(event.eventId, event);
      }
    }

    // Convert to array and limit results
    const uniqueEvents = Array.from(eventMap.values());

    // Sort events by volume (highest first)
    // uniqueEvents.sort((a, b) => parseFloat(b.eventVolume) - parseFloat(a.eventVolume));

    return uniqueEvents;

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
    const events = [];

    // Extract events with their markets from search results
    for (const event of (data.events || [])) {
      const markets = [];

      for (const market of (event.markets || [])) {
        if (market.closed) continue; // Skip closed markets

        const title = market.groupItemTitle || market.question;
        const probability = calculateProbabilityFromPrices(market.outcomePrices);
        const volume = parseFloat(market.volume) || 0;

        // Skip placeholder entries (no trading activity)
        if (volume === 0 && probability === 50) continue;

        // Parse clobTokenIds JSON string to get the first token
        let clobTokenId = null;
        if (market.clobTokenIds) {
          try {
            const tokenIds = JSON.parse(market.clobTokenIds);
            clobTokenId = tokenIds?.[0];
          } catch (e) {
            console.error('Error parsing clobTokenIds:', e);
          }
        }

        markets.push({
          id: market.conditionId || market.id,
          clobTokenId: clobTokenId,  // Token for "Yes" outcome (for price history)
          title: title,
          question: market.question,
          probability: probability,
          volume: market.volume || '0',
          closed: market.closed
        });
      }

      if (markets.length > 0) {
        events.push({
          eventId: event.id,
          eventTitle: event.title,
          eventSlug: event.slug,
          eventImage: event.image || event.icon,
          eventVolume: event.volume || '0',
          url: `https://polymarket.com/event/${event.slug}`,
          markets: markets
        });
      }
    }

    return events;
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

// Fetch 7-day price history for a market (hourly granularity for smooth sparklines)
async function fetchPriceHistory(clobTokenId) {
  if (!clobTokenId) return null;

  try {
    const response = await fetch(
      `https://clob.polymarket.com/prices-history?market=${clobTokenId}&interval=1w&fidelity=60`
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('Error fetching price history:', error);
    return null;
  }
}

// Generate SVG sparkline from price history
function generateSparkline(history, width = 60, height = 20) {
  if (!history || history.length < 2) return '';

  const prices = history.map(h => h.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.01;

  // Normalize points to SVG coordinates
  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Determine color: green if up, red if down
  const trend = prices[prices.length - 1] >= prices[0] ? '#22c55e' : '#ef4444';

  return `
    <svg width="${width}" height="${height}" class="sparkline">
      <polyline fill="none" stroke="${trend}" stroke-width="1.5" points="${points}"/>
    </svg>
  `;
}

// Calculate price change from history
function calculatePriceChange(history) {
  if (!history || history.length < 2) return null;

  const oldest = history[0].p;
  const newest = history[history.length - 1].p;
  const change = ((newest - oldest) / oldest) * 100;

  return {
    value: Math.abs(change).toFixed(1),
    direction: change >= 0 ? 'up' : 'down',
    arrow: change >= 0 ? '↑' : '↓'
  };
}

function displayResults(analysis, events) {
  const resultsDiv = document.getElementById('results');
  const analysisSection = document.getElementById('analysis');
  const analysisDiv = document.getElementById('analysisText');
  const keywordsSection = document.getElementById('keywords');
  const keywordsListDiv = document.getElementById('keywordsList');
  const marketsListDiv = document.getElementById('marketsList');

  // Display analysis and keywords (conditionally)
  if (showAnalysis) {
    analysisDiv.textContent = analysis.summary;
    analysisSection.classList.remove('hidden');

    // Display keywords
    const keywords = analysis.keywords || [];
    keywordsListDiv.innerHTML = keywords.length > 0
      ? keywords.map(kw => `<span class="tag">${escapeHtml(kw)}</span>`).join('')
      : '';

    // Show keywords section if there are any keywords
    if (keywords.length > 0) {
      keywordsSection.classList.remove('hidden');
    } else {
      keywordsSection.classList.add('hidden');
    }
  } else {
    analysisSection.classList.add('hidden');
    keywordsSection.classList.add('hidden');
  }

  // Display events/markets
  if (events.length === 0) {
    marketsListDiv.innerHTML = '<div class="no-markets">No related prediction markets found</div>';
  } else {
    marketsListDiv.innerHTML = events.map(event => {
      // Sort markets by probability (highest first)
      const sortedMarkets = [...event.markets].sort((a, b) => b.probability - a.probability);

      // For events with multiple markets, show grouped view
      if (sortedMarkets.length > 1) {
        return `
          <div class="event-card">
            <div class="event-header">
              ${event.eventImage ? `<img class="event-image" src="${event.eventImage}" alt="" />` : ''}
              <div class="event-info">
                <div class="event-title">${escapeHtml(event.eventTitle)}</div>
                <div class="event-volume">$${formatVolume(event.eventVolume)} Vol.</div>
              </div>
            </div>
            <div class="outcomes-table">
              ${sortedMarkets.map(market => {
                const priceChange = calculatePriceChange(market.priceHistory);
                return `
                <div class="outcome-row">
                  <span class="outcome-label">${escapeHtml(market.title)}</span>
                  <span class="outcome-probability">${market.probability}%</span>
                  ${priceChange ? `<span class="price-change ${priceChange.direction}">${priceChange.arrow}${priceChange.value}%</span>` : '<span class="price-change-placeholder"></span>'}
                  ${generateSparkline(market.priceHistory, 40, 16)}
                  <span class="outcome-volume">$${formatVolume(market.volume)}</span>
                </div>
              `}).join('')}
            </div>
            <a href="${event.url}" target="_blank" class="market-link">View on Polymarket →</a>
          </div>
        `;
      } else {
        // For single-market events, use original card style
        const market = sortedMarkets[0];
        const priceChange = calculatePriceChange(market.priceHistory);
        return `
          <div class="market-card">
            <div class="market-title">${escapeHtml(market.question || event.eventTitle)}</div>
            <div class="market-probability-row">
              <span class="market-probability">${market.probability}%</span>
              ${priceChange ? `<span class="price-change ${priceChange.direction}">${priceChange.arrow}${priceChange.value}%</span>` : ''}
              ${generateSparkline(market.priceHistory)}
            </div>
            <div class="market-info">
              <span>Volume: $${formatVolume(market.volume || event.eventVolume)}</span>
            </div>
            <a href="${event.url}" target="_blank" class="market-link">View on Polymarket →</a>
          </div>
        `;
      }
    }).join('');
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

function base64ToBlob(base64, mimeType = 'image/jpeg') {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  const loading = document.getElementById('loading');
  loading.classList.add('fade-out');
  setTimeout(() => {
    loading.classList.add('hidden');
    loading.classList.remove('fade-out');
    resetProgress();
  }, 400);
}

function updateProgress(stage, text) {
  const milestones = document.querySelectorAll('.milestone');
  const connectors = document.querySelectorAll('.milestone-connector');
  const progressText = document.getElementById('progressText');

  const stages = ['chrome', 'gemini', 'polymarket', 'filter'];
  const stageIndex = stages.indexOf(stage);

  milestones.forEach((milestone, index) => {
    milestone.classList.remove('active', 'completed');
    if (index < stageIndex) {
      milestone.classList.add('completed');
    } else if (index === stageIndex) {
      milestone.classList.add('active');
    }
  });

  connectors.forEach((connector, index) => {
    connector.classList.toggle('active', index < stageIndex);
  });

  if (progressText) {
    progressText.textContent = text;
  }
}

function resetProgress() {
  const milestones = document.querySelectorAll('.milestone');
  const connectors = document.querySelectorAll('.milestone-connector');
  milestones.forEach(m => m.classList.remove('active', 'completed'));
  connectors.forEach(c => c.classList.remove('active'));

  // Hide screenshot preview
  const screenshotPreview = document.getElementById('screenshotPreview');
  if (screenshotPreview) {
    screenshotPreview.classList.add('hidden');
  }
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
