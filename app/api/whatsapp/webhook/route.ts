import { verifyWebhookSignature } from '@/lib/evolutionApi'
import { createHeadlessAdminClient } from '@/lib/supabase/server'
import { getRedisClient } from '@/lib/redis'
import { checkRateLimit } from '@/lib/rateLimit'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  // Rate limit: 100 req/min por IP (retorna 200 para não expor a scanners)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const allowed = await checkRateLimit(`rl:webhook:${ip}`, 100, 60)
  if (!allowed) return NextResponse.json({ ok: true })

  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true })
  }

  // Ignorar eventos que não sejam mensagens de texto recebidas
  if (payload.event !== 'messages.upsert') {
    return NextResponse.json({ ok: true })
  }

  const data = payload.data as Record<string, unknown>
  const key = data?.key as Record<string, unknown>
  const message = data?.message as Record<string, unknown>

  // Ignorar mensagens enviadas pelo próprio bot
  if (key?.fromMe) return NextResponse.json({ ok: true })

  const fromJid = key?.remoteJid as string
  if (!fromJid) return NextResponse.json({ ok: true })

  const fromNumber = fromJid.replace('@s.whatsapp.net', '').replace('@g.us', '')
  const messageId = key?.id as string
  const messageText = (message?.conversation as string) ||
    (message?.extendedTextMessage as Record<string, string>)?.text

  if (!messageText) return NextResponse.json({ ok: true })

  const instanceId = payload.instance as string

  const db = createHeadlessAdminClient()

  // Lookup multi-tenant: qual fisioterapeuta tem essa instância WhatsApp?
  const { data: settingsData } = await db
    .from('agent_settings')
    .select('user_id')
    .eq('whatsapp_instance_id', instanceId)
    .single()

  if (!settingsData?.user_id) return NextResponse.json({ ok: true })

  const userId = settingsData.user_id as string

  // Dedup: verificar se mensagem já foi processada
  const { data: existing } = await db
    .from('messages')
    .select('id')
    .eq('whatsapp_message_id', messageId)
    .single()

  if (existing) return NextResponse.json({ ok: true })

  // Buscar ou criar paciente pelo número de telefone
  let patientId: string
  const { data: patient } = await db
    .from('patients')
    .select('id')
    .eq('user_id', userId)
    .eq('phone', fromNumber)
    .single()

  if (patient) {
    patientId = patient.id as string
  } else {
    const { data: newPatient, error: insertError } = await db
      .from('patients')
      .insert({ user_id: userId, name: fromNumber, phone: fromNumber, recovery_progress: 0, is_patient: false })
      .select('id')
      .single()

    if (insertError || !newPatient) return NextResponse.json({ ok: true })
    patientId = newPatient.id as string
  }

  // Salvar mensagem no banco
  await db.from('messages').insert({
    user_id: userId,
    patient_id: patientId,
    content: messageText,
    direction: 'in',
    whatsapp_message_id: messageId,
    processed: false,
  })

  // Publicar na fila Redis para processamento assíncrono
  try {
    const redis = getRedisClient()
    await redis.rpush(
      'whatsapp:messages',
      JSON.stringify({ userId, patientId, messageId, content: messageText })
    )
  } catch (err) {
    console.error('[webhook] Redis publish error:', err)
  }

  return NextResponse.json({ ok: true })
}
