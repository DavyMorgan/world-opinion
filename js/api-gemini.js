/**
 * Gemini API service layer
 * Handles both cloud API and on-device Nano analysis
 */

const GeminiService = {
  /**
   * Build analysis prompt for page content
   * @param {Object} pageContent - Extracted page content
   * @param {string} pageTitle - Page title
   * @param {string} pageUrl - Page URL
   * @param {boolean} isMultimodal - Whether to include multimodal instructions
   * @returns {string} Prompt text
   */
  buildAnalysisPrompt(pageContent, pageTitle, pageUrl, isMultimodal) {
    const multimodalPrefix = isMultimodal ? '(both the screenshot and extracted text) ' : '';
    const visualInstructions = isMultimodal ? 'analyze both the visual content (charts, images, layout) and the text to ' : '';

    return `Analyze this web page ${multimodalPrefix}and extract key topics, entities, and events that could be related to prediction markets on Polymarket.

Page Title: ${pageTitle}
Page URL: ${pageUrl}
Page Description: ${pageContent.description}

Extracted Text:
${pageContent.text}

Please ${visualInstructions}provide:
1. A brief summary (2-3 sentences) of what this page is about
2. 3-5 keywords or phrases that could be used to search for related prediction markets

Format your response as JSON with the following structure:
{
  "summary": "Brief summary here",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;
  },

  /**
   * Build filter prompt for ranking events
   * @param {Object} analysis - Page analysis result
   * @param {Array} events - Events to filter
   * @returns {string} Prompt text
   */
  buildFilterPrompt(analysis, events) {
    return `Given this page analysis:
Summary: ${analysis.summary}
Keywords: ${analysis.keywords.join(', ')}

Here are prediction market events found. Return ONLY the ones that are genuinely relevant to the page content, ordered by relevance (most relevant first).

Events:
${events.map((e, i) => `${i + 1}. "${e.eventTitle}"`).join('\n')}

Return a JSON array of the relevant event numbers in order of relevance, e.g. [3, 1, 5].
Return an empty array [] if none are relevant.`;
  },

  /**
   * Analyze page content using appropriate Gemini model
   * Falls back to local keyword extraction if API fails
   * @param {Object} pageContent - Extracted page content
   * @param {string} pageTitle - Page title
   * @param {string} pageUrl - Page URL
   * @param {string|null} screenshot - Base64 encoded screenshot
   * @returns {Promise<Object>} Analysis result with summary and keywords
   */
  async analyze(pageContent, pageTitle, pageUrl, screenshot) {
    try {
      if (AppState.isUsingNano()) {
        return await this._analyzeWithNano(pageContent, pageTitle, pageUrl, screenshot);
      }
      return await this._analyzeWithApi(pageContent, pageTitle, pageUrl, screenshot);
    } catch (error) {
      console.warn('Gemini analysis failed, falling back to local extraction:', error.message);
      // Track that fallback was used
      AppState.fallbackUsed.analysis = true;
      // Fall back to local keyword extraction
      return Utils.extractKeywordsLocal(pageContent, pageTitle);
    }
  },

  /**
   * Filter and rank events by relevance
   * @param {Array} events - Events to filter
   * @param {Object} analysis - Page analysis result
   * @returns {Promise<Array>} Filtered and ranked events
   */
  async filterEvents(events, analysis) {
    if (events.length === 0) return events;

    if (AppState.isUsingNano()) {
      return await this._filterWithNano(events, analysis);
    }
    return await this._filterWithApi(events, analysis);
  },

  /**
   * Analyze using cloud Gemini API
   * @private
   */
  async _analyzeWithApi(pageContent, pageTitle, pageUrl, screenshot) {
    const prompt = this.buildAnalysisPrompt(pageContent, pageTitle, pageUrl, Boolean(screenshot));

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
      const response = await fetch(
        `${CONFIG.GEMINI_API_BASE}/${AppState.geminiModel}:generateContent?key=${AppState.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: {
              temperature: CONFIG.GEMINI_TEMPERATURE,
              maxOutputTokens: CONFIG.GEMINI_MAX_TOKENS
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;

      return Utils.parseAnalysisResponse(generatedText, pageTitle);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to analyze content with Gemini: ${error.message}`);
    }
  },

  /**
   * Analyze using on-device Gemini Nano
   * @private
   */
  async _analyzeWithNano(pageContent, pageTitle, pageUrl, screenshot) {
    try {
      // Check if multimodal is available when screenshot provided
      let useMultimodal = false;
      if (screenshot) {
        try {
          const multimodalAvailability = await LanguageModel.availability({
            expectedInputs: [{ type: 'image' }]
          });
          useMultimodal = multimodalAvailability !== 'unavailable';
          if (!useMultimodal) {
            console.log('Gemini Nano multimodal not available, using text-only mode');
          }
        } catch (e) {
          console.log('Multimodal availability check failed:', e.message);
        }
      }

      // Truncate content for smaller context window
      const truncatedContent = {
        ...pageContent,
        text: pageContent.text.substring(0, CONFIG.NANO_CONTENT_MAX_LENGTH)
      };

      let result;
      if (useMultimodal) {
        try {
          result = await this._runNanoMultimodal(truncatedContent, pageTitle, pageUrl, screenshot);
        } catch (multimodalError) {
          console.warn('Multimodal session failed, falling back to text-only:', multimodalError.message);
          result = await this._runNanoTextOnly(truncatedContent, pageTitle, pageUrl);
        }
      } else {
        result = await this._runNanoTextOnly(truncatedContent, pageTitle, pageUrl);
      }

      return Utils.parseAnalysisResponse(result, pageTitle);
    } catch (error) {
      console.error('Gemini Nano error:', error);
      throw new Error(`Failed to analyze content with Gemini Nano: ${error.message}`);
    }
  },

  /**
   * Run Nano in text-only mode
   * @private
   */
  async _runNanoTextOnly(pageContent, pageTitle, pageUrl) {
    const session = await LanguageModel.create({
      temperature: CONFIG.GEMINI_TEMPERATURE,
      topK: CONFIG.NANO_TOP_K,
      outputLanguage: 'en'
    });
    const prompt = this.buildAnalysisPrompt(pageContent, pageTitle, pageUrl, false);
    const result = await session.prompt(prompt);
    session.destroy();
    return result;
  },

  /**
   * Run Nano in multimodal mode with screenshot
   * @private
   */
  async _runNanoMultimodal(pageContent, pageTitle, pageUrl, screenshot) {
    const session = await LanguageModel.create({
      temperature: CONFIG.GEMINI_TEMPERATURE,
      topK: CONFIG.NANO_TOP_K,
      outputLanguage: 'en',
      expectedInputs: [
        { type: 'text' },
        { type: 'image' }
      ]
    });

    const imageBlob = Utils.base64ToBlob(screenshot);
    const prompt = this.buildAnalysisPrompt(pageContent, pageTitle, pageUrl, true);

    const result = await session.prompt([{
      role: 'user',
      content: [
        { type: 'text', value: prompt },
        { type: 'image', value: imageBlob }
      ]
    }]);

    session.destroy();
    return result;
  },

  /**
   * Filter events using cloud API
   * @private
   */
  async _filterWithApi(events, analysis) {
    const prompt = this.buildFilterPrompt(analysis, events);

    try {
      const response = await fetch(
        `${CONFIG.GEMINI_API_BASE}/${CONFIG.FILTER_MODEL}:generateContent?key=${AppState.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: CONFIG.FILTER_TEMPERATURE,
              maxOutputTokens: CONFIG.FILTER_MAX_TOKENS
            }
          })
        }
      );

      if (!response.ok) {
        console.error('Filter API error, returning unfiltered results');
        AppState.fallbackUsed.filter = true;
        return events.slice(0, CONFIG.MAX_MARKETS_TO_DISPLAY);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;

      return this._applyFilterIndices(events, text);
    } catch (error) {
      console.error('Filter error, returning unfiltered results:', error);
      AppState.fallbackUsed.filter = true;
      return events.slice(0, CONFIG.MAX_MARKETS_TO_DISPLAY);
    }
  },

  /**
   * Filter events using on-device Nano
   * @private
   */
  async _filterWithNano(events, analysis) {
    try {
      const session = await LanguageModel.create({
        temperature: CONFIG.FILTER_TEMPERATURE,
        topK: CONFIG.NANO_TOP_K,
        outputLanguage: 'en'
      });

      const prompt = this.buildFilterPrompt(analysis, events);
      const result = await session.prompt(prompt);
      session.destroy();

      return this._applyFilterIndices(events, result);
    } catch (error) {
      console.error('Nano filter error, returning unfiltered results:', error);
      AppState.fallbackUsed.filter = true;
      return events.slice(0, CONFIG.MAX_MARKETS_TO_DISPLAY);
    }
  },

  /**
   * Apply filter indices to events array
   * @private
   */
  _applyFilterIndices(events, responseText) {
    const indices = Utils.parseFilterIndices(responseText);
    if (!indices) {
      return events.slice(0, CONFIG.MAX_MARKETS_TO_DISPLAY);
    }

    return indices
      .filter(i => i >= 1 && i <= events.length)
      .map(i => events[i - 1])
      .slice(0, CONFIG.MAX_MARKETS_TO_DISPLAY);
  }
};

// Freeze public interface
Object.freeze(GeminiService);
