import { createHeadlessAdminClient } from '@/lib/supabase/server'
import * as calendarService from '@/services/calendarService'
import type { Appointment } from '@/types'

export class AppointmentConflictError extends Error {
  constructor() {
    super('Horário já ocupado')
    this.name = 'AppointmentConflictError'
  }
}

export async function checkConflict(userId: string, datetime: string): Promise<boolean> {
  const db = createHeadlessAdminClient()
  const { data } = await db
    .from('appointments')
    .select('id')
    .eq('user_id', userId)
    .eq('datetime', datetime)
    .not('status', 'eq', 'cancelled')
    .limit(1)

  return (data?.length ?? 0) > 0
}

export async function create(
  userId: string,
  patientId: string,
  datetime: string,
  type: string
): Promise<Appointment> {
  if (await checkConflict(userId, datetime)) {
    throw new AppointmentConflictError()
  }

  // Buscar nome do paciente para o título do evento
  const db = createHeadlessAdminClient()
  const { data: patient } = await db
    .from('patients')
    .select('name')
    .eq('id', patientId)
    .eq('user_id', userId)
    .single()

  if (!patient) throw new Error('Paciente não encontrado')

  const patientName = patient.name as string

  // Criar evento no Google Calendar
  let googleEventId: string | null = null
  try {
    googleEventId = await calendarService.createEvent(userId, {
      title: `Fisioterapia — ${patientName}`,
      datetime,
      durationMinutes: 60,
    })
  } catch (err) {
    console.warn('[appointmentService] Google Calendar unavailable:', err)
  }

  // Inserir agendamento no banco
  const { data: appointment, error } = await db
    .from('appointments')
    .insert({
      user_id: userId,
      patient_id: patientId,
      datetime,
      type,
      status: 'confirmed',
      google_event_id: googleEventId,
    })
    .select('*, patient:patients(name, phone)')
    .single()

  if (error) {
    // Compensação: remover evento do Calendar se o INSERT falhou
    if (googleEventId) {
      await calendarService.deleteEvent(userId, googleEventId).catch(() => {})
    }
    throw error
  }

  return appointment as Appointment
}

export async function reschedule(
  userId: string,
  appointmentId: string,
  newDatetime: string
): Promise<Appointment> {
  const db = createHeadlessAdminClient()

  const { data: appointment } = await db
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .single()

  if (!appointment) throw Object.assign(new Error('Not found'), { status: 404 })

  if (await checkConflict(userId, newDatetime)) {
    throw new AppointmentConflictError()
  }

  if (appointment.google_event_id) {
    await calendarService.updateEvent(userId, appointment.google_event_id as string, { datetime: newDatetime })
  }

  const { data: updated, error } = await db
    .from('appointments')
    .update({ datetime: newDatetime })
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .select('*, patient:patients(name, phone)')
    .single()

  if (error) throw error
  return updated as Appointment
}

export async function cancel(userId: string, appointmentId: string): Promise<void> {
  const db = createHeadlessAdminClient()

  const { data: appointment } = await db
    .from('appointments')
    .select('google_event_id')
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .single()

  if (!appointment) throw Object.assign(new Error('Not found'), { status: 404 })

  if (appointment.google_event_id) {
    await calendarService.deleteEvent(userId, appointment.google_event_id as string)
  }

  await db
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .eq('user_id', userId)
}
