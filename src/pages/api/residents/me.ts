import type { NextApiResponse } from 'next';
import { connectDB }           from '@/lib/db';
import { withAuth }            from '@/lib/auth';
import { ResidentModel }       from '@/models/Resident';
import { ParkingSpotModel }    from '@/models/ParkingSpot';
import { RaffleRoundModel }    from '@/models/RaffleRound';
import type { ApiResponse, IResident } from '@/types';

export default withAuth(async (req, res: NextApiResponse<ApiResponse>) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  await connectDB();
  const resident = await ResidentModel.findById(req.user.residentId).select('-__v').lean();
  if (!resident) return res.status(404).json({ success: false, error: 'Resident not found' });

  const spot   = await ParkingSpotModel.findOne({ 'currentAssignment.residentId': resident._id }).select('spotNumber floor type building currentAssignment').lean();
  const raffle = await RaffleRoundModel.findOne({ building: resident.building, status: { $in: ['pending','active'] } }).select('roundNumber startDate endDate status participants').lean();

  const res_         = resident as unknown as IResident;
  const isRegistered = raffle?.participants.some(p => String(p.residentId) === req.user.residentId!) ?? false;

  return res.status(200).json({
    success: true,
    data: {
      resident   : res_,
      currentSpot: spot ?? null,
      raffle     : raffle ?? null,
      eligibility: {
        isRegisteredInRaffle : isRegistered,
      },
    },
  });
});
