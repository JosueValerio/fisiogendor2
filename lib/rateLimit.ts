import { getRedisClient } from '@/lib/redis'

/**
 * Fixed-window rate limiter usando Redis INCR + EXPIRE.
 * Retorna true se a requisição está dentro do limite, false se deve ser bloqueada.
 * Fail-open: em caso de erro do Redis, permite a requisição (retorna true).
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, windowSeconds)
    }
    return count <= limit
  } catch (err) {
    console.error('[rateLimit] Redis error, failing open:', err)
    return true
  }
}
