import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Em produção atrás do Traefik, request.url é a URL interna do container
  // (ex: http://app:3000). Precisamos usar os headers x-forwarded-* para
  // construir a URL pública correta.
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'www.fisiogendor.com'
  const publicOrigin = `${forwardedProto}://${forwardedHost}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${publicOrigin}${next}`)
    }
  }

  return NextResponse.redirect(`${publicOrigin}/login?error=auth_failed`)
}
