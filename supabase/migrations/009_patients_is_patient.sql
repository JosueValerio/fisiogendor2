-- Coluna para distinguir "contatos" (números que mandaram mensagem)
-- de "pacientes" (registros aprovados manualmente pelo fisioterapeuta)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS is_patient boolean NOT NULL DEFAULT true;

-- Índice para filtrar pacientes reais rapidamente
CREATE INDEX IF NOT EXISTS idx_patients_is_patient
  ON public.patients (user_id, is_patient);
