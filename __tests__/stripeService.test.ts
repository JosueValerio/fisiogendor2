import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockConstructEvent = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockMaybeSingle = vi.fn()

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    customers: { create: vi.fn().mockResolvedValue({ id: 'cus_test' }) },
    checkout: { sessions: { create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }) } },
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createHeadlessAdminClient: () => ({ from: mockFrom }),
}))

import { handleWebhookEvent } from '@/services/stripeService'

function setupDb(existingEvent: boolean) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'stripe_events') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: existingEvent ? { id: 'evt_test' } : null,
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    // profiles
    return {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────

describe('handleWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  })

  it('lança se assinatura inválida', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload')
    })

    await expect(handleWebhookEvent(Buffer.from('{}'), 'bad-sig')).rejects.toThrow()
  })

  it('ignora evento já processado (idempotência)', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_test',
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'user-1' } },
    })

    setupDb(true) // evento já existe

    // Não deve lançar, e não deve chamar update em profiles
    await expect(handleWebhookEvent(Buffer.from('{}'), 'sig')).resolves.toBeUndefined()

    // Verificar que nenhum update foi chamado
    const profileCalls = mockFrom.mock.calls.filter(([t]: [string]) => t === 'profiles')
    expect(profileCalls).toHaveLength(0)
  })

  it('processa checkout.session.completed → active', async () => {
    const profileUpdate = vi.fn().mockReturnThis()
    const profileEq = vi.fn().mockResolvedValue({ error: null })

    mockConstructEvent.mockReturnValue({
      id: 'evt_new',
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'user-1' } },
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'stripe_events') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return { update: profileUpdate, eq: profileEq }
    })

    await handleWebhookEvent(Buffer.from('{}'), 'sig')

    expect(profileUpdate).toHaveBeenCalledWith({ subscription_status: 'active' })
  })

  it('processa invoice.payment_failed → inactive', async () => {
    const profileUpdate = vi.fn().mockReturnThis()
    const profileEq = vi.fn().mockResolvedValue({ error: null })

    mockConstructEvent.mockReturnValue({
      id: 'evt_fail',
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_123' } },
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'stripe_events') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return { update: profileUpdate, eq: profileEq }
    })

    await handleWebhookEvent(Buffer.from('{}'), 'sig')

    expect(profileUpdate).toHaveBeenCalledWith({ subscription_status: 'inactive' })
  })
})
