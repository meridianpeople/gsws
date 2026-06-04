/**
 * Simple in-memory rate limiter
 * For production with multiple instances, use Redis
 */
const attempts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs }
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxAttempts - entry.count, resetAt: entry.resetAt }
}

export function getRateLimitKey(req: Request, suffix: string): string {
  const ip = (req as any).headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  return `${suffix}:${ip}`
}
