import type { NextApiResponse } from 'next';
import { connectDB }           from '@/lib/db';
import { withAuth }            from '@/lib/auth';
import { cacheGet, cacheSet, cacheDel, CacheKey, TTL } from '@/lib/redis';
import { sanitizeObject, isValidObjectId, isValidPlate } from '@/lib/sanitize';
import { ResidentModel }       from '@/models/Resident';
import type { ApiResponse, IResident } from '@/types';

export default withAuth(async (req, res: NextApiResponse<ApiResponse>) => {
  const { id } = req.query as { id: string };
  if (!isValidObjectId(id))
    return res.status(400).json({ success: false, error: 'Invalid resident ID' });

  const isSelf  = req.user.residentId === id;
  const isAdmin = req.user.role === 'admin';
  if (!isSelf && !isAdmin)
    return res.status(403).json({ success: false, error: 'Forbidden' });

  try {
    await connectDB();

    if (req.method === 'GET') {
      const cached = await cacheGet<IResident>(CacheKey.resident(id));
      if (cached) return res.status(200).json({ success: true, data: cached });
      const doc = await ResidentModel.findById(id).select('-__v').lean();
      if (!doc) return res.status(404).json({ success: false, error: 'Resident not found' });
      await cacheSet(CacheKey.resident(id), doc, TTL.RESIDENT);
      return res.status(200).json({ success: true, data: doc as unknown as IResident });
    }

    if (req.method === 'PATCH') {
      const body = sanitizeObject(req.body ?? {});
      const { vehicle } = body as { vehicle?: { plate: string; model: string; color: string } };
      if (vehicle?.plate && !isValidPlate(vehicle.plate))
        return res.status(400).json({ success: false, error: 'Invalid license plate format' });

      const update: Record<string, unknown> = {};
      if (vehicle?.plate) update['vehicle.plate'] = vehicle.plate.toUpperCase();
      if (vehicle?.model) update['vehicle.model'] = vehicle.model;
      if (vehicle?.color) update['vehicle.color'] = vehicle.color;

      const updated = await ResidentModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).select('-__v').lean();
      if (!updated) return res.status(404).json({ success: false, error: 'Resident not found' });
      await cacheDel(CacheKey.resident(id));
      return res.status(200).json({ success: true, data: updated, message: 'Profile updated' });
    }

    if (req.method === 'DELETE') {
      if (!isAdmin) return res.status(403).json({ success: false, error: 'Admin access required' });
      const doc = await ResidentModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
      if (!doc) return res.status(404).json({ success: false, error: 'Resident not found' });
      await cacheDel(CacheKey.resident(id), CacheKey.residents(doc.building as string));
      return res.status(200).json({ success: true, message: 'Resident deactivated' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[residents/id]', err);
    return res.status(500).json({ success: false, error: 'Failed to process resident request' });
  }
});
