/*
# Business workspace schema (profiles, clients, quotes, services, transactions)

1. Purpose
- Creates the full data foundation for NEGÓCIO EM ORDEM: user profiles, clients (CRM), quotes, services, and financial transactions.
- Every table is owner-scoped: each authenticated user can only ever see and change their own rows.

2. New Tables
- `profiles`: one row per account (id = auth user id); stores name, business name, phone and preferences.
- `clients`: CRM records owned by a user (name required; phone, email, document, address, notes optional).
- `quotes`: budget/proposal records with generated `number` (per-user identity), money fields, generated `total`, valid-until date and status check.
- `services`: jobs linked to a client and optionally to an approved quote; status and date checks.
- `transactions`: income/expense entries with due/paid dates and a paid-date/status consistency check.

3. Relationships and integrity
- All child tables reference `profiles(id)` with `ON DELETE CASCADE` and carry `user_id uuid NOT NULL DEFAULT auth.uid()` so client inserts never need to pass the owner.
- `quotes.client_id` and `services.client_id` use composite foreign keys `(user_id, client_id) -> clients(user_id, id) ON DELETE RESTRICT` so a user can never point at another user's client.
- `services.quote_id` references `quotes(user_id, id)` and is unique — one service per quote. A trigger `enforce_approved_quote` only allows linking an APPROVED quote. `convert_quote_to_service(quote)` atomically converts an approved quote into a service (idempotent, owner-checked).
- Check constraints mirror the app rules in `src/lib/business.ts` (statuses, non-negative amounts, paid-date consistency).

4. Indexes
- clients(user_id), quotes(user_id, client_id), services(user_id, client_id), services(user_id, quote_id), transactions(user_id, due_date).

5. Security
- RLS enabled on every table. Grants: SELECT/INSERT/UPDATE/DELETE to `authenticated` only (app requires sign-in); service_role full access for triggers/admin.
- Owner policies per table scoped `TO authenticated` using `(select auth.uid()) = user_id` (profiles: `= id`).
- Trigger `on_user_signup` (SECURITY DEFINER) creates the profile row on signup with the user's name.
- `convert_quote_to_service` is SECURITY INVOKER (runs under RLS), EXECUTE revoked from PUBLIC/anon, granted to `authenticated`.
- Sequence `quotes_number_seq` usage granted to authenticated/service_role.
*/
CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL DEFAULT '', business_name text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', preferences jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_owner" ON public.profiles;
CREATE POLICY "profiles_owner" ON public.profiles FOR ALL TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
CREATE FUNCTION public.create_user_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ BEGIN INSERT INTO public.profiles(id,name) VALUES (new.id,coalesce(new.raw_user_meta_data->>'name',new.raw_user_meta_data->>'full_name','')); RETURN new; END; $$;
CREATE TRIGGER on_user_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();
CREATE TABLE public.clients (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (length(trim(name)) > 0), phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', document text NOT NULL DEFAULT '', address text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_owner" ON public.clients;
CREATE POLICY "clients_owner" ON public.clients FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE INDEX clients_user_idx ON public.clients(user_id);
CREATE TABLE public.quotes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
 number bigint GENERATED ALWAYS AS IDENTITY, client_id uuid NOT NULL, description text NOT NULL CHECK (length(trim(description)) > 0), materials_description text NOT NULL DEFAULT '', materials numeric(12,2) NOT NULL DEFAULT 0 CHECK(materials>=0), labor numeric(12,2) NOT NULL DEFAULT 0 CHECK(labor>=0), travel numeric(12,2) NOT NULL DEFAULT 0 CHECK(travel>=0), discount numeric(12,2) NOT NULL DEFAULT 0 CHECK(discount>=0), total numeric(12,2) GENERATED ALWAYS AS (greatest(0,materials+labor+travel-discount)) STORED, valid_until date, status text NOT NULL DEFAULT 'Rascunho' CHECK(status IN ('Rascunho','Enviado','Aguardando resposta','Aprovado','Recusado','Expirado')), notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,id), FOREIGN KEY(user_id,client_id) REFERENCES public.clients(user_id,id) ON DELETE RESTRICT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.quotes_number_seq TO authenticated,service_role;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quotes_owner" ON public.quotes;
CREATE POLICY "quotes_owner" ON public.quotes FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE INDEX quotes_client_idx ON public.quotes(user_id,client_id);
CREATE TABLE public.services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
 client_id uuid NOT NULL, quote_id uuid, description text NOT NULL CHECK(length(trim(description))>0), value numeric(12,2) NOT NULL DEFAULT 0 CHECK(value>=0), start_date date, end_date date, status text NOT NULL DEFAULT 'Pendente' CHECK(status IN ('Pendente','Agendado','Em andamento','Concluído','Cancelado')), notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,id), UNIQUE(quote_id), FOREIGN KEY(user_id,client_id) REFERENCES public.clients(user_id,id) ON DELETE RESTRICT, FOREIGN KEY(user_id,quote_id) REFERENCES public.quotes(user_id,id) ON DELETE RESTRICT, CHECK(end_date IS NULL OR start_date IS NULL OR end_date>=start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "services_owner" ON public.services;
CREATE POLICY "services_owner" ON public.services FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE INDEX services_client_idx ON public.services(user_id,client_id);
CREATE INDEX services_quote_idx ON public.services(user_id,quote_id);
CREATE TABLE public.transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
 description text NOT NULL CHECK(length(trim(description))>0), type text NOT NULL CHECK(type IN ('Receita','Despesa')), category text NOT NULL DEFAULT 'Outros', amount numeric(12,2) NOT NULL CHECK(amount>0), due_date date NOT NULL DEFAULT current_date, paid_date date, status text NOT NULL DEFAULT 'Pendente' CHECK(status IN ('Pendente','Pago')), notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), CHECK((status='Pago' AND paid_date IS NOT NULL) OR (status='Pendente' AND paid_date IS NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transactions_owner" ON public.transactions;
CREATE POLICY "transactions_owner" ON public.transactions FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE INDEX transactions_user_due_idx ON public.transactions(user_id,due_date);
CREATE FUNCTION public.convert_quote_to_service(quote uuid) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$ DECLARE q public.quotes; result uuid; BEGIN SELECT * INTO q FROM public.quotes WHERE id=quote AND user_id=auth.uid() FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Orçamento não encontrado'; END IF; IF q.status <> 'Aprovado' THEN RAISE EXCEPTION 'Apenas orçamentos aprovados podem virar serviços'; END IF; SELECT id INTO result FROM public.services WHERE quote_id=q.id; IF result IS NOT NULL THEN RETURN result; END IF; INSERT INTO public.services(user_id,client_id,quote_id,description,value,notes) VALUES(q.user_id,q.client_id,q.id,q.description,q.total,q.notes) RETURNING id INTO result; RETURN result; END; $$;
REVOKE ALL ON FUNCTION public.convert_quote_to_service(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.convert_quote_to_service(uuid) TO authenticated;
CREATE FUNCTION public.validate_service_quote() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN IF new.quote_id IS NOT NULL AND (TG_OP='INSERT' OR new.quote_id IS DISTINCT FROM old.quote_id) AND NOT EXISTS(SELECT 1 FROM public.quotes WHERE id=new.quote_id AND user_id=new.user_id AND status='Aprovado') THEN RAISE EXCEPTION 'Apenas orçamentos aprovados podem virar serviços'; END IF; RETURN new; END; $$;
CREATE TRIGGER enforce_approved_quote BEFORE INSERT OR UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.validate_service_quote();