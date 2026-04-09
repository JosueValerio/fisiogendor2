import { getStripe } from '@/lib/stripe'
import { createHeadlessAdminClient } from '@/lib/supabase/server'

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function createCheckoutSession(userId: string, email: string): Promise<string> {
  const stripe = getStripe()
  const supabase = createHeadlessAdminClient()

  // Buscar ou criar customer Stripe
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  let customerId = profile?.stripe_customer_id as string | null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { supabase_user_id: userId },
    })
    customerId = customer.id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${APP_URL}/dashboard?subscription=success`,
    cancel_url: `${APP_URL}/settings?subscription=cancelled`,
  })

  return session.url!
}

export async function handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
  const stripe = getStripe()
  const supabase = createHeadlessAdminClient()

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )

  // Idempotência: ignorar eventos já processados
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle()

  if (existing) return

  // Registrar evento antes de atualizar (write-first idempotência)
  await supabase.from('stripe_events').insert({ id: event.id })

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as { client_reference_id: string }
      await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', session.client_reference_id)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as { customer: string }
      await supabase
        .from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('stripe_customer_id', sub.customer)
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as { customer: string }
      await supabase
        .from('profiles')
        .update({ subscription_status: 'inactive' })
        .eq('stripe_customer_id', invoice.customer)
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as { customer: string; status: string }
      const newStatus = sub.status === 'active' ? 'active' : 'inactive'
      await supabase
        .from('profiles')
        .update({ subscription_status: newStatus })
        .eq('stripe_customer_id', sub.customer)
      break
    }
    default:
      break
  }
}
