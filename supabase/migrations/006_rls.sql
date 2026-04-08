-- ============================================================
-- RLS (Row Level Security) — CRÍTICO
-- Cada tabela só permite acesso ao próprio usuário autenticado.
-- auth.uid() é fornecido pelo Supabase Auth — nunca pelo cliente.
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_settings  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles: usuário vê apenas o próprio"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: usuário atualiza apenas o próprio"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT feito apenas pelo trigger handle_new_user (SECURITY DEFINER)
-- Nenhuma política de INSERT exposta ao usuário

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE POLICY "patients: select próprio"
  ON public.patients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "patients: insert próprio"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "patients: update próprio"
  ON public.patients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "patients: delete próprio"
  ON public.patients FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE POLICY "appointments: select próprio"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "appointments: insert próprio"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments: update próprio"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments: delete próprio"
  ON public.appointments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE POLICY "messages: select próprio"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "messages: insert próprio"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mensagens não podem ser atualizadas/deletadas pelo usuário
-- (integridade do histórico)

-- ============================================================
-- AGENT SETTINGS
-- ============================================================
CREATE POLICY "agent_settings: select próprio"
  ON public.agent_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "agent_settings: update próprio"
  ON public.agent_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT feito apenas pelo trigger handle_new_profile (SECURITY DEFINER)
