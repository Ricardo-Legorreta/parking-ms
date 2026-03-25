import type { NextApiResponse } from 'next';
import { connectDB }           from '@/lib/db';
import { withAuth }            from '@/lib/auth';
import { cacheDel, CacheKey }  from '@/lib/redis';
import { rateLimit }           from '@/lib/rateLimit';
import { ResidentModel }       from '@/models/Resident';
import { RaffleRoundModel }    from '@/models/RaffleRound';
import type { ApiResponse } from '@/types';

const regLimiter = rateLimit({ windowSeconds: 60, maxRequests: 5 });

export default withAuth(async (req, res: NextApiResponse<ApiResponse>) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  await regLimiter(req, res, async () => {
    try {
      await connectDB();
      const resident = await ResidentModel.findById(req.user.residentId).lean();
      if (!resident) return res.status(404).json({ success: false, error: 'Resident not found' });

      const raffle = await RaffleRoundModel.findOne({ building: resident.building, status: { $in: ['pending','active'] } });
      if (!raffle) return res.status(404).json({ success: false, error: 'No open raffle for your building' });

      const alreadyIn = raffle.participants.some(p => String(p.residentId) === String(resident._id));
      if (alreadyIn) return res.status(409).json({ success: false, error: 'Already registered for this raffle' });

      await RaffleRoundModel.updateOne({ _id: raffle._id }, { $push: { participants: { residentId: resident._id, registeredAt: new Date() } } });
      await cacheDel(CacheKey.currentRaffle(resident.building));
      return res.status(200).json({ success: true, message: 'Successfully registered for the raffle' });
    } catch (err) {
      console.error('[raffle/register]', err);
      return res.status(500).json({ success: false, error: 'Failed to register for raffle' });
    }
  });
});
