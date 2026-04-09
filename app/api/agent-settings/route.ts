import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_FIELDS = [
  'ai_enabled',
  'ai_tone',
  'operating_hours',
  'trigger_keywords',
  'specific_instructions',
  'whatsapp_instance_id',
  'google_calendar_id',
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('agent_settings')
    .select('id, user_id, ai_enabled, ai_tone, operating_hours, specific_instructions, trigger_keywords, whatsapp_instance_id, google_calendar_id, created_at, updated_at')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ settings: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED_FIELDS.includes(k)))

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('agent_settings')
    .update(updates)
    .eq('user_id', user.id)
    .select('id, user_id, ai_enabled, ai_tone, operating_hours, specific_instructions, trigger_keywords, whatsapp_instance_id, google_calendar_id')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ settings: data })
}
