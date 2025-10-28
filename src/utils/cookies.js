// Simple cookie helpers used for settings persistence
export const setCookie = (name, value, days = 365) => {
  if (typeof document === 'undefined') return; // non-browser
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const cookieValue = encodeURIComponent(typeof value === 'string' ? value : JSON.stringify(value));
    document.cookie = `${name}=${cookieValue}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.error('Failed to set cookie', e);
  }
};

export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  try {
    const pairs = document.cookie.split(';').map(c => c.trim());
    for (const pair of pairs) {
      if (!pair) continue;
      const [k, ...v] = pair.split('=');
      if (k === name) {
        const val = v.join('=');
        try {
          const decoded = decodeURIComponent(val);
          // Try to parse JSON, fallback to string
          try { return JSON.parse(decoded); } catch (_) { return decoded; }
        } catch (e) {
          return val;
        }
      }
    }
    return null;
  } catch (e) {
    console.error('Failed to get cookie', e);
    return null;
  }
};

export const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
};
