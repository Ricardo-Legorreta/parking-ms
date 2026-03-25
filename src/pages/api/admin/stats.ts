import type { NextApiResponse } from 'next';
import { connectDB }           from '@/lib/db';
import { withAdmin }           from '@/lib/auth';
import { cacheGet, cacheSet, TTL } from '@/lib/redis';
import { ResidentModel }       from '@/models/Resident';
import { ParkingSpotModel }    from '@/models/ParkingSpot';
import { RaffleRoundModel }    from '@/models/RaffleRound';
import type { ApiResponse }    from '@/types';

export default withAdmin(async (req, res: NextApiResponse<ApiResponse>) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const { building } = req.query as { building: string };
  if (!building) return res.status(400).json({ success: false, error: 'building is required' });

  try {
    const ck     = `admin:stats:${building}`;
    const cached = await cacheGet(ck);
    if (cached) return res.status(200).json({ success: true, data: cached });

    await connectDB();
    const [totalResidents, totalSpots, occupiedSpots, totalRounds, activeRaffle, topWinners] =
      await Promise.all([
        ResidentModel.countDocuments({ building, isActive: true }),
        ParkingSpotModel.countDocuments({ building, isActive: true }),
        ParkingSpotModel.countDocuments({ building, isActive: true, currentAssignment: { $ne: null } }),
        RaffleRoundModel.countDocuments({ building }),
        RaffleRoundModel.findOne({ building, status: { $in: ['pending','active'] } }).select('roundNumber status startDate endDate participants').lean(),
        ResidentModel.aggregate([
          { $match: { building, isActive: true, totalWins: { $gt: 0 } } },
          { $sort: { totalWins: -1 } }, { $limit: 5 },
          { $project: { name: 1, unit: 1, totalWins: 1 } },
        ]),
      ]);

    const stats = {
      residents: { total: totalResidents },
      spots    : { total: totalSpots, occupied: occupiedSpots, available: totalSpots - occupiedSpots },
      rounds   : { total: totalRounds },
      activeRaffle, topWinners,
    };

    await cacheSet(ck, stats, TTL.RAFFLE);
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error('[admin/stats]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch admin stats' });
  }
});
