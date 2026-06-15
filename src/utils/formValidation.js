/**
 * Form Validation Utilities
 * Provides reusable validation functions for forms across the application
 */

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the validation passed
 * @property {string} error - Error message if validation failed
 * @property {string} field - Field name that was validated
 */

/**
 * Base validation function
 * @param {any} value - Value to validate
 * @param {string} field - Field name
 * @param {Function} validator - Validation function
 * @returns {ValidationResult}
 */
const createValidationResult = (value, field, validator) => {
  try {
    const result = validator(value);
    return {
      isValid: result === true,
      error: typeof result === 'string' ? result : '',
      field
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Validation error: ${error.message}`,
      field
    };
  }
};

/**
 * Required field validator
 */
export const required = (message = 'This field is required') => (value) => {
  if (value === null || value === undefined || value === '') {
    return message;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return message;
  }
  if (Array.isArray(value) && value.length === 0) {
    return message;
  }
  return true;
};

/**
 * Minimum length validator
 */
export const minLength = (min, message) => (value) => {
  const msg = message || `Must be at least ${min} characters`;
  if (!value) return true; // Let required handle empty values
  if (typeof value === 'string' && value.length < min) {
    return msg;
  }
  if (Array.isArray(value) && value.length < min) {
    return msg;
  }
  return true;
};

/**
 * Maximum length validator
 */
export const maxLength = (max, message) => (value) => {
  const msg = message || `Must be no more than ${max} characters`;
  if (!value) return true;
  if (typeof value === 'string' && value.length > max) {
    return msg;
  }
  if (Array.isArray(value) && value.length > max) {
    return msg;
  }
  return true;
};

/**
 * Number range validator
 */
export const numberRange = (min, max, message) => (value) => {
  const msg = message || `Must be between ${min} and ${max}`;
  if (value === null || value === undefined || value === '') return true;
  const num = Number(value);
  if (isNaN(num)) {
    return 'Must be a valid number';
  }
  if (num < min || num > max) {
    return msg;
  }
  return true;
};

/**
 * Email validator
 */
export const email = (message = 'Must be a valid email address') => (value) => {
  if (!value) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? true : message;
};

/**
 * URL validator
 */
export const url = (message = 'Must be a valid URL') => (value) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return message;
  }
};

/**
 * Pattern validator
 */
export const pattern = (regex, message = 'Invalid format') => (value) => {
  if (!value) return true;
  return regex.test(value) ? true : message;
};

/**
 * Custom validator
 */
export const custom = (validatorFn, message = 'Invalid value') => (value) => {
  try {
    const result = validatorFn(value);
    return result ? true : message;
  } catch {
    return message;
  }
};

/**
 * League selection validator
 */
export const validateLeagueSelection = (leagues) => {
  if (!Array.isArray(leagues)) {
    return 'Leagues must be an array';
  }
  if (leagues.length === 0) {
    return 'At least one league must be selected';
  }
  const validLeagues = ['nfl', 'nhl', 'fcs', 'fbs', 'mlb', 'fifa_world', 'bundesliga1', 'bundesliga2', 'dfb_pokal', 'ucl', 'mls', 'nba', 'ncaaw'];
  const invalidLeagues = leagues.filter(league => !validLeagues.includes(league));
  if (invalidLeagues.length > 0) {
    return `Invalid leagues: ${invalidLeagues.join(', ')}`;
  }
  return true;
};

/**
 * Refresh interval validator
 */
export const validateRefreshInterval = (interval) => {
  const num = Number(interval);
  if (isNaN(num)) {
    return 'Refresh interval must be a number';
  }
  if (num < 5) {
    return 'Refresh interval must be at least 5 seconds';
  }
  if (num > 300) {
    return 'Refresh interval must be no more than 300 seconds';
  }
  return true;
};

/**
 * Settings validator
 */
export const validateSettings = (settings) => {
  const errors = {};
  
  // Validate refresh interval
  const intervalResult = validateRefreshInterval(settings.refreshInterval);
  if (intervalResult !== true) {
    errors.refreshInterval = intervalResult;
  }
  
  // Validate selected leagues
  const leaguesResult = validateLeagueSelection(settings.selectedLeagues);
  if (leaguesResult !== true) {
    errors.selectedLeagues = leaguesResult;
  }
  
  // Validate boolean fields
  if (typeof settings.colorCoding !== 'boolean') {
    errors.colorCoding = 'Color coding must be a boolean';
  }
  
  if (typeof settings.showTeamForm !== 'boolean') {
    errors.showTeamForm = 'Show team form must be a boolean';
  }
  
  if (typeof settings.darkMode !== 'boolean') {
    errors.darkMode = 'Dark mode must be a boolean';
  }
  
  // Validate hidden teams
  if (!Array.isArray(settings.hiddenTeams)) {
    errors.hiddenTeams = 'Hidden teams must be an array';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate field with multiple validators
 */
export const validateField = (value, field, validators = []) => {
  for (const validator of validators) {
    const result = createValidationResult(value, field, validator);
    if (!result.isValid) {
      return result;
    }
  }
  return {
    isValid: true,
    error: '',
    field
  };
};

/**
 * Validate multiple fields
 */
export const validateFields = (data, fieldValidators = {}) => {
  const results = {};
  let isValid = true;
  
  Object.entries(fieldValidators).forEach(([field, validators]) => {
    const value = data[field];
    const result = validateField(value, field, validators);
    results[field] = result;
    if (!result.isValid) {
      isValid = false;
    }
  });
  
  return {
    isValid,
    results,
    errors: Object.fromEntries(
      Object.entries(results)
        .filter(([, result]) => !result.isValid)
        .map(([field, result]) => [field, result.error])
    )
  };
};

/**
 * Debounced validation
 */
export const createDebouncedValidator = (validator, delay = 300) => {
  let timeoutId;
  
  return (value, callback) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, delay);
  };
};

export default {
  required,
  minLength,
  maxLength,
  numberRange,
  email,
  url,
  pattern,
  custom,
  validateLeagueSelection,
  validateRefreshInterval,
  validateSettings,
  validateField,
  validateFields,
  createDebouncedValidator
};