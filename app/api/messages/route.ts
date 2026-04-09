import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId')

  if (!patientId) {
    // Lista de pacientes com última mensagem para o painel de conversas
    const { data, error } = await supabase
      .from('messages')
      .select('patient_id, content, direction, created_at, patient:patients(name, phone)')
      .eq('user_id', user.id)
      .not('patient_id', 'is', null)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

    // Deduplica por patient_id mantendo a mensagem mais recente
    const seen = new Set<string>()
    const conversations = (data ?? []).filter((m) => {
      if (!m.patient_id || seen.has(m.patient_id)) return false
      seen.add(m.patient_id)
      return true
    })

    return NextResponse.json({ conversations })
  }

  // Verifica que o paciente pertence ao usuário
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('user_id', user.id)
    .single()

  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

  return NextResponse.json({ messages: data })
}
