-- Agendamentos — multi-tenant via user_id obrigatório
CREATE TABLE IF NOT EXISTS public.appointments (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id      uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  datetime        timestamptz NOT NULL,
  type            text,
  status          text NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'pending')),
  google_event_id text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id  ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON public.appointments(datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_patient  ON public.appointments(patient_id);

-- Previne agendamento duplicado no mesmo horário para o mesmo usuário
-- (anti-conflito em nível de banco — a service layer valida também no Google Calendar)
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_user_datetime
  ON public.appointments(user_id, datetime)
  WHERE status NOT IN ('cancelled');

CREATE OR REPLACE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
