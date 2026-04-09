import { exchangeCodeForTokens } from '@/lib/google/oauth'
import { encryptTokens } from '@/lib/google/encryption'
import { createHeadlessAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'www.fisiogendor.com'
  const appUrl = `${forwardedProto}://${forwardedHost}`

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?calendar=error`)
  }

  try {
    const { userId } = JSON.parse(Buffer.from(state, 'base64url').toString())
    const tokens = await exchangeCodeForTokens(code)
    const encrypted = encryptTokens(tokens)

    const db = createHeadlessAdminClient()
    const { error } = await db
      .from('agent_settings')
      .update({ google_tokens: encrypted })
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.redirect(`${appUrl}/settings?calendar=connected`)
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?calendar=error`)
  }
}
