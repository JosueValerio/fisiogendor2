import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { patientId, name } = body

  if (!patientId) return NextResponse.json({ error: 'patientId obrigatório' }, { status: 422 })
  if (name && typeof name === 'string' && name.length > 200) {
    return NextResponse.json({ error: 'name máximo 200 caracteres' }, { status: 422 })
  }

  // Verificar que o contato pertence ao usuário (404 para não expor existência)
  const { data: contact } = await supabase
    .from('patients')
    .select('id, name, phone')
    .eq('id', patientId)
    .eq('user_id', user.id)
    .single()

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: Record<string, unknown> = { is_patient: true }
  if (name && name.trim()) updates.name = name.trim()

  const { data: patient, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', patientId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

  return NextResponse.json({ patient })
}
