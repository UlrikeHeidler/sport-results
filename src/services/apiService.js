/**
 * Consolidated API Service
 * Eliminates duplicate API logic and provides a unified interface for data fetching
 */

import { handleError } from '../utils/errorHandler';
import { debug } from '../utils/logger';
import { API_ENDPOINTS } from '../config/constants';

/**
 * Base API client with common functionality
 */
class ApiClient {
  constructor(baseURL = '', defaultOptions = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...defaultOptions.headers
      },
      ...defaultOptions
    };
  }

  /**
   * Make HTTP request with error handling and retries
   */
  async request(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const requestOptions = {
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers
      }
    };

    let lastError;
    const maxRetries = options.retries || 3;
    const retryDelay = options.retryDelay || 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        debug(`API Request (attempt ${attempt + 1}):`, fullUrl);
        
        const response = await fetch(fullUrl, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        debug(`API Response:`, { url: fullUrl, status: response.status, dataSize: JSON.stringify(data).length });
        
        return {
          data,
          status: response.status,
          headers: response.headers,
          url: fullUrl
        };
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          debug(`API request failed, retrying in ${retryDelay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        } else {
          handleError(error, `API request failed after ${maxRetries + 1} attempts`);
        }
      }
    }

    throw lastError;
  }

  /**
   * GET request
   */
  async get(url, params = {}, options = {}) {
    const urlWithParams = this.buildUrlWithParams(url, params);
    return this.request(urlWithParams, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(url, data = null, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : null
    });
  }

  /**
   * PUT request
   */
  async put(url, data = null, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : null
    });
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * Build URL with query parameters
   */
  buildUrlWithParams(url, params) {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const urlObj = new URL(url, this.baseURL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        urlObj.searchParams.append(key, String(value));
      }
    });

    return urlObj.toString();
  }
}

/**
 * Sports API client specifically for ESPN endpoints
 */
class SportsApiClient extends ApiClient {
  constructor() {
    super('', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SportsResultsApp/1.0'
      }
    });
  }

  /**
   * Fetch games for a specific league
   */
  async fetchLeagueGames(league, dateFilter = null) {
    const endpoint = API_ENDPOINTS[league.toLowerCase()];
    if (!endpoint) {
      throw new Error(`Unsupported league: ${league}`);
    }

    const params = {};
    if (dateFilter) {
      params.dates = dateFilter;
    } else {
      // Default to today's date
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      params.dates = `${today.getFullYear()}${month}${day}`;
    }

    try {
      const response = await this.get(endpoint, params);
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch ${league} games:`, {
        error: error.message,
        endpoint,
        params,
        timestamp: new Date().toISOString()
      });
      return { events: [] }; // Return empty events instead of throwing
    }
  }

  /**
   * Fetch game summary/boxscore
   */
  async fetchGameSummary(league, eventId) {
    const baseEndpoint = API_ENDPOINTS[league.toLowerCase()];
    if (!baseEndpoint) {
      throw new Error(`Unsupported league: ${league}`);
    }

    const summaryEndpoint = baseEndpoint.includes('/scoreboard')
      ? baseEndpoint.replace('/scoreboard', `/summary`)
      : `${baseEndpoint}/summary`;

    try {
      const response = await this.get(summaryEndpoint, { event: eventId });
      return response.data;
    } catch (error) {
      handleError(error, 'fetchGameSummary');
      return null;
    }
  }

  /**
   * Fetch multiple leagues in parallel
   */
  async fetchMultipleLeagues(leagues, dateFilter = null) {
    const promises = leagues.map(league =>
      this.fetchLeagueGames(league, dateFilter)
        .then(data => ({ league, data, success: true }))
        .catch(error => ({ league, error, success: false }))
    );

    const results = await Promise.allSettled(promises);
    
    const successfulResults = {};
    const errors = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { league, data, success, error } = result.value;
        if (success) {
          successfulResults[league] = data;
        } else {
          errors.push({ league, error });
        }
      } else {
        errors.push({ league: leagues[index], error: result.reason });
      }
    });

    return { data: successfulResults, errors };
  }
}

/**
 * Cache manager for API responses
 */
class ApiCache {
  constructor(defaultTtl = 30000) { // 30 seconds default
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
  }

  /**
   * Generate cache key
   */
  generateKey(url, params = {}) {
    const paramString = Object.keys(params).length > 0 
      ? JSON.stringify(params, Object.keys(params).sort())
      : '';
    return `${url}${paramString}`;
  }

  /**
   * Get cached response
   */
  get(url, params = {}) {
    const key = this.generateKey(url, params);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set cached response
   */
  set(url, params = {}, data, ttl = this.defaultTtl) {
    const key = this.generateKey(url, params);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    });
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const value of this.cache.values()) {
      if (now > value.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length
    };
  }
}

/**
 * Cached API client
 */
class CachedApiClient extends SportsApiClient {
  constructor(cacheTtl = 30000) {
    super();
    this.cache = new ApiCache(cacheTtl);
  }

  async get(url, params = {}, options = {}) {
    const useCache = options.cache !== false;
    const cacheTtl = options.cacheTtl || this.cache.defaultTtl;

    if (useCache) {
      const cached = this.cache.get(url, params);
      if (cached) {
        debug('Cache hit:', url);
        return cached;
      }
    }

    const response = await super.get(url, params, options);
    
    if (useCache && response.status === 200) {
      this.cache.set(url, params, response, cacheTtl);
    }

    return response;
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return this.cache.getStats();
  }
}

// Create singleton instances
export const apiClient = new ApiClient();
export const sportsApiClient = new SportsApiClient();
export const cachedSportsApiClient = new CachedApiClient();

// Export classes for custom instances
export { ApiClient, SportsApiClient, CachedApiClient, ApiCache };

// Default export
export default sportsApiClient;