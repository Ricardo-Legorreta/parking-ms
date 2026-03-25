import type { NextApiResponse } from 'next';
import { connectDB }           from '@/lib/db';
import { withAuth, withAdmin, AuthenticatedRequest } from '@/lib/auth';
import { cacheGet, cacheSet, cacheDel, CacheKey, TTL } from '@/lib/redis';
import { sanitizeObject }      from '@/lib/sanitize';
import { RaffleRoundModel }    from '@/models/RaffleRound';
import type { ApiResponse, IRaffleRound } from '@/types';

const getCurrentRaffle = withAuth(async (req, res: NextApiResponse<ApiResponse>) => {
  try {
    const { building } = req.query as { building: string };
    if (!building) return res.status(400).json({ success: false, error: 'building is required' });

    const cached = await cacheGet<IRaffleRound>(CacheKey.currentRaffle(building));
    if (cached) return res.status(200).json({ success: true, data: cached });

    await connectDB();
    const raffle = await RaffleRoundModel.findOne({ building, status: { $in: ['pending','active'] } }).lean();
    if (!raffle) return res.status(404).json({ success: false, error: 'No active raffle found' });

    await cacheSet(CacheKey.currentRaffle(building), raffle, TTL.RAFFLE);
    return res.status(200).json({ success: true, data: raffle as unknown as IRaffleRound });
  } catch (err) {
    console.error('[raffle/get]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch raffle' });
  }
});

const createRaffle = withAdmin(async (req, res: NextApiResponse<ApiResponse>) => {
  try {
    const { building, startDate, endDate } = sanitizeObject(req.body ?? {}) as { building: string; startDate: string; endDate: string };
    if (!building || !startDate || !endDate)
      return res.status(400).json({ success: false, error: 'building, startDate and endDate are required' });

    await connectDB();
    const existing = await RaffleRoundModel.findOne({ building, status: { $in: ['pending','active'] } });
    if (existing) return res.status(409).json({ success: false, error: 'An active raffle already exists for this building' });

    const last = await RaffleRoundModel.findOne({ building }).sort({ roundNumber: -1 }).select('roundNumber').lean();
    const roundNumber = (last?.roundNumber ?? 0) + 1;

    const raffle = await RaffleRoundModel.create({ roundNumber, building, startDate: new Date(startDate), endDate: new Date(endDate), status: 'active' });
    await cacheDel(CacheKey.currentRaffle(building));
    return res.status(201).json({ success: true, data: raffle.toObject(), message: `Round ${roundNumber} created` });
  } catch (err) {
    console.error('[raffle/create]', err);
    return res.status(500).json({ success: false, error: 'Failed to create raffle' });
  }
});

export default async function raffleHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET')  return getCurrentRaffle(req, res);
  if (req.method === 'POST') return createRaffle(req, res);
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
