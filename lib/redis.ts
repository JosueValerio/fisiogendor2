import Redis from 'ioredis'

let client: Redis | null = null

export function getRedisClient(): Redis {
  if (!client) {
    client = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    })
    client.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
    })
  }
  return client
}
