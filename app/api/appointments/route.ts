import { createClient } from '@/lib/supabase/server'
import { create, AppointmentConflictError } from '@/services/appointmentService'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  let query = supabase
    .from('appointments')
    .select('*, patient:patients(name, phone)')
    .eq('user_id', user.id)
    .order('datetime', { ascending: true })

  if (date) {
    query = query.gte('datetime', `${date}T00:00:00`).lte('datetime', `${date}T23:59:59`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

  return NextResponse.json({ appointments: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { patientId, datetime, type } = body

  if (!patientId || !datetime) {
    return NextResponse.json({ error: 'patientId e datetime são obrigatórios' }, { status: 422 })
  }

  try {
    const appointment = await create(user.id, patientId, datetime, type ?? 'fisioterapia')
    return NextResponse.json({ appointment }, { status: 201 })
  } catch (err) {
    if (err instanceof AppointmentConflictError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
