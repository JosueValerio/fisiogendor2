import { describe, it, expect, vi } from 'vitest'
import { createHmac } from 'crypto'

// vi.hoisted executa ANTES dos imports — necessário porque o módulo captura
// process.env.EVOLUTION_API_KEY no momento do load (const no topo do arquivo)
const API_KEY = vi.hoisted(() => {
  const key = 'test-evolution-api-key'
  process.env.EVOLUTION_API_KEY = key
  process.env.EVOLUTION_API_URL = 'http://localhost:9999'
  return key
})

import { verifyWebhookSignature } from '@/lib/evolutionApi'

function sign(body: string): string {
  const hash = createHmac('sha256', API_KEY).update(body).digest('hex')
  return `sha256=${hash}`
}

describe('verifyWebhookSignature', () => {
  it('aceita assinatura válida', () => {
    const body = JSON.stringify({ event: 'messages.upsert' })
    expect(verifyWebhookSignature(body, sign(body))).toBe(true)
  })

  it('rejeita signature null', () => {
    expect(verifyWebhookSignature('body', null)).toBe(false)
  })

  it('rejeita body modificado', () => {
    const body = 'original body'
    const sig = sign(body)
    expect(verifyWebhookSignature('modified body', sig)).toBe(false)
  })

  it('rejeita assinatura com chave errada', () => {
    const body = 'test'
    const wrongSig = createHmac('sha256', 'wrong-key').update(body).digest('hex')
    expect(verifyWebhookSignature(body, `sha256=${wrongSig}`)).toBe(false)
  })

  it('rejeita string vazia', () => {
    expect(verifyWebhookSignature('body', '')).toBe(false)
  })
})
