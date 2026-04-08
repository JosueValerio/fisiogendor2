-- Profiles: extends auth.users com dados do fisioterapeuta
-- user_id = auth.users.id (UUID gerado pelo Supabase Auth)

CREATE TABLE IF NOT EXISTS public.profiles (
  id             uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email          text NOT NULL,
  clinic_name    text,
  phone          text,
  subscription_status text NOT NULL DEFAULT 'inactive'
                   CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  stripe_customer_id text UNIQUE,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Cria perfil automaticamente após novo usuário se registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
