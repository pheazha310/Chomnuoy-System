const DISPLAY_PREFS_KEY = 'chomnuoy_display_preferences';
const PRIVACY_PREFS_KEY = 'chomnuoy_privacy_preferences';

function getSessionIdentifier() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    const session = raw ? JSON.parse(raw) : null;
    const userId = Number(session?.userId);
    if (Number.isFinite(userId) && userId > 0) return `user_${userId}`;
    const email = String(session?.email || '').trim().toLowerCase();
    if (email) return `email_${email}`;
    return null;
  } catch {
    return null;
  }
}

function getScopedKey(baseKey) {
  const identifier = getSessionIdentifier();
  return identifier ? `${baseKey}_${identifier}` : baseKey;
}

const DEFAULT_DISPLAY_PREFERENCES = {
  darkMode: false,
  highContrast: false,
};

const DEFAULT_PRIVACY_PREFERENCES = {
  publicProfile: true,
  showDonations: false,
};

function readPreferences(key, defaults) {
  try {
    const scopedKey = getScopedKey(key);
    const rawScoped = window.localStorage.getItem(scopedKey);
    if (rawScoped) {
      const parsed = JSON.parse(rawScoped);
      return { ...defaults, ...parsed };
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function getDisplayPreferences() {
  return readPreferences(DISPLAY_PREFS_KEY, DEFAULT_DISPLAY_PREFERENCES);
}

export function setDisplayPreferences(preferences) {
  const payload = JSON.stringify({ ...DEFAULT_DISPLAY_PREFERENCES, ...preferences });
  window.localStorage.setItem(getScopedKey(DISPLAY_PREFS_KEY), payload);
}

export function getPrivacyPreferences() {
  return readPreferences(PRIVACY_PREFS_KEY, DEFAULT_PRIVACY_PREFERENCES);
}

export function setPrivacyPreferences(preferences) {
  const payload = JSON.stringify({ ...DEFAULT_PRIVACY_PREFERENCES, ...preferences });
  window.localStorage.setItem(getScopedKey(PRIVACY_PREFS_KEY), payload);
}
