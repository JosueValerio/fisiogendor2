import { createClient } from '@/lib/supabase/server'
import { getGoogleOAuthUrl } from '@/lib/google/oauth'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = getGoogleOAuthUrl(user.id)
  return NextResponse.redirect(url)
}
