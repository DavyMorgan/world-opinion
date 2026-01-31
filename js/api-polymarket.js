/**
 * Polymarket API service layer
 */

const PolymarketService = {
  /**
   * Search Polymarket by a single keyword
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} Array of events with markets
   */
  async searchByKeyword(keyword) {
    try {
      const response = await fetch(
        `${CONFIG.POLYMARKET_SEARCH_API}?q=${encodeURIComponent(keyword)}&limit_per_type=10`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this._transformSearchResults(data);
    } catch (error) {
      console.error('Error searching Polymarket:', error);
      return [];
    }
  },

  /**
   * Search Polymarket with multiple keywords
   * @param {string[]} keywords - Array of search keywords
   * @returns {Promise<Array>} Deduplicated array of events
   */
  async search(keywords) {
    try {
      const allEvents = [];

      // Search for each keyword
      for (const keyword of keywords.slice(0, CONFIG.MAX_KEYWORDS_TO_SEARCH)) {
        const events = await this.searchByKeyword(keyword);
        allEvents.push(...events);
      }

      // Remove duplicates and merge markets from same event
      return this._deduplicateEvents(allEvents);
    } catch (error) {
      console.error('Polymarket search error:', error);
      throw new Error(`Failed to search Polymarket: ${error.message}`);
    }
  },

  /**
   * Fetch 7-day price history for a market
   * @param {string} clobTokenId - Token ID for the market
   * @returns {Promise<Array|null>} Price history array or null
   */
  async fetchPriceHistory(clobTokenId) {
    if (!clobTokenId) return null;

    try {
      const response = await fetch(
        `${CONFIG.POLYMARKET_PRICE_HISTORY_API}?market=${clobTokenId}&interval=1w&fidelity=60`
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Error fetching price history:', error);
      return null;
    }
  },

  /**
   * Enrich events with price history data
   * @param {Array} events - Events to enrich
   * @returns {Promise<Array>} Events with price history
   */
  async enrichWithPriceHistory(events) {
    return await Promise.all(
      events.map(async (event) => ({
        ...event,
        markets: await Promise.all(
          event.markets.map(async (market) => ({
            ...market,
            priceHistory: await this.fetchPriceHistory(market.clobTokenId)
          }))
        )
      }))
    );
  },

  /**
   * Transform API search results into normalized event objects
   * @private
   */
  _transformSearchResults(data) {
    const events = [];

    for (const event of (data.events || [])) {
      const markets = [];

      for (const market of (event.markets || [])) {
        if (market.closed) continue; // Skip closed markets

        const title = market.groupItemTitle || market.question;
        const probability = Utils.calculateProbabilityFromPrices(market.outcomePrices);
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
          clobTokenId: clobTokenId,
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
  },

  /**
   * Deduplicate events and merge markets from same event
   * @private
   */
  _deduplicateEvents(allEvents) {
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

    return Array.from(eventMap.values());
  }
};

// Freeze public interface
Object.freeze(PolymarketService);
