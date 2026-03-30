/**
 * Strip HTML/script tags from a string.
 * Replaces isomorphic-dompurify (which depends on jsdom and breaks in
 * Vercel serverless due to ESM-only transitive deps).
 */
function stripHtml(input: string): string {
  return input
    .replace(/<\/?\s*script[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/<[^>]*>/g, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript\s*:/gi, '');
}

export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return stripHtml(value.trim());
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string')
      result[k] = sanitizeString(v);
    else if (v && typeof v === 'object' && !Array.isArray(v))
      result[k] = sanitizeObject(v as Record<string, unknown>);
    else
      result[k] = v;
  }
  return result as T;
}

export function isValidPlate(plate: string): boolean {
  return /^[A-Z0-9-]{4,10}$/i.test(plate.trim());
}

export function isValidObjectId(id: unknown): boolean {
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
}
