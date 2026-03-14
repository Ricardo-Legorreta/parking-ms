import { NextApiRequest, NextApiResponse } from 'next';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ResidentModel } from '@/models/Resident';
import { connectDB } from './db';
import type { Auth0JwtPayload, RequestUser, ApiResponse, UserRole } from '@/types';

const jwks = createRemoteJWKSet(
  new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`)
);

const CLAIM_NS = 'https://parking-ms/';

export async function verifyToken(token: string): Promise<Auth0JwtPayload> {
  const { payload } = await jwtVerify(token, jwks, {
    audience : process.env.AUTH0_AUDIENCE,
    issuer   : `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
  });
  return {
    ...payload,
    sub  : payload.sub as string,
    email: (payload[CLAIM_NS + 'email'] ?? payload.email ?? '') as string,
    name : (payload[CLAIM_NS + 'name']  ?? payload.name  ?? '') as string,
  };
}

export type AuthenticatedRequest = NextApiRequest & { user: RequestUser };
type Handler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;

export function withToken(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
    const header = req.headers.authorization ?? '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: 'Missing authorization token' });

    let payload: Auth0JwtPayload;
    try { payload = await verifyToken(token); }
    catch { return res.status(401).json({ success: false, error: 'Invalid or expired token' }); }

    (req as AuthenticatedRequest).user = {
      auth0Id: payload.sub,
      email  : payload.email,
      name   : payload.name,
      role   : 'resident',
    };
    return handler(req as AuthenticatedRequest, res);
  };
}

export function withAuth(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
    const header = req.headers.authorization ?? '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: 'Missing authorization token' });

    let payload: Auth0JwtPayload;
    try { payload = await verifyToken(token); }
    catch { return res.status(401).json({ success: false, error: 'Invalid or expired token' }); }

    await connectDB();
    const resident = await ResidentModel
      .findOne({ auth0Id: payload.sub })
      .select('_id role building isActive')
      .lean();

    if (!resident?.isActive)
      return res.status(403).json({ success: false, error: 'Account not found or inactive' });

    (req as AuthenticatedRequest).user = {
      auth0Id   : payload.sub,
      email     : payload.email,
      name      : payload.name,
      role      : resident.role as UserRole,
      residentId: String(resident._id),
    };
    return handler(req as AuthenticatedRequest, res);
  };
}

export function withAdmin(handler: Handler) {
  return withAuth(async (req, res) => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, error: 'Admin access required' });
    return handler(req, res);
  });
}
