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
 * Suporta múltiplos formatos de resposta da Evolution API e Evolution Go.
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
      console.error(`[evolutionApi] getInstanceStatus ${res.status} "${instanceName}": ${body}`)
      return 'close'
    }
    const data = await res.json()
    // Suporta: { instance: { state } } | { state } | { status } | { connectionStatus }
    const state =
      data?.instance?.state ??
      data?.instance?.connectionStatus ??
      data?.state ??
      data?.status ??
      data?.connectionStatus ??
      'close'
    return state as 'open' | 'close' | 'connecting'
  } catch (err) {
    console.error(`[evolutionApi] getInstanceStatus exception "${instanceName}":`, err)
    return 'close'
  }
}

/**
 * Retorna o QR code para conectar uma instância WhatsApp.
 * Suporta múltiplos formatos de resposta (Evolution API v1/v2 e Evolution Go).
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
      console.error(`[evolutionApi] getInstanceQRCode ${res.status} "${instanceName}": ${body}`)
      return null
    }
    const data = await res.json()
    console.log(`[evolutionApi] getInstanceQRCode response keys for "${instanceName}":`, Object.keys(data ?? {}))

    // Suporta múltiplos formatos:
    // Evolution API v2: { code, base64 }
    // Evolution Go:     { qrcode: { code, base64 } } ou { qrcode: "data:..." }
    // Outros:           { image, pairingCode }
    const qrcode =
      data?.base64 ??
      data?.code ??
      data?.qrcode?.base64 ??
      data?.qrcode?.code ??
      (typeof data?.qrcode === 'string' ? data.qrcode : null) ??
      data?.image ??
      null

    if (!qrcode) {
      console.error(`[evolutionApi] getInstanceQRCode: no qrcode in response for "${instanceName}":`, JSON.stringify(data))
      return null
    }
    return { qrcode }
  } catch (err) {
    console.error(`[evolutionApi] getInstanceQRCode exception "${instanceName}":`, err)
    return null
  }
}

/**
 * Cria uma nova instância no Evolution Go.
 * Evolution Go usa "name" (não "instanceName") no body.
 * Retorna { ok: true } em sucesso, { ok: false, error } em falha.
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
      // Evolution Go usa "name" + "token" (não "instanceName")
      body: JSON.stringify({ name: instanceName, token: EVOLUTION_API_KEY, qrcode: true }),
    })
    if (!res.ok) {
      const body = await res.text()
      // 409 = instância já existe — não é erro
      if (res.status === 409) {
        console.log(`[evolutionApi] createInstance: "${instanceName}" already exists (409)`)
        return { ok: true }
      }
      console.error(`[evolutionApi] createInstance ${res.status} "${instanceName}": ${body}`)
      return { ok: false, error: `HTTP ${res.status}: ${body}` }
    }
    const data = await res.json().catch(() => ({}))
    console.log(`[evolutionApi] createInstance success "${instanceName}":`, JSON.stringify(data))
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[evolutionApi] createInstance exception "${instanceName}":`, err)
    return { ok: false, error: message }
  }
}

/**
 * Deleta uma instância do Evolution Go.
 * Não afeta dados do Supabase (pacientes, agendamentos, histórico).
 */
export async function deleteInstance(instanceName: string): Promise<void> {
  const url = `${EVOLUTION_API_URL}/instance/delete/${instanceName}`
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { apikey: EVOLUTION_API_KEY },
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[evolutionApi] deleteInstance ${res.status} "${instanceName}": ${body}`)
    }
  } catch (err) {
    console.error(`[evolutionApi] deleteInstance exception "${instanceName}":`, err)
  }
}

/**
 * Gera um nome de instância único e estável por usuário.
 * Usa apenas letras minúsculas e hífens — compatível com a maioria das APIs.
 */
export function generateInstanceName(userId: string): string {
  return `clinic-${userId.replace(/-/g, '').slice(0, 16)}`
}
