/**
 * Worker standalone para processamento assíncrono de mensagens WhatsApp.
 * Roda como processo separado dentro do container Docker.
 * Execução: npx ts-node worker/index.ts (ou compilado com tsc)
 */

import Redis from 'ioredis'
import { processMessage } from '../services/messageProcessor'

const QUEUE_KEY = 'whatsapp:messages'
const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 1000

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processWithRetry(payload: unknown, attempt = 1): Promise<void> {
  try {
    await processMessage(payload as Parameters<typeof processMessage>[0])
  } catch (err) {
    console.error(`[worker] Attempt ${attempt} failed:`, err)
    if (attempt < MAX_RETRIES) {
      await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt - 1))
      return processWithRetry(payload, attempt + 1)
    }
    console.error('[worker] Max retries reached, dropping message:', payload)
  }
}

async function main() {
  console.log('[worker] Starting WhatsApp message worker...')

  const redis = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
  })

  redis.on('error', (err) => console.error('[worker] Redis error:', err.message))

  while (true) {
    try {
      // BLPOP bloqueia até 5 segundos esperando por mensagens
      const result = await redis.blpop(QUEUE_KEY, 5)
      if (!result) continue

      const [, raw] = result
      const payload = JSON.parse(raw)
      console.log('[worker] Processing message:', payload.messageId)
      await processWithRetry(payload)
    } catch (err) {
      console.error('[worker] Loop error:', err)
      await sleep(2000)
    }
  }
}

main().catch((err) => {
  console.error('[worker] Fatal error:', err)
  process.exit(1)
})
