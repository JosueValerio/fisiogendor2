import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/services/stripeService'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 5 tentativas/hora por user
  const allowed = await checkRateLimit(`rl:checkout:${user.id}`, 5, 3600)
  if (!allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_status === 'active') {
    return NextResponse.json({ error: 'Assinatura já ativa' }, { status: 400 })
  }

  try {
    const url = await createCheckoutSession(user.id, user.email!)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[billing/checkout]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
