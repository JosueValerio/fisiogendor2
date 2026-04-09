import { NextRequest, NextResponse } from 'next/server'
import { handleWebhookEvent } from '@/services/stripeService'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature') ?? ''

  try {
    const arrayBuffer = await request.arrayBuffer()
    const rawBody = Buffer.from(arrayBuffer)
    await handleWebhookEvent(rawBody, signature)
  } catch (err) {
    console.error('[billing/webhook]', err)
    // Retornar 200 mesmo em erro para evitar reenvio infinito do Stripe
  }

  return NextResponse.json({ received: true })
}
