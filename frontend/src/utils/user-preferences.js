const DISPLAY_PREFS_KEY = 'chomnuoy_display_preferences';
const PRIVACY_PREFS_KEY = 'chomnuoy_privacy_preferences';

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
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaults;
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
  window.localStorage.setItem(
    DISPLAY_PREFS_KEY,
    JSON.stringify({ ...DEFAULT_DISPLAY_PREFERENCES, ...preferences }),
  );
}

export function getPrivacyPreferences() {
  return readPreferences(PRIVACY_PREFS_KEY, DEFAULT_PRIVACY_PREFERENCES);
}

export function setPrivacyPreferences(preferences) {
  window.localStorage.setItem(
    PRIVACY_PREFS_KEY,
    JSON.stringify({ ...DEFAULT_PRIVACY_PREFERENCES, ...preferences }),
  );
}
