import type { NextApiResponse } from 'next';
import { connectDB }           from '@/lib/db';
import { withAdmin }           from '@/lib/auth';
import { cacheGet, cacheSet, CacheKey, TTL } from '@/lib/redis';
import { ParkingHistoryModel } from '@/models/ParkingHistory';
import type { ApiResponse, PaginatedResponse, IParkingHistory } from '@/types';

export default withAdmin(async (req, res: NextApiResponse<ApiResponse>) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { building, page = '1', limit = '20' } = req.query as Record<string, string>;
    if (!building) return res.status(400).json({ success: false, error: 'building is required' });

    const pg = Math.max(1, parseInt(page));
    const lm = Math.min(100, Math.max(1, parseInt(limit)));
    const ck = CacheKey.raffleHistory(building, pg);
    const cached = await cacheGet<PaginatedResponse<IParkingHistory>>(ck);
    if (cached) return res.status(200).json({ success: true, data: cached });

    await connectDB();
    const [docs, total] = await Promise.all([
      ParkingHistoryModel.find({ building }).populate('residentId', 'name unit').populate('spotId', 'spotNumber floor type').sort({ roundNumber: -1 }).skip((pg - 1) * lm).limit(lm).lean(),
      ParkingHistoryModel.countDocuments({ building }),
    ]);

    const result: PaginatedResponse<IParkingHistory> = { data: docs as unknown as IParkingHistory[], total, page: pg, limit: lm, totalPages: Math.ceil(total / lm) };
    await cacheSet(ck, result, TTL.HISTORY);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[history/building]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch building history' });
  }
});
