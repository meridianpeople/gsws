/**
 * Redis-backed rate limiter (shared across PM2 cluster instances)
 */
import Redis from 'ioredis'

let redis: Redis | null = null
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: '127.0.0.1',
      port: 6379,
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => 200,
    })
    redis.on('error', (err) => {
      console.error('[rate-limit] Redis error:', err.message)
    })
  }
  return redis
}

export async function rateLimit(key: string, maxAttempts: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const windowSec = Math.ceil(windowMs / 1000)
  const redisKey = `ratelimit:${key}`

  try {
    const client = getRedis()
    const count = await client.incr(redisKey)
    if (count === 1) {
      await client.expire(redisKey, windowSec)
    }
    const ttl = await client.ttl(redisKey)
    const resetAt = now + (ttl > 0 ? ttl * 1000 : windowMs)

    if (count > maxAttempts) {
      return { allowed: false, remaining: 0, resetAt }
    }
    return { allowed: true, remaining: maxAttempts - count, resetAt }
  } catch (err) {
    // Fail open if Redis is unavailable — don't block logins due to infra issue
    console.error('[rate-limit] Redis unavailable, failing open:', (err as Error).message)
    return { allowed: true, remaining: maxAttempts, resetAt: now + windowMs }
  }
}

export function getRateLimitKey(req: Request, suffix: string): string {
  const ip = (req as any).headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  return `${suffix}:${ip}`
}
