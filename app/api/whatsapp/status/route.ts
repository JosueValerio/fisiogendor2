import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInstanceStatus } from '@/lib/evolutionApi'

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
  if (!instanceId) return NextResponse.json({ status: 'close' })

  const status = await getInstanceStatus(instanceId)
  return NextResponse.json({ status })
}
