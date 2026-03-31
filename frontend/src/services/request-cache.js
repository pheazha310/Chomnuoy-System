const memoryCache = new Map();
const inFlightRequests = new Map();
const cooldowns = new Map();

function getStorageKey(key) {
  return `request_cache:${key}`;
}

function now() {
  return Date.now();
}

function readSessionCache(key, ttlMs) {
  try {
    const raw = window.sessionStorage.getItem(getStorageKey(key));
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (now() - Number(parsed.timestamp || 0) > ttlMs) {
      window.sessionStorage.removeItem(getStorageKey(key));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeSessionCache(key, data) {
  try {
    window.sessionStorage.setItem(
      getStorageKey(key),
      JSON.stringify({
        timestamp: now(),
        data,
      }),
    );
  } catch {
    // Ignore storage failures.
  }
}

function createHttpError(response, fallbackMessage) {
  const error = new Error(`${fallbackMessage} (${response.status})`);
  error.status = response.status;
  return error;
}

export function getCachedCooldown(key) {
  const until = cooldowns.get(key) || 0;
  return until > now() ? until : 0;
}

export async function getCachedJson(url, options = {}) {
  const {
    cacheKey = url,
    ttlMs = 60 * 1000,
    cooldownMs = 30 * 1000,
    headers,
    defaultValue,
    allowStatuses = [],
    fallbackMessage = 'Request failed',
  } = options;

  const cooldownUntil = getCachedCooldown(cacheKey);
  if (cooldownUntil) {
    const error = new Error('Request temporarily paused after rate limiting. Please wait a moment.');
    error.status = 429;
    throw error;
  }

  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry && now() - memoryEntry.timestamp <= ttlMs) {
    return memoryEntry.data;
  }

  const sessionEntry = readSessionCache(cacheKey, ttlMs);
  if (sessionEntry !== null) {
    memoryCache.set(cacheKey, { timestamp: now(), data: sessionEntry });
    return sessionEntry;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const request = fetch(url, { headers })
    .then(async (response) => {
      if (!response.ok) {
        if (allowStatuses.includes(response.status)) {
          return defaultValue;
        }
        if (response.status === 429) {
          cooldowns.set(cacheKey, now() + cooldownMs);
        }
        throw createHttpError(response, fallbackMessage);
      }
      return response.json();
    })
    .then((data) => {
      memoryCache.set(cacheKey, { timestamp: now(), data });
      writeSessionCache(cacheKey, data);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);
  return request;
}

export async function getCachedBundle(bundleKey, loaders, options = {}) {
  const {
    ttlMs = 60 * 1000,
  } = options;

  const memoryEntry = memoryCache.get(bundleKey);
  if (memoryEntry && now() - memoryEntry.timestamp <= ttlMs) {
    return memoryEntry.data;
  }

  const sessionEntry = readSessionCache(bundleKey, ttlMs);
  if (sessionEntry !== null) {
    memoryCache.set(bundleKey, { timestamp: now(), data: sessionEntry });
    return sessionEntry;
  }

  if (inFlightRequests.has(bundleKey)) {
    return inFlightRequests.get(bundleKey);
  }

  const request = Promise.all(loaders.map((loader) => loader()))
    .then((parts) => {
      const data = Object.assign({}, ...parts);
      memoryCache.set(bundleKey, { timestamp: now(), data });
      writeSessionCache(bundleKey, data);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(bundleKey);
    });

  inFlightRequests.set(bundleKey, request);
  return request;
}
