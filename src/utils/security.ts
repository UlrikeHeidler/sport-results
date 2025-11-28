/**
 * Security Utilities
 * Input sanitization, validation, and security helpers
 */

import DOMPurify from 'dompurify';
import { ValidationError } from './errors';
import { VALIDATION_RULES } from '../constants';

// Configure DOMPurify for safe HTML sanitization
const configureDOMPurify = () => {
  // Allow only safe tags and attributes
  DOMPurify.addHook('beforeSanitizeElements', (node) => {
    // Remove script tags and event handlers
    if ((node as Element).tagName === 'SCRIPT') {
      (node as Element).remove();
    }
  });

  return DOMPurify;
};

const purify = configureDOMPurify();

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
  if (typeof html !== 'string') {
    return '';
  }

  return purify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'div', 'p', 'br'],
    ALLOWED_ATTR: ['class', 'id'],
    FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
};

/**
 * Sanitize text content to prevent injection attacks
 */
export const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
};

/**
 * Sanitize team name input
 */
export const sanitizeTeamName = (name: string): string => {
  if (typeof name !== 'string') {
    return '';
  }

  return name
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, VALIDATION_RULES.MAX_TEAM_NAME_LENGTH);
};

/**
 * Sanitize URL to prevent open redirect attacks
 */
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') {
    return '';
  }

  // Allow only http, https, and relative URLs
  const allowedProtocols = /^(https?:\/\/|\/)/i;

  if (!allowedProtocols.test(url)) {
    return '';
  }

  // Remove dangerous characters
  return url.replace(/[<>"']/g, '');
};

/**
 * Validate and sanitize API endpoint
 */
export const sanitizeApiEndpoint = (endpoint: string): string => {
  if (typeof endpoint !== 'string') {
    throw new ValidationError('API endpoint must be a string');
  }

  // Must be HTTPS for external APIs
  if (!endpoint.startsWith('https://') && !endpoint.startsWith('/')) {
    throw new ValidationError('API endpoint must use HTTPS or be relative');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /eval\(/i,
    /function\(/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(endpoint)) {
      throw new ValidationError('API endpoint contains suspicious content');
    }
  }

  return endpoint;
};

/**
 * Sanitize game data from API responses
 */
export const sanitizeGameData = (gameData: any): any => {
  if (!gameData || typeof gameData !== 'object') {
    return {};
  }

  const sanitized = { ...gameData };

  // Sanitize string fields
  const stringFields = ['id', 'league', 'venue', 'broadcast'];
  stringFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field]);
    }
  });

  // Sanitize team data
  if (sanitized.homeTeam) {
    sanitized.homeTeam = sanitizeTeamData(sanitized.homeTeam);
  }
  if (sanitized.awayTeam) {
    sanitized.awayTeam = sanitizeTeamData(sanitized.awayTeam);
  }

  // Ensure numeric fields are actually numbers
  const numericFields = ['score'];
  [sanitized.homeTeam, sanitized.awayTeam].forEach(team => {
    if (team) {
      numericFields.forEach(field => {
        if (team[field] !== undefined) {
          const num = Number(team[field]);
          team[field] = isNaN(num) ? 0 : Math.max(0, Math.floor(num));
        }
      });
    }
  });

  return sanitized;
};

/**
 * Sanitize team data
 */
export const sanitizeTeamData = (teamData: any): any => {
  if (!teamData || typeof teamData !== 'object') {
    return {};
  }

  const sanitized = { ...teamData };

  // Sanitize string fields
  const stringFields = ['name', 'abbreviation', 'displayName', 'shortDisplayName'];
  stringFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeTeamName(sanitized[field]);
    }
  });

  // Sanitize logo URL
  if (typeof sanitized.logo === 'string') {
    sanitized.logo = sanitizeUrl(sanitized.logo);
  }

  // Ensure score is a valid number
  if (sanitized.score !== undefined) {
    const score = Number(sanitized.score);
    sanitized.score = isNaN(score) ? 0 : Math.max(0, Math.floor(score));
  }

  return sanitized;
};

/**
 * Validate and sanitize user settings
 */
export const sanitizeUserSettings = (settings: any): any => {
  if (!settings || typeof settings !== 'object') {
    return {};
  }

  const sanitized = { ...settings };

  // Validate refresh interval
  if (typeof sanitized.refreshInterval === 'number') {
    sanitized.refreshInterval = Math.max(
      VALIDATION_RULES.MIN_REFRESH_INTERVAL,
      Math.min(VALIDATION_RULES.MAX_REFRESH_INTERVAL, Math.floor(sanitized.refreshInterval)),
    );
  }

  // Validate boolean settings
  const booleanFields = ['colorCoding', 'showTeamForm', 'notifications'];
  booleanFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      sanitized[field] = Boolean(sanitized[field]);
    }
  });

  // Sanitize arrays
  if (Array.isArray(sanitized.selectedLeagues)) {
    sanitized.selectedLeagues = sanitized.selectedLeagues
      .filter((league: any) => typeof league === 'string')
      .map((league: string) => sanitizeText(league).toUpperCase())
      .slice(0, 10); // Limit array size
  }

  if (Array.isArray(sanitized.hiddenTeams)) {
    sanitized.hiddenTeams = sanitized.hiddenTeams
      .filter((team: any) => typeof team === 'string')
      .map((team: string) => sanitizeText(team))
      .slice(0, 100); // Limit array size
  }

  return sanitized;
};

/**
 * Rate limiting utility
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

// Global rate limiter instance
export const apiRateLimiter = new RateLimiter(50, 60000); // 50 requests per minute

/**
 * Content Security Policy helpers
 */
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Secure random string generator
 */
export const generateSecureId = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
};

/**
 * Validate file upload (if needed in the future)
 */
export const validateFileUpload = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('Invalid file type');
  }

  if (file.size > maxSize) {
    throw new ValidationError('File too large');
  }

  return true;
};

/**
 * Escape special characters for use in regular expressions
 */
export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Safe JSON parsing with error handling
 */
export const safeJsonParse = <T = any>(json: string, fallback: T): T => {
  try {
    const parsed = JSON.parse(json);
    return parsed;
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
};

/**
 * Safe localStorage operations
 */
export const safeLocalStorage = {
  getItem: (key: string, fallback: string = ''): string => {
    try {
      return localStorage.getItem(sanitizeText(key)) || fallback;
    } catch (error) {
      console.warn('localStorage getItem failed:', error);
      return fallback;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(sanitizeText(key), sanitizeText(value));
      return true;
    } catch (error) {
      console.warn('localStorage setItem failed:', error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(sanitizeText(key));
      return true;
    } catch (error) {
      console.warn('localStorage removeItem failed:', error);
      return false;
    }
  },
};

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeTeamName,
  sanitizeUrl,
  sanitizeGameData,
  sanitizeTeamData,
  sanitizeUserSettings,
  apiRateLimiter,
  generateSecureId,
  safeJsonParse,
  safeLocalStorage,
};
