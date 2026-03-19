import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error('Missing MONGODB_URI');

const globalWithCache = global as typeof globalThis & {
  __mongooseCache?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};
const cached = globalWithCache.__mongooseCache ?? (globalWithCache.__mongooseCache = { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize             : 10,
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS         : 45_000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
