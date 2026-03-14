import type { NextApiResponse } from 'next';
import mongoose                from 'mongoose';
import { connectDB }           from '@/lib/db';
import { withAdmin }           from '@/lib/auth';
import { cacheDel, cacheInvalidatePattern, CacheKey } from '@/lib/redis';
import { sanitizeObject, isValidObjectId } from '@/lib/sanitize';
import { runRaffle }           from '@/lib/raffle';
import { ResidentModel }       from '@/models/Resident';
import { ParkingSpotModel }    from '@/models/ParkingSpot';
import { RaffleRoundModel }    from '@/models/RaffleRound';
import { ParkingHistoryModel } from '@/models/ParkingHistory';
import type { ApiResponse, IResident, IParkingSpot } from '@/types';

const SPOT_BLACKOUT_ROUNDS = 3;

export default withAdmin(async (req, res: NextApiResponse<ApiResponse>) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { raffleId } = sanitizeObject(req.body ?? {}) as { raffleId: string };
  if (!isValidObjectId(raffleId)) return res.status(400).json({ success: false, error: 'Invalid raffleId' });

  await connectDB();
  const raffle = await RaffleRoundModel.findById(raffleId);
  if (!raffle)                    return res.status(404).json({ success: false, error: 'Raffle not found' });
  if (raffle.status === 'completed') return res.status(409).json({ success: false, error: 'Raffle already executed' });

  const participantIds = raffle.participants.map(p => p.residentId);
  const [residents, spots, recentHistory] = await Promise.all([
    ResidentModel.find({ _id: { $in: participantIds }, isActive: true }).lean(),
    ParkingSpotModel.find({ building: raffle.building, isActive: true, currentAssignment: null }).lean(),
    ParkingHistoryModel.find({
      residentId  : { $in: participantIds },
      building    : raffle.building,
      roundNumber : { $gte: raffle.roundNumber - SPOT_BLACKOUT_ROUNDS },
    }).select('residentId spotId').lean(),
  ]);

  const blockedSpotsByResident: Record<string, string[]> = {};
  for (const h of recentHistory) {
    const rid = String(h.residentId);
    (blockedSpotsByResident[rid] ??= []).push(String(h.spotId));
  }

  const result = runRaffle({
    participants          : residents as unknown as IResident[],
    spots                 : spots as unknown as IParkingSpot[],
    blockedSpotsByResident,
  });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const now       = new Date();
      const expiresAt = new Date(raffle.endDate);
      const raffleResults: { residentId: mongoose.Types.ObjectId; spotId: mongoose.Types.ObjectId; assignedAt: Date }[] = [];

      for (const { resident, spot } of result.assignments) {
        const rId = new mongoose.Types.ObjectId(resident._id);
        const sId = new mongoose.Types.ObjectId(spot._id);

        await ParkingSpotModel.updateOne({ _id: sId }, { $set: { currentAssignment: { residentId: rId, assignedAt: now, expiresAt } } }, { session });
        await ParkingHistoryModel.updateMany({ residentId: rId, status: 'active' }, { $set: { status: 'expired' } }, { session });
        await ParkingHistoryModel.create([{ residentId: rId, spotId: sId, roundNumber: raffle.roundNumber, building: raffle.building, assignedAt: now, expiresAt, status: 'active' }], { session });
        await ResidentModel.updateOne({ _id: rId }, { $inc: { totalWins: 1 } }, { session });
        raffleResults.push({ residentId: rId, spotId: sId, assignedAt: now });
      }

      await RaffleRoundModel.updateOne({ _id: raffle._id }, { $set: { status: 'completed', results: raffleResults, executedAt: now, executedBy: new mongoose.Types.ObjectId(req.user.residentId) } }, { session });
    });
  } finally { await session.endSession(); }

  await Promise.all([
    cacheDel(CacheKey.currentRaffle(raffle.building)),
    cacheDel(CacheKey.spots(raffle.building)),
    cacheDel(CacheKey.residents(raffle.building)),
    cacheInvalidatePattern('history:*'),
    cacheInvalidatePattern('resident:*'),
  ]);

  return res.status(200).json({
    success: true,
    message: `Raffle executed. ${result.assignments.length} spots assigned, ${result.unassigned.length} unassigned.`,
    data: { assigned: result.assignments.length, unassigned: result.unassigned.length },
  });
});
