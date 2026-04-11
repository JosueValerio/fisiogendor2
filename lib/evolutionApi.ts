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
    if (!res.ok) {
      const body = await res.text()
      console.error(`[evolutionApi] getInstanceStatus error ${res.status} for "${instanceName}": ${body}`)
      return 'close'
    }
    const data = await res.json()
    // Evolution API v2: { instance: { state: 'open' | 'close' | 'connecting' } }
    return (data?.instance?.state ?? data?.state ?? 'close') as 'open' | 'close' | 'connecting'
  } catch (err) {
    console.error(`[evolutionApi] getInstanceStatus exception for "${instanceName}":`, err)
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
    if (!res.ok) {
      const body = await res.text()
      console.error(`[evolutionApi] getInstanceQRCode error ${res.status} for "${instanceName}": ${body}`)
      return null
    }
    const data = await res.json()
    // Evolution API v2: { code: '...', base64: 'data:image/png;base64,...' }
    const qrcode = data?.base64 ?? data?.code ?? null
    if (!qrcode) {
      console.error(`[evolutionApi] getInstanceQRCode: response OK but no qrcode field for "${instanceName}":`, JSON.stringify(data))
      return null
    }
    return { qrcode }
  } catch (err) {
    console.error(`[evolutionApi] getInstanceQRCode exception for "${instanceName}":`, err)
    return null
  }
}

/**
 * Cria uma nova instância no Evolution API se ela ainda não existir.
 * Retorna { ok: true } em caso de sucesso ou { ok: false, error: string } em caso de falha.
 */
export async function createInstance(instanceName: string): Promise<{ ok: boolean; error?: string }> {
  const url = `${EVOLUTION_API_URL}/instance/create`
  try {
    const res = await fetch(url, {
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
    if (!res.ok) {
      const body = await res.text()
      // 409 significa que a instância já existe — não é um erro real
      if (res.status === 409) {
        console.log(`[evolutionApi] createInstance: instance "${instanceName}" already exists (409), continuing`)
        return { ok: true }
      }
      console.error(`[evolutionApi] createInstance error ${res.status} for "${instanceName}": ${body}`)
      return { ok: false, error: `HTTP ${res.status}: ${body}` }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[evolutionApi] createInstance exception for "${instanceName}":`, err)
    return { ok: false, error: message }
  }
}

/**
 * Deleta uma instância do Evolution API.
 * Não afeta dados do Supabase (pacientes, agendamentos, histórico).
 */
export async function deleteInstance(instanceName: string): Promise<void> {
  const url = `${EVOLUTION_API_URL}/instance/delete/${instanceName}`
  await fetch(url, {
    method: 'DELETE',
    headers: { apikey: EVOLUTION_API_KEY },
  })
  // Ignora erros (pode não existir)
}

/**
 * Gera um nome de instância único e estável por usuário.
 */
export function generateInstanceName(userId: string): string {
  return `clinic-${userId.replace(/-/g, '').slice(0, 16)}`
}
