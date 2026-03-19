import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB }           from '@/lib/db';
import { cacheDel, cacheInvalidatePattern, CacheKey } from '@/lib/redis';
import { ParkingSpotModel }    from '@/models/ParkingSpot';
import { ParkingHistoryModel } from '@/models/ParkingHistory';
import type { ApiResponse }    from '@/types';

export default async function expireHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET)
    return res.status(401).json({ success: false, error: 'Unauthorized' });

  await connectDB();
  const now          = new Date();
  const expiredSpots = await ParkingSpotModel.find({ 'currentAssignment.expiresAt': { $lte: now } }).lean();
  if (!expiredSpots.length) return res.status(200).json({ success: true, message: 'No spots to expire', data: { count: 0 } });

  const expiredIds = expiredSpots.map(s => s._id);
  await Promise.all([
    ParkingSpotModel.updateMany({ _id: { $in: expiredIds } }, { $set: { currentAssignment: null } }),
    ParkingHistoryModel.updateMany({ spotId: { $in: expiredIds }, status: 'active' }, { $set: { status: 'expired' } }),
  ]);

  const buildings = [...new Set(expiredSpots.map(s => s.building as string))];
  try {
    await Promise.all([...buildings.map(b => cacheDel(CacheKey.spots(b))), cacheInvalidatePattern('history:*')]);
  } catch {
    console.warn('[expire-spots] Cache invalidation failed (Redis may be unavailable)');
  }
  return res.status(200).json({ success: true, message: `${expiredSpots.length} spot(s) released`, data: { count: expiredSpots.length, buildings } });
}
