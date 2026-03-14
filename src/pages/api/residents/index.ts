import type { NextApiResponse } from 'next';
import { connectDB }            from '@/lib/db';
import { withToken, withAdmin, AuthenticatedRequest } from '@/lib/auth';
import { cacheGet, cacheSet, cacheDel, CacheKey, TTL } from '@/lib/redis';
import { rateLimit }            from '@/lib/rateLimit';
import { sanitizeObject, isValidPlate } from '@/lib/sanitize';
import { ResidentModel }        from '@/models/Resident';
import type { ApiResponse, PaginatedResponse, IResident } from '@/types';

const limiter = rateLimit({ windowSeconds: 60, maxRequests: 30 });

const getResidents = withAdmin(async (req, res: NextApiResponse<ApiResponse>) => {
  await limiter(req, res, async () => {
    const { building = '', page = '1', limit = '20', search = '' } = req.query as Record<string, string>;
    const pg = Math.max(1, parseInt(page));
    const lm = Math.min(100, Math.max(1, parseInt(limit)));

    if (!search) {
      const cached = await cacheGet<PaginatedResponse<IResident>>(CacheKey.residents(building));
      if (cached) return res.status(200).json({ success: true, data: cached });
    }

    await connectDB();
    const filter: Record<string, unknown> = { isActive: true };
    if (building) filter.building = building;
    if (search)   filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { unit: { $regex: search, $options: 'i' } },
    ];

    const [docs, total] = await Promise.all([
      ResidentModel.find(filter).select('-__v').sort({ name: 1 }).skip((pg - 1) * lm).limit(lm).lean(),
      ResidentModel.countDocuments(filter),
    ]);

    const result: PaginatedResponse<IResident> = {
      data: docs as unknown as IResident[], total, page: pg, limit: lm,
      totalPages: Math.ceil(total / lm),
    };
    if (!search) await cacheSet(CacheKey.residents(building), result, TTL.RESIDENT);
    return res.status(200).json({ success: true, data: result });
  });
});

const registerResident = withToken(async (req, res: NextApiResponse<ApiResponse>) => {
  await limiter(req, res, async () => {
    const body = sanitizeObject(req.body ?? {});
    const { name, unit, building, vehicle } = body as {
      name: string; unit: string; building: string;
      vehicle: { plate: string; model: string; color: string };
    };

    if (!name || !unit || !building || !vehicle?.plate)
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    if (!isValidPlate(vehicle.plate))
      return res.status(400).json({ success: false, error: 'Invalid license plate format' });

    await connectDB();
    const existing = await ResidentModel.findOne({
      $or: [{ auth0Id: req.user.auth0Id }, { building, unit }],
    }).lean();

    if (existing) {
      const reason = existing.auth0Id === req.user.auth0Id
        ? 'You are already registered' : 'That unit is already registered';
      return res.status(409).json({ success: false, error: reason });
    }

    const resident = await ResidentModel.create({
      auth0Id: req.user.auth0Id, name, email: req.user.email, unit, building,
      vehicle: { plate: vehicle.plate.toUpperCase(), model: vehicle.model, color: vehicle.color },
    });

    await cacheDel(CacheKey.residents(building));
    return res.status(201).json({ success: true, message: 'Registration successful', data: resident.toObject() });
  });
});

export default async function residentsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET')  return getResidents(req, res);
  if (req.method === 'POST') return registerResident(req, res);
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
