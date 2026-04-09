-- Fase 5: Adicionar coluna ai_enabled na tabela agent_settings
ALTER TABLE public.agent_settings
  ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT true;
