-- Tabela de idempotência para eventos Stripe
-- SEM RLS — apenas service role acessa via createHeadlessAdminClient()
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id         text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
