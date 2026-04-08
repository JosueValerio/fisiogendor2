-- Pacientes — multi-tenant via user_id obrigatório
CREATE TABLE IF NOT EXISTS public.patients (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name              text NOT NULL,
  phone             text NOT NULL,
  email             text,
  status            text,
  recovery_progress integer NOT NULL DEFAULT 0
                      CHECK (recovery_progress >= 0 AND recovery_progress <= 100),
  clinical_history  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);

-- Garante que o mesmo número não seja registrado duas vezes para o mesmo usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_user_phone
  ON public.patients(user_id, phone);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
