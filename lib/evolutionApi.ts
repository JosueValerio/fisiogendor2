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

/**
 * Retorna o status de conexão de uma instância WhatsApp.
 * Possíveis valores: 'open' (conectado), 'close' (desconectado), 'connecting' (aguardando scan)
 */
export async function getInstanceStatus(
  instanceName: string
): Promise<'open' | 'close' | 'connecting'> {
  const url = `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`
  try {
    const res = await fetch(url, {
      headers: { apikey: EVOLUTION_API_KEY },
    })
    if (!res.ok) return 'close'
    const data = await res.json()
    // Evolution API v2: { instance: { state: 'open' | 'close' | 'connecting' } }
    return (data?.instance?.state ?? data?.state ?? 'close') as 'open' | 'close' | 'connecting'
  } catch {
    return 'close'
  }
}

/**
 * Retorna o QR code para conectar uma instância WhatsApp.
 * Retorna { qrcode: string } com a string do QR code (base64 ou URI)
 * ou null se a instância não existir ou já estiver conectada.
 */
export async function getInstanceQRCode(
  instanceName: string
): Promise<{ qrcode: string } | null> {
  const url = `${EVOLUTION_API_URL}/instance/connect/${instanceName}`
  try {
    const res = await fetch(url, {
      headers: { apikey: EVOLUTION_API_KEY },
    })
    if (!res.ok) return null
    const data = await res.json()
    // Evolution API v2: { code: '...', base64: 'data:image/png;base64,...' }
    const qrcode = data?.base64 ?? data?.code ?? null
    if (!qrcode) return null
    return { qrcode }
  } catch {
    return null
  }
}

/**
 * Cria uma nova instância no Evolution API se ela ainda não existir.
 */
export async function createInstance(instanceName: string): Promise<void> {
  const url = `${EVOLUTION_API_URL}/instance/create`
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  })
  // Ignora erros (pode já existir)
}
