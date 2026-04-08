// Fase 8 — Implementado pelo Engenheiro
// Responsabilidade: checkout, webhook com idempotência

export async function createCheckoutSession(_userId: string, _email: string) {
  throw new Error('stripeService.createCheckoutSession: não implementado — Fase 8')
}

export async function handleWebhookEvent(_rawBody: Buffer, _signature: string) {
  // REGRA: verificar assinatura com stripe.webhooks.constructEvent
  // REGRA: idempotência — checar se evento já foi processado antes de agir
  throw new Error('stripeService.handleWebhookEvent: não implementado — Fase 8')
}
