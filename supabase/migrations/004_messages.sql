-- Mensagens WhatsApp — multi-tenant via user_id obrigatório
CREATE TABLE IF NOT EXISTS public.messages (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id           uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  content              text NOT NULL,
  direction            text NOT NULL CHECK (direction IN ('in', 'out')),
  whatsapp_message_id  text UNIQUE,  -- evita duplicatas do webhook
  processed            boolean NOT NULL DEFAULT false,
  intent               text CHECK (intent IN ('schedule', 'reschedule', 'cancel', 'fallback')),
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id   ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_patient   ON public.messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_processed ON public.messages(processed) WHERE processed = false;
