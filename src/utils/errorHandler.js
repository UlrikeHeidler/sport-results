// Centralized error handling and logging utility
import { debug } from './logger';

/**
 * Log and optionally rethrow an error
 * @param {Error|string} error - The error to log
 * @param {string} [context] - Optional context or label
 * @param {boolean} [rethrow=false] - Whether to rethrow after logging
 */
export function handleError(error, context = '', rethrow = false) {
  const msg = context ? `[${context}]` : '';
  if (error instanceof Error) {
    // Log stack if available
    debug(`${msg} ${error.message}`);
    if (error.stack) debug(error.stack);
  } else {
    debug(`${msg} ${String(error)}`);
  }
  if (rethrow) throw error;
}
