/**
 * Pure utility functions with no dependencies
 */

const Utils = {
  /**
   * Escape HTML to prevent XSS attacks
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Format volume numbers to human-readable format (K, M)
   * @param {string|number} volume - Volume to format
   * @returns {string} Formatted volume string
   */
  formatVolume(volume) {
    const num = parseFloat(volume);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  },

  /**
   * Convert base64 string to Blob
   * @param {string} base64 - Base64 encoded string
   * @param {string} mimeType - MIME type of the blob
   * @returns {Blob} Blob object
   */
  base64ToBlob(base64, mimeType = 'image/jpeg') {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  },

  /**
   * Clean markdown code fences from text
   * @param {string} text - Text potentially containing code fences
   * @returns {string} Cleaned text
   */
  cleanMarkdownCodeFences(text) {
    return text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
  },

  /**
   * Parse JSON from AI response text, with fallback handling
   * @param {string} text - Raw response text
   * @param {string} fallbackTitle - Fallback keyword if parsing fails
   * @returns {Object} Parsed analysis object with summary and keywords
   */
  parseAnalysisResponse(text, fallbackTitle) {
    const cleanedText = this.cleanMarkdownCodeFences(text);

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
      keywords: [fallbackTitle]
    };
  },

  /**
   * Parse filter indices array from AI response
   * @param {string} text - Raw response text
   * @returns {number[]|null} Array of indices or null if parsing fails
   */
  parseFilterIndices(text) {
    const match = text.match(/\[[\d,\s]*\]/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch (e) {
      console.error('Filter indices parse error:', e);
      return null;
    }
  },

  /**
   * Calculate probability from outcome prices
   * @param {string|Array} outcomePrices - Outcome prices (JSON string or array)
   * @returns {number} Probability as percentage (0-100)
   */
  calculateProbabilityFromPrices(outcomePrices) {
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
  },

  /**
   * Calculate price change from history data
   * @param {Array} history - Price history array with {p: price} objects
   * @returns {Object|null} Price change info or null
   */
  calculatePriceChange(history) {
    if (!history || history.length < 2) return null;

    const oldest = history[0].p;
    const newest = history[history.length - 1].p;
    const change = ((newest - oldest) / oldest) * 100;

    return {
      value: Math.abs(change).toFixed(1),
      direction: change >= 0 ? 'up' : 'down',
      arrow: change >= 0 ? '\u2191' : '\u2193'
    };
  },

  /**
   * Generate SVG sparkline from price history
   * @param {Array} history - Price history array
   * @param {number} width - SVG width
   * @param {number} height - SVG height
   * @returns {string} SVG markup
   */
  generateSparkline(history, width = CONFIG.SPARKLINE_WIDTH, height = CONFIG.SPARKLINE_HEIGHT) {
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
    const trend = prices[prices.length - 1] >= prices[0] ? CONFIG.COLOR_TREND_UP : CONFIG.COLOR_TREND_DOWN;

    return `
      <svg width="${width}" height="${height}" class="sparkline">
        <polyline fill="none" stroke="${trend}" stroke-width="1.5" points="${points}"/>
      </svg>
    `;
  }
};

// Freeze to prevent modification
Object.freeze(Utils);
