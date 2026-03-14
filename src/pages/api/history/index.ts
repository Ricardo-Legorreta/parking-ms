import type { NextApiResponse } from 'next';
import { connectDB }           from '@/lib/db';
import { withAuth }            from '@/lib/auth';
import { cacheGet, cacheSet, CacheKey, TTL } from '@/lib/redis';
import { ParkingHistoryModel } from '@/models/ParkingHistory';
import type { ApiResponse, IParkingHistory } from '@/types';

export default withAuth(async (req, res: NextApiResponse<ApiResponse>) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const residentId = req.user.residentId!;
  const cacheKey   = CacheKey.myHistory(residentId);
  const cached     = await cacheGet<IParkingHistory[]>(cacheKey);
  if (cached) return res.status(200).json({ success: true, data: cached });

  await connectDB();
  const history = await ParkingHistoryModel.find({ residentId }).populate('spotId', 'spotNumber floor type building').sort({ roundNumber: -1 }).lean();
  await cacheSet(cacheKey, history, TTL.HISTORY);
  return res.status(200).json({ success: true, data: history as unknown as IParkingHistory[] });
});
