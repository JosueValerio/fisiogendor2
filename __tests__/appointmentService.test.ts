import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppointmentConflictError } from '@/services/appointmentService'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockNot = vi.fn()
const mockLimit = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockSingle = vi.fn()

function buildChain(finalData: unknown, finalError: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
    single: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  }
  return chain
}

const mockFrom = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createHeadlessAdminClient: () => ({ from: mockFrom }),
}))

vi.mock('@/services/calendarService', () => ({
  createEvent: vi.fn().mockResolvedValue('gcal-event-id'),
  updateEvent: vi.fn().mockResolvedValue(undefined),
  deleteEvent: vi.fn().mockResolvedValue(undefined),
}))

import { checkConflict, create, cancel } from '@/services/appointmentService'

// ─────────────────────────────────────────────────────────────────────────────

describe('AppointmentConflictError', () => {
  it('é instância de Error', () => {
    const err = new AppointmentConflictError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Horário já ocupado')
    expect(err.name).toBe('AppointmentConflictError')
  })
})

describe('checkConflict', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna true se existe agendamento', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: 'appt-1' }] }),
    })

    const result = await checkConflict('user-1', '2026-04-15T14:00:00Z')
    expect(result).toBe(true)
  })

  it('retorna false se não existe agendamento', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    })

    const result = await checkConflict('user-1', '2026-04-15T14:00:00Z')
    expect(result).toBe(false)
  })

  it('retorna false se data é null', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null }),
    })

    const result = await checkConflict('user-1', '2026-04-15T14:00:00Z')
    expect(result).toBe(false)
  })
})

describe('create', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lança AppointmentConflictError se horário ocupado', async () => {
    // Primeira chamada: checkConflict → ocupado
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: 'existing' }] }),
    })

    await expect(create('user-1', 'patient-1', '2026-04-15T14:00:00Z', 'consulta'))
      .rejects.toBeInstanceOf(AppointmentConflictError)
  })

  it('cria agendamento sem conflito', async () => {
    const appointment = {
      id: 'new-appt',
      user_id: 'user-1',
      patient_id: 'patient-1',
      datetime: '2026-04-15T14:00:00Z',
      type: 'consulta',
      status: 'confirmed',
      google_event_id: 'gcal-event-id',
    }

    // checkConflict → livre
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    })
    // busca paciente
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { name: 'João' } }),
    })
    // insert appointment
    mockFrom.mockReturnValueOnce({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: appointment, error: null }),
    })

    const result = await create('user-1', 'patient-1', '2026-04-15T14:00:00Z', 'consulta')
    expect(result.id).toBe('new-appt')
    expect(result.status).toBe('confirmed')
  })
})

describe('cancel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lança erro 404 se agendamento não encontrado', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    await expect(cancel('user-1', 'nonexistent-id')).rejects.toMatchObject({ status: 404 })
  })
})
