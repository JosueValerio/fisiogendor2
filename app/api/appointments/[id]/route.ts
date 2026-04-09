import { createClient } from '@/lib/supabase/server'
import { reschedule, cancel, AppointmentConflictError } from '@/services/appointmentService'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { datetime } = body

  if (!datetime) {
    return NextResponse.json({ error: 'datetime é obrigatório' }, { status: 422 })
  }

  try {
    const appointment = await reschedule(user.id, id, datetime)
    return NextResponse.json({ appointment })
  } catch (err) {
    if (err instanceof AppointmentConflictError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    const status = (err as { status?: number }).status === 404 ? 404 : 500
    return NextResponse.json({ error: status === 404 ? 'Not found' : 'Internal error' }, { status })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await cancel(user.id, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const status = (err as { status?: number }).status === 404 ? 404 : 500
    return NextResponse.json({ error: status === 404 ? 'Not found' : 'Internal error' }, { status })
  }
}
