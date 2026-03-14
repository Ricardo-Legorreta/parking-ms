import type { NextApiResponse } from 'next';
import { connectDB }           from '@/lib/db';
import { withAuth, withAdmin, AuthenticatedRequest } from '@/lib/auth';
import { cacheGet, cacheSet, cacheDel, CacheKey, TTL } from '@/lib/redis';
import { sanitizeObject }      from '@/lib/sanitize';
import { ResidentModel }       from '@/models/Resident';
import { ParkingSpotModel }    from '@/models/ParkingSpot';
import type { ApiResponse, IParkingSpot } from '@/types';

const getSpots = withAuth(async (req, res: NextApiResponse<ApiResponse>) => {
  let bldg = req.query.building as string;
  if (req.user.role !== 'admin') {
    await connectDB();
    const r = await ResidentModel.findById(req.user.residentId).select('building').lean();
    bldg = (r?.building as string) ?? '';
  }
  if (!bldg) return res.status(400).json({ success: false, error: 'Building is required' });

  const cached = await cacheGet<IParkingSpot[]>(CacheKey.spots(bldg));
  if (cached) return res.status(200).json({ success: true, data: cached });

  await connectDB();
  const spots = await ParkingSpotModel.find({ building: bldg, isActive: true }).select('-__v').sort({ floor: 1, spotNumber: 1 }).lean();
  await cacheSet(CacheKey.spots(bldg), spots, TTL.SPOTS);
  return res.status(200).json({ success: true, data: spots });
});

const createSpot = withAdmin(async (req, res: NextApiResponse<ApiResponse>) => {
  const { spotNumber, building, floor, type } = sanitizeObject(req.body ?? {}) as { spotNumber: string; building: string; floor: number; type: string };
  if (!spotNumber || !building || floor === undefined)
    return res.status(400).json({ success: false, error: 'spotNumber, building and floor are required' });

  await connectDB();
  const spot = await ParkingSpotModel.create({ spotNumber, building, floor, type: type ?? 'standard' });
  await cacheDel(CacheKey.spots(building));
  return res.status(201).json({ success: true, data: spot.toObject(), message: 'Spot created' });
});

export default async function spotsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET')  return getSpots(req, res);
  if (req.method === 'POST') return createSpot(req, res);
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
