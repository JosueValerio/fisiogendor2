import { google } from 'googleapis'
import type { GoogleTokens } from '@/types'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
  )
}

export function getGoogleOAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client()
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64url')

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  })
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Token incompleto retornado pelo Google')
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date ?? Date.now() + 3600 * 1000,
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expiry_date: number }> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()

  return {
    access_token: credentials.access_token!,
    expiry_date: credentials.expiry_date ?? Date.now() + 3600 * 1000,
  }
}

export function getAuthenticatedCalendar(tokens: GoogleTokens) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}
