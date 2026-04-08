-- Configurações do agente IA por usuário (1:1 com profiles)
CREATE TABLE IF NOT EXISTS public.agent_settings (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ai_tone               text NOT NULL DEFAULT 'empathetic'
                          CHECK (ai_tone IN ('empathetic', 'casual', 'formal')),
  operating_hours       jsonb NOT NULL DEFAULT '{}',
  -- Exemplo: {"monday": {"start": "08:00", "end": "18:00", "enabled": true}, ...}
  specific_instructions text,
  trigger_keywords      text[] NOT NULL DEFAULT ARRAY['agendar', 'consulta', 'marcar', 'horário'],
  whatsapp_instance_id  text,
  google_calendar_id    text,
  google_tokens         jsonb,  -- access_token, refresh_token, expiry — criptografado na aplicação
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_settings_user_id ON public.agent_settings(user_id);

CREATE OR REPLACE TRIGGER agent_settings_updated_at
  BEFORE UPDATE ON public.agent_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Cria configuração padrão quando perfil é criado
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agent_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
