import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInstanceQRCode, createInstance, generateInstanceName } from '@/lib/evolutionApi'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: settings } = await supabase
    .from('agent_settings')
    .select('whatsapp_instance_id')
    .eq('user_id', user.id)
    .single()

  // Auto-gera nome da instância se ainda não configurado
  let instanceId = settings?.whatsapp_instance_id as string | null
  if (!instanceId) {
    instanceId = generateInstanceName(user.id)
    await supabase
      .from('agent_settings')
      .update({ whatsapp_instance_id: instanceId })
      .eq('user_id', user.id)
  }

  // Cria instância no Evolution Go (idempotente)
  await createInstance(instanceId)

  const result = await getInstanceQRCode(instanceId)
  if (!result) return NextResponse.json({ error: 'qrcode_unavailable' }, { status: 404 })

  return NextResponse.json(result)
}
