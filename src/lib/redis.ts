import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedis() {
  if (redisClient?.isOpen) return redisClient;
  redisClient = createClient({ url: REDIS_URL });
  redisClient.on('error', (err) => console.error('[Redis]', err));
  await redisClient.connect();
  return redisClient;
}

export const TTL = {
  SPOTS   : 60,
  RAFFLE  : 30,
  RESIDENT: 120,
  HISTORY : 300,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const c   = await getRedis();
  const raw = await c.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function cacheSet<T>(key: string, value: T, ttl: number): Promise<void> {
  const c = await getRedis();
  await c.set(key, JSON.stringify(value), { EX: ttl });
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const c = await getRedis();
  if (keys.length) await c.del(keys);
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const c = await getRedis();
  let cursor = 0;
  do {
    const reply = await c.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = reply.cursor;
    if (reply.keys.length) await c.del(reply.keys);
  } while (cursor !== 0);
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
