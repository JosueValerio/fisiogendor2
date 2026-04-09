import { createClient } from '@/lib/supabase/server'
import { sendMessage } from '@/lib/evolutionApi'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { patientId, content } = body

  if (!patientId || !content) {
    return NextResponse.json({ error: 'patientId e content são obrigatórios' }, { status: 422 })
  }
  if (typeof content === 'string' && content.length > 4000) {
    return NextResponse.json({ error: 'content máximo 4000 caracteres' }, { status: 422 })
  }

  // Garante que o paciente pertence ao usuário autenticado
  const { data: patient } = await supabase
    .from('patients')
    .select('id, phone')
    .eq('id', patientId)
    .eq('user_id', user.id)
    .single()

  if (!patient) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: settings } = await supabase
    .from('agent_settings')
    .select('whatsapp_instance_id')
    .eq('user_id', user.id)
    .single()

  if (!settings?.whatsapp_instance_id) {
    return NextResponse.json({ error: 'WhatsApp não configurado' }, { status: 422 })
  }

  try {
    await sendMessage(settings.whatsapp_instance_id, patient.phone, content)

    await supabase.from('messages').insert({
      user_id: user.id,
      patient_id: patientId,
      content,
      direction: 'out',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
