import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  let query = supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

  return NextResponse.json({ patients: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, phone, email, clinical_history } = body

  if (!name || !phone) {
    return NextResponse.json({ error: 'name e phone são obrigatórios' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('patients')
    .insert({ user_id: user.id, name, phone, email: email ?? null, clinical_history: clinical_history ?? null, recovery_progress: 0 })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Já existe um paciente com este telefone', field: 'phone' }, { status: 422 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ patient: data }, { status: 201 })
}
