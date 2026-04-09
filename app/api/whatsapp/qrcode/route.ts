import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInstanceQRCode, createInstance } from '@/lib/evolutionApi'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: settings } = await supabase
    .from('agent_settings')
    .select('whatsapp_instance_id')
    .eq('user_id', user.id)
    .single()

  const instanceId = settings?.whatsapp_instance_id as string | null
  if (!instanceId) return NextResponse.json({ error: 'instance_not_configured' }, { status: 400 })

  // Tentar criar instância caso não exista (idempotente)
  await createInstance(instanceId)

  const result = await getInstanceQRCode(instanceId)
  if (!result) return NextResponse.json({ error: 'qrcode_unavailable' }, { status: 404 })

  return NextResponse.json(result)
}
