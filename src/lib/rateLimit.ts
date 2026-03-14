import { NextApiRequest, NextApiResponse } from 'next';
import { getRedis } from './redis';
import type { ApiResponse } from '@/types';

interface RateLimitOptions { windowSeconds: number; maxRequests: number }

export function rateLimit(opts: RateLimitOptions) {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse>, next: () => Promise<void>) => {
    const ip  = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown';
    const key = `rl:${req.url}:${ip}`;
    try {
      const redis = await getRedis();
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, opts.windowSeconds);
      res.setHeader('X-RateLimit-Limit',     opts.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, opts.maxRequests - count));
      if (count > opts.maxRequests) {
        res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
        return;
      }
    } catch { /* fail open */ }
    await next();
  };
}
