import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteInstance } from '@/lib/evolutionApi'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: settings } = await supabase
    .from('agent_settings')
    .select('whatsapp_instance_id')
    .eq('user_id', user.id)
    .single()

  const instanceId = settings?.whatsapp_instance_id as string | null
  if (!instanceId) return NextResponse.json({ ok: true })

  // Deleta instância no Evolution Go
  // Dados do Supabase (pacientes, agendamentos, histórico) NÃO são afetados
  await deleteInstance(instanceId)

  // Mantém o instanceId no DB para reconexão futura com mesmo nome
  return NextResponse.json({ ok: true })
}
