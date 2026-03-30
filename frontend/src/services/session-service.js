const SESSION_STORAGE_KEY = 'chomnuoy_session';
const AUTH_TOKEN_KEY = 'authToken';
const SESSION_UPDATED_EVENT = 'chomnuoy-session-updated';

function dispatchSessionUpdated() {
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

export function getSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed) return null;

    if (!parsed.isLoggedIn && (parsed.email || parsed.userId || parsed.role || parsed.accountType)) {
      const normalized = { ...parsed, isLoggedIn: true };
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setSession(sessionData) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  dispatchSessionUpdated();
}

export function clearAuthState() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  dispatchSessionUpdated();
}

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function setAuthToken(token) {
  if (!token) return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  dispatchSessionUpdated();
}

export function isDonorSession(session) {
  return Boolean(session?.isLoggedIn && String(session?.role || session?.accountType || '') === 'Donor');
}

export function getSessionUpdatedEventName() {
  return SESSION_UPDATED_EVENT;
}
