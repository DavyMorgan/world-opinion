/**
 * Cache service for storing market results
 * Uses chrome.storage.local with TTL-based expiration
 */

const CacheService = {
  CACHE_KEY_PREFIX: 'cache_',

  /**
   * Get cached results for a URL
   * @param {string} url - Page URL
   * @returns {Promise<Object|null>} Cached data or null if expired/missing
   */
  async get(url) {
    const normalizedUrl = Utils.normalizeUrl(url);
    const cacheKey = this.CACHE_KEY_PREFIX + this._hashUrl(normalizedUrl);

    try {
      const result = await chrome.storage.local.get(cacheKey);
      const cached = result[cacheKey];

      if (!cached) return null;

      // Check if expired
      if (Date.now() > cached.expiresAt) {
        await this.clear(url);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Store results in cache
   * @param {string} url - Page URL
   * @param {Object} data - Data to cache (analysis and markets)
   */
  async set(url, data) {
    const normalizedUrl = Utils.normalizeUrl(url);
    const cacheKey = this.CACHE_KEY_PREFIX + this._hashUrl(normalizedUrl);

    try {
      await chrome.storage.local.set({
        [cacheKey]: {
          data: data,
          cachedAt: Date.now(),
          expiresAt: Date.now() + CONFIG.CACHE_TTL_MS,
          url: normalizedUrl
        }
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  /**
   * Clear cache for a specific URL
   * @param {string} url - Page URL
   */
  async clear(url) {
    const normalizedUrl = Utils.normalizeUrl(url);
    const cacheKey = this.CACHE_KEY_PREFIX + this._hashUrl(normalizedUrl);

    try {
      await chrome.storage.local.remove(cacheKey);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  /**
   * Clear all cached data
   */
  async clearAll() {
    try {
      const all = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(all).filter(k => k.startsWith(this.CACHE_KEY_PREFIX));
      if (cacheKeys.length > 0) {
        await chrome.storage.local.remove(cacheKeys);
      }
    } catch (error) {
      console.error('Cache clearAll error:', error);
    }
  },

  /**
   * Simple hash function for URL to create cache key
   * @private
   */
  _hashUrl(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
};

// Freeze public interface
Object.freeze(CacheService);
