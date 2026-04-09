import { createHeadlessAdminClient } from '@/lib/supabase/server'
import { encryptTokens, decryptTokens } from '@/lib/google/encryption'
import { refreshAccessToken, getAuthenticatedCalendar } from '@/lib/google/oauth'
import type { GoogleTokens } from '@/types'

async function getTokensForUser(userId: string): Promise<{
  tokens: GoogleTokens
  calendarId: string
  operatingHours: Record<string, { start: string; end: string; enabled: boolean }>
}> {
  const db = createHeadlessAdminClient()
  const { data, error } = await db
    .from('agent_settings')
    .select('google_tokens, google_calendar_id, operating_hours')
    .eq('user_id', userId)
    .single()

  if (error || !data?.google_tokens) {
    throw new Error('Google Calendar não conectado para este usuário')
  }

  let tokens = decryptTokens(data.google_tokens as string)

  // Atualiza o token se expirar em menos de 5 minutos
  if (tokens.expiry_date - Date.now() < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(tokens.refresh_token)
    tokens = { ...tokens, access_token: refreshed.access_token, expiry_date: refreshed.expiry_date }
    const encrypted = encryptTokens(tokens)
    await db.from('agent_settings').update({ google_tokens: encrypted }).eq('user_id', userId)
  }

  return {
    tokens,
    calendarId: data.google_calendar_id ?? 'primary',
    operatingHours: (data.operating_hours as Record<string, { start: string; end: string; enabled: boolean }>) ?? {},
  }
}

export async function createEvent(
  userId: string,
  params: { title: string; datetime: string; durationMinutes?: number; notes?: string }
): Promise<string> {
  const { tokens, calendarId } = await getTokensForUser(userId)
  const calendar = getAuthenticatedCalendar(tokens)

  const start = new Date(params.datetime)
  const end = new Date(start.getTime() + (params.durationMinutes ?? 60) * 60 * 1000)

  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: params.title,
      description: params.notes ?? '',
      start: { dateTime: start.toISOString(), timeZone: 'America/Sao_Paulo' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Sao_Paulo' },
    },
  })

  return event.data.id!
}

export async function updateEvent(
  userId: string,
  googleEventId: string,
  params: { datetime: string; durationMinutes?: number }
): Promise<void> {
  const { tokens, calendarId } = await getTokensForUser(userId)
  const calendar = getAuthenticatedCalendar(tokens)

  const start = new Date(params.datetime)
  const end = new Date(start.getTime() + (params.durationMinutes ?? 60) * 60 * 1000)

  await calendar.events.patch({
    calendarId,
    eventId: googleEventId,
    requestBody: {
      start: { dateTime: start.toISOString(), timeZone: 'America/Sao_Paulo' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Sao_Paulo' },
    },
  })
}

export async function deleteEvent(userId: string, googleEventId: string): Promise<void> {
  try {
    const { tokens, calendarId } = await getTokensForUser(userId)
    const calendar = getAuthenticatedCalendar(tokens)
    await calendar.events.delete({ calendarId, eventId: googleEventId })
  } catch {
    // Silencia erros de evento não encontrado (já deletado)
  }
}

export async function getAvailability(userId: string, date: string): Promise<string[]> {
  const { tokens, calendarId, operatingHours } = await getTokensForUser(userId)
  const calendar = getAuthenticatedCalendar(tokens)

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayOfWeek = dayNames[new Date(date + 'T12:00:00').getDay()]
  const hours = operatingHours[dayOfWeek]

  if (!hours?.enabled) return []

  const dayStart = new Date(`${date}T${hours.start}:00-03:00`)
  const dayEnd = new Date(`${date}T${hours.end}:00-03:00`)

  const freebusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      items: [{ id: calendarId }],
    },
  })

  const busyIntervals = (freebusy.data.calendars?.[calendarId]?.busy ?? []).map((b) => ({
    start: new Date(b.start!).getTime(),
    end: new Date(b.end!).getTime(),
  }))

  const slots: string[] = []
  const slotDuration = 30 * 60 * 1000
  let current = dayStart.getTime()

  while (current + slotDuration <= dayEnd.getTime()) {
    const slotEnd = current + slotDuration
    const isBusy = busyIntervals.some((b) => current < b.end && slotEnd > b.start)
    if (!isBusy) slots.push(new Date(current).toISOString())
    current += slotDuration
  }

  return slots
}
