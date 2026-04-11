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

  // Cria instância no Evolution Go (idempotente — 409 = já existe, ok)
  const createResult = await createInstance(instanceId)
  if (!createResult.ok) {
    console.error(`[qrcode/route] createInstance failed for "${instanceId}":`, createResult.error)
    return NextResponse.json(
      { error: 'create_failed', detail: createResult.error },
      { status: 500 }
    )
  }

  const result = await getInstanceQRCode(instanceId)
  if (!result) {
    return NextResponse.json(
      { error: 'qrcode_unavailable', detail: 'A instância foi criada mas o QR code não está disponível. Tente novamente.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ qrcode: result.qrcode, instanceId })
}
