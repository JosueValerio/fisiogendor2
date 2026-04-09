import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, clinic_name, phone, subscription_status, created_at')
    .eq('id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ profile: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  // Apenas clinic_name e phone são editáveis pelo usuário
  const updates: Record<string, unknown> = {}
  if ('clinic_name' in body) {
    if (typeof body.clinic_name === 'string' && body.clinic_name.length > 200)
      return NextResponse.json({ error: 'clinic_name máximo 200 caracteres' }, { status: 422 })
    updates.clinic_name = body.clinic_name
  }
  if ('phone' in body) {
    if (typeof body.phone === 'string' && body.phone.length > 50)
      return NextResponse.json({ error: 'phone máximo 50 caracteres' }, { status: 422 })
    updates.phone = body.phone
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('id, email, clinic_name, phone, subscription_status')
    .single()

  if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

  return NextResponse.json({ profile: data })
}
