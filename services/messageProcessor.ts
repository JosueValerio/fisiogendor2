import { createHeadlessAdminClient } from '@/lib/supabase/server'
import { sendMessage } from '@/lib/evolutionApi'
import { parseIntent, generateReply } from '@/services/aiService'
import * as appointmentService from '@/services/appointmentService'
import type { Message, AgentSettings } from '@/types'

interface QueuePayload {
  userId: string
  patientId: string
  messageId: string
  content: string
}

function isWithinOperatingHours(
  operatingHours: AgentSettings['operating_hours']
): boolean {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayKey = dayNames[now.getDay()]
  const hours = operatingHours?.[dayKey]

  if (!hours?.enabled) return false

  const [startH, startM] = hours.start.split(':').map(Number)
  const [endH, endM] = hours.end.split(':').map(Number)

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

function containsTriggerKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw.toLowerCase()))
}

export async function processMessage(payload: QueuePayload): Promise<void> {
  const { userId, patientId, messageId, content } = payload
  const db = createHeadlessAdminClient()

  // Carregar configurações do agente
  const { data: settings } = await db
    .from('agent_settings')
    .select('ai_enabled, ai_tone, operating_hours, trigger_keywords, whatsapp_instance_id')
    .eq('user_id', userId)
    .single()

  if (!settings?.ai_enabled || !settings.whatsapp_instance_id) return

  // Carregar dados do paciente
  const { data: patient } = await db
    .from('patients')
    .select('name, phone')
    .eq('id', patientId)
    .eq('user_id', userId)
    .single()

  if (!patient) return

  // Verificar horário de funcionamento
  if (!isWithinOperatingHours(settings.operating_hours as AgentSettings['operating_hours'])) {
    await sendMessage(
      settings.whatsapp_instance_id,
      patient.phone,
      'Olá! No momento estamos fora do horário de atendimento. Em breve retornaremos. 🙏'
    )
    await db.from('messages').insert({
      user_id: userId,
      patient_id: patientId,
      content: 'Olá! No momento estamos fora do horário de atendimento. Em breve retornaremos. 🙏',
      direction: 'out',
    })
    await db.from('messages').update({ processed: true }).eq('whatsapp_message_id', messageId)
    return
  }

  // Verificar trigger keywords
  const keywords = (settings.trigger_keywords as string[]) ?? ['agendar', 'consulta', 'marcar', 'horário']
  const { data: pendingAppointment } = await db
    .from('appointments')
    .select('id')
    .eq('user_id', userId)
    .eq('patient_id', patientId)
    .eq('status', 'pending')
    .single()

  if (!containsTriggerKeyword(content, keywords) && !pendingAppointment) {
    await db.from('messages').update({ processed: true }).eq('whatsapp_message_id', messageId)
    return
  }

  // Buscar histórico de mensagens para contexto
  const { data: history } = await db
    .from('messages')
    .select('content, direction')
    .eq('user_id', userId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(10)

  const messageHistory = ((history ?? []) as Pick<Message, 'content' | 'direction'>[]).reverse()

  // Interpretar intenção com IA
  const aiResponse = await parseIntent(content, messageHistory)

  let appointment = null
  let replyText: string

  try {
    if (aiResponse.intent === 'schedule' && aiResponse.date && aiResponse.time) {
      const datetime = `${aiResponse.date}T${aiResponse.time}:00-03:00`
      appointment = await appointmentService.create(
        userId,
        patientId,
        datetime,
        'fisioterapia'
      )
    } else if (aiResponse.intent === 'reschedule' && aiResponse.date && aiResponse.time) {
      const { data: existing } = await db
        .from('appointments')
        .select('id')
        .eq('user_id', userId)
        .eq('patient_id', patientId)
        .in('status', ['scheduled', 'confirmed', 'pending'])
        .order('datetime', { ascending: true })
        .limit(1)
        .single()

      if (existing) {
        const datetime = `${aiResponse.date}T${aiResponse.time}:00-03:00`
        appointment = await appointmentService.reschedule(userId, existing.id as string, datetime)
      }
    } else if (aiResponse.intent === 'cancel') {
      const { data: existing } = await db
        .from('appointments')
        .select('id')
        .eq('user_id', userId)
        .eq('patient_id', patientId)
        .in('status', ['scheduled', 'confirmed', 'pending'])
        .order('datetime', { ascending: true })
        .limit(1)
        .single()

      if (existing) {
        await appointmentService.cancel(userId, existing.id as string)
      }
    }
  } catch (err) {
    console.error('[messageProcessor] appointment error:', err)
  }

  replyText = await generateReply(
    aiResponse.intent,
    appointment,
    patient.name,
    (settings.ai_tone as 'empathetic' | 'casual' | 'formal') ?? 'empathetic'
  )

  await sendMessage(settings.whatsapp_instance_id, patient.phone, replyText)

  await db.from('messages').insert({
    user_id: userId,
    patient_id: patientId,
    content: replyText,
    direction: 'out',
  })

  await db.from('messages').update({ processed: true }).eq('whatsapp_message_id', messageId)
}
