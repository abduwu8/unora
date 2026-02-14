import { createClient } from 'redis';

let client = null;

/**
 * Normalize a string for cache keys: trim, lowercase, collapse spaces.
 */
function normalize(str) {
  if (str == null || typeof str !== 'string') return '';
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * TTLs in seconds. Only cache valid responses; expire so data stays fresh.
 */
export const TTL = {
  UNIVERSITY_SCORE: 12 * 60 * 60,   // 12h
  BUDGET: 24 * 60 * 60,             // 24h
  OVERALL: 12 * 60 * 60,            // 12h
  DOCUMENTS: 24 * 60 * 60,          // 24h
  COMPARE: 12 * 60 * 60,            // 12h
};

export function normalizeKey(parts) {
  return parts.map((p) => normalize(String(p))).filter(Boolean).join(':');
}

/**
 * Get cached value. Returns { data, cachedAt } or null if miss/expired/error.
 * We only ever store valid parsed responses; no errors are cached.
 */
export async function cacheGet(key) {
  if (!client) return null;
  try {
    const raw = await client.get(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.cachedAt !== 'number') return null;
    return { data: parsed.data, cachedAt: parsed.cachedAt };
  } catch {
    return null;
  }
}

/**
 * Set cache. Only call with valid response payload. Stores data + cachedAt.
 */
export async function cacheSet(key, data, ttlSeconds) {
  if (!client) return;
  try {
    const value = JSON.stringify({
      data,
      cachedAt: Date.now(),
    });
    await client.setEx(key, ttlSeconds, value);
  } catch (err) {
    console.error('Redis cache set error:', err.message);
  }
}

/**
 * Connect Redis. No-op if REDIS_URL is not set (app works without cache).
 * Reads REDIS_URL at call time so dotenv has already loaded .env.
 */
export async function initCache() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl || typeof redisUrl !== 'string' || redisUrl.trim() === '') {
    console.log('Redis: REDIS_URL not set, response cache disabled');
    return;
  }
  try {
    client = createClient({ url: redisUrl.trim() });
    client.on('error', (err) => console.error('Redis error:', err.message));
    await client.connect();
    console.log('Redis: connected, response cache enabled');
  } catch (err) {
    console.error('Redis connect failed:', err.message);
    client = null;
  }
}
