import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const CONNECT_TIMEOUT_MS = 3_000;
let redisClient: ReturnType<typeof createClient> | null = null;
let connectPromise: Promise<ReturnType<typeof createClient>> | null = null;

export async function getRedis() {
  if (redisClient?.isOpen) return redisClient;

  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    redisClient = createClient({
      url: REDIS_URL,
      socket: { connectTimeout: CONNECT_TIMEOUT_MS, reconnectStrategy: false },
    });
    redisClient.on('error', (err) => console.error('[Redis]', err));
    await redisClient.connect();
    return redisClient;
  })();

  try {
    return await connectPromise;
  } catch (err) {
    redisClient = null;
    connectPromise = null;
    throw err;
  }
}

export const TTL = {
  SPOTS   : 60,
  RAFFLE  : 30,
  RESIDENT: 120,
  HISTORY : 300,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const c   = await getRedis();
    const raw = await c.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    console.error('[Redis] cacheGet failed:', err);
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    const c = await getRedis();
    await c.set(key, JSON.stringify(value), { EX: ttl });
  } catch (err) {
    console.error('[Redis] cacheSet failed:', err);
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    const c = await getRedis();
    if (keys.length) await c.del(keys);
  } catch (err) {
    console.error('[Redis] cacheDel failed:', err);
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const c = await getRedis();
    let cursor = 0;
    do {
      const reply = await c.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length) await c.del(reply.keys);
    } while (cursor !== 0);
  } catch (err) {
    console.error('[Redis] cacheInvalidatePattern failed:', err);
  }
}

export const CacheKey = {
  spots        : (b: string)             => `spots:${b}`,
  spot         : (id: string)            => `spot:${id}`,
  resident     : (id: string)            => `resident:${id}`,
  residents    : (b: string)             => `residents:${b}`,
  currentRaffle: (b: string)             => `raffle:current:${b}`,
  raffleHistory: (b: string, p: number)  => `raffle:history:${b}:${p}`,
  myHistory    : (id: string)            => `history:${id}`,
};
