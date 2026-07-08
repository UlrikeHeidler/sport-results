import { setCookie, getCookie, deleteCookie } from './cookies';

const SETTINGS_KEY = 'sportsAppSettings';

// Settings are written to both localStorage and a cookie so they survive
// both normal browser sessions (localStorage) and cases where localStorage
// is cleared but cookies persist (or vice versa, e.g. private-browsing quirks).
// On read, the cookie is preferred because it has an explicit expiry;
// localStorage is the fallback.

export const loadSettings = () => {
  try {
    const cookie = getCookie(SETTINGS_KEY);
    if (cookie) return typeof cookie === 'string' ? JSON.parse(cookie) : cookie;

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.error('loadSettings error', e);
  }
  return null;
};

export const saveSettings = (settings) => {
  try {
    const payload = JSON.stringify(settings);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, payload);
    }
    setCookie(SETTINGS_KEY, settings, 365);
  } catch (e) {
    console.error('saveSettings error', e);
  }
};

export const clearSettings = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SETTINGS_KEY);
    }
    deleteCookie(SETTINGS_KEY);
  } catch (e) {
    console.error('clearSettings error', e);
  }
};

export default {
  loadSettings,
  saveSettings,
  clearSettings
};
