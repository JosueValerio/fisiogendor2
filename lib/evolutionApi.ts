import { createHmac, timingSafeEqual } from 'crypto'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!

export async function sendMessage(instanceId: string, to: string, text: string): Promise<void> {
  const url = `${EVOLUTION_API_URL}/message/sendText/${instanceId}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: EVOLUTION_API_KEY,
    },
    body: JSON.stringify({ number: to, text }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Evolution API error ${res.status}: ${body}`)
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  try {
    const expected = createHmac('sha256', EVOLUTION_API_KEY)
      .update(rawBody)
      .digest('hex')
    const expectedBuf = Buffer.from(`sha256=${expected}`)
    const actualBuf = Buffer.from(signature)
    if (expectedBuf.length !== actualBuf.length) return false
    return timingSafeEqual(expectedBuf, actualBuf)
  } catch {
    return false
  }
}
