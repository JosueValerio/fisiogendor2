import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock singleton — mesma instância usada pelo service
const mockCreate = vi.fn()

vi.mock('@/lib/openai', () => ({
  getOpenAIClient: () => ({
    chat: { completions: { create: mockCreate } },
  }),
}))

import { parseIntent, generateReply } from '@/services/aiService'

function mockResponse(content: string) {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content } }],
  })
}

function mockThrow() {
  mockCreate.mockRejectedValueOnce(new Error('API down'))
}

describe('parseIntent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna schedule com data e hora', async () => {
    mockResponse(JSON.stringify({
      intent: 'schedule',
      date: '2026-04-15',
      time: '14:00',
      patientName: 'João',
      confidence: 0.95,
    }))

    const result = await parseIntent('Quero agendar para terça às 14h', [])
    expect(result.intent).toBe('schedule')
    expect(result.date).toBe('2026-04-15')
    expect(result.time).toBe('14:00')
    expect(result.confidence).toBe(0.95)
  })

  it('retorna fallback se intent inválido', async () => {
    mockResponse(JSON.stringify({ intent: 'unknown', confidence: 0.1 }))

    const result = await parseIntent('oi tudo bem', [])
    expect(result.intent).toBe('fallback')
    expect(result.confidence).toBe(0)
  })

  it('retorna fallback se JSON malformado', async () => {
    mockResponse('não é json válido {{{{')

    const result = await parseIntent('mensagem qualquer', [])
    expect(result.intent).toBe('fallback')
    expect(result.confidence).toBe(0)
  })

  it('retorna fallback se OpenAI lança erro', async () => {
    mockThrow()

    const result = await parseIntent('mensagem', [])
    expect(result.intent).toBe('fallback')
    expect(result.confidence).toBe(0)
  })

  it('nunca lança exceção', async () => {
    mockThrow()
    await expect(parseIntent('', [])).resolves.toBeDefined()
  })

  it('passa histórico como contexto', async () => {
    mockResponse(JSON.stringify({ intent: 'cancel', confidence: 0.9 }))

    const history = [
      { content: 'Quero cancelar minha consulta', direction: 'in' as const },
      { content: 'Pode confirmar o cancelamento?', direction: 'out' as const },
    ]

    const result = await parseIntent('sim, cancele', history)
    expect(result.intent).toBe('cancel')
  })
})

describe('generateReply', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna texto da API', async () => {
    mockResponse('Olá João! Consulta confirmada para amanhã às 14h.')

    const result = await generateReply('schedule', null, 'João', 'empathetic')
    expect(result).toContain('João')
  })

  it('fallback para contexto se API lança erro', async () => {
    mockThrow()

    const result = await generateReply('cancel', null, 'Maria', 'formal')
    expect(result).toBe('Cancelamento confirmado.')
  })

  it('nunca lança exceção', async () => {
    mockThrow()
    await expect(generateReply('fallback', null, 'João', 'casual')).resolves.toBeDefined()
  })
})
