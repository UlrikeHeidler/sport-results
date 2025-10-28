// Lightweight logger wrapper — debug logs are no-ops in production
const isProd = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;

export const debug = (...args) => {
  if (!isProd) {
    // prefer console.debug when available
    if (console.debug) console.debug(...args);
    else console.log(...args);
  }
};

export const info = (...args) => console.info(...args);
export const warn = (...args) => console.warn(...args);
export const error = (...args) => console.error(...args);

export default {
  debug,
  info,
  warn,
  error
};
