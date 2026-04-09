import { getOpenAIClient } from '@/lib/openai'
import type { AIResponse, AIIntent, AITone, Appointment, Message } from '@/types'

const VALID_INTENTS: AIIntent[] = ['schedule', 'reschedule', 'cancel', 'fallback']

function getTodayBR(): string {
  return new Date().toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function parseIntent(
  message: string,
  history: Pick<Message, 'content' | 'direction'>[]
): Promise<AIResponse> {
  const openai = getOpenAIClient()

  const systemPrompt = `Você é um assistente de agendamento de uma clínica de fisioterapia.
Sua função é interpretar mensagens de pacientes e extrair a intenção deles.

Responda APENAS com JSON válido no seguinte formato:
{
  "intent": "schedule" | "reschedule" | "cancel" | "fallback",
  "date": "YYYY-MM-DD" ou null,
  "time": "HH:MM" ou null,
  "patientName": string ou null,
  "confidence": número de 0.0 a 1.0
}

Regras:
- Datas relativas ("amanhã", "semana que vem", "segunda") devem ser convertidas para datas absolutas
- Horários devem ser no formato HH:MM (24h)
- Se a intenção não for clara, use "fallback" com confidence baixo
- Data atual: ${getTodayBR()}
- Fuso horário: America/Sao_Paulo`

  const messages: { role: 'user' | 'assistant'; content: string }[] = history.map((m) => ({
    role: m.direction === 'in' ? 'user' : 'assistant',
    content: m.content,
  }))

  messages.push({ role: 'user', content: message })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.1,
      max_tokens: 200,
    })

    const raw = response.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)

    if (!VALID_INTENTS.includes(parsed.intent)) {
      return { intent: 'fallback', date: null, time: null, patientName: null, confidence: 0 }
    }

    return {
      intent: parsed.intent as AIIntent,
      date: parsed.date ?? null,
      time: parsed.time ?? null,
      patientName: parsed.patientName ?? null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    }
  } catch {
    return { intent: 'fallback', date: null, time: null, patientName: null, confidence: 0 }
  }
}

export async function generateReply(
  intent: AIIntent,
  appointment: Appointment | null,
  patientName: string,
  tone: AITone
): Promise<string> {
  const openai = getOpenAIClient()

  const toneGuide = {
    empathetic: 'Use linguagem calorosa, empática e pessoal. Use o nome do paciente.',
    casual: 'Use linguagem informal e amigável, curta e direta.',
    formal: 'Use linguagem profissional e concisa.',
  }[tone]

  let context = ''
  if (intent === 'schedule' && appointment) {
    const dt = new Date(appointment.datetime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' })
    context = `Agendamento confirmado para ${dt}.`
  } else if (intent === 'reschedule' && appointment) {
    const dt = new Date(appointment.datetime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' })
    context = `Reagendamento confirmado para ${dt}.`
  } else if (intent === 'cancel') {
    context = 'Cancelamento confirmado.'
  } else {
    context = 'Não foi possível entender a solicitação. Encaminhar para o atendente humano.'
  }

  const prompt = `${toneGuide}
Paciente: ${patientName}
Situação: ${context}
Gere uma resposta curta (máximo 160 caracteres) para o paciente via WhatsApp.
Responda APENAS com o texto da mensagem, sem aspas.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    })
    return response.choices[0]?.message?.content?.trim() ?? context
  } catch {
    return context
  }
}
