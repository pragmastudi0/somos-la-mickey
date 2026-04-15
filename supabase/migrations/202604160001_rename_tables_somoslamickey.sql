-- Rename public.* app tables to somoslamickey_* (idempotent for fresh DBs that already use prefix).

-- 1) Drop RLS policies on legacy table names (if still present)
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
  END IF;
  IF to_regclass('public.clientes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "clientes_select_self_or_admin" ON public.clientes;
  END IF;
  IF to_regclass('public.configuracion') IS NOT NULL THEN
    DROP POLICY IF EXISTS "configuracion_read_authenticated" ON public.configuracion;
  END IF;
  IF to_regclass('public.ciclos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "ciclos_select_self_or_admin" ON public.ciclos;
  END IF;
  IF to_regclass('public.compras') IS NOT NULL THEN
    DROP POLICY IF EXISTS "compras_select_self_or_admin" ON public.compras;
  END IF;
  IF to_regclass('public.promociones') IS NOT NULL THEN
    DROP POLICY IF EXISTS "promociones_read_authenticated" ON public.promociones;
  END IF;
END $$;

-- 2) Rename tables (only when legacy exists and target does not)
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL AND to_regclass('public.somoslamickey_profiles') IS NULL THEN
    ALTER TABLE public.profiles RENAME TO somoslamickey_profiles;
  END IF;
  IF to_regclass('public.clientes') IS NOT NULL AND to_regclass('public.somoslamickey_clientes') IS NULL THEN
    ALTER TABLE public.clientes RENAME TO somoslamickey_clientes;
  END IF;
  IF to_regclass('public.configuracion') IS NOT NULL AND to_regclass('public.somoslamickey_configuracion') IS NULL THEN
    ALTER TABLE public.configuracion RENAME TO somoslamickey_configuracion;
  END IF;
  IF to_regclass('public.ciclos') IS NOT NULL AND to_regclass('public.somoslamickey_ciclos') IS NULL THEN
    ALTER TABLE public.ciclos RENAME TO somoslamickey_ciclos;
  END IF;
  IF to_regclass('public.compras') IS NOT NULL AND to_regclass('public.somoslamickey_compras') IS NULL THEN
    ALTER TABLE public.compras RENAME TO somoslamickey_compras;
  END IF;
  IF to_regclass('public.promociones') IS NOT NULL AND to_regclass('public.somoslamickey_promociones') IS NULL THEN
    ALTER TABLE public.promociones RENAME TO somoslamickey_promociones;
  END IF;
END $$;

-- 3) Rename indexes for consistency
ALTER INDEX IF EXISTS public.idx_ciclos_cliente_id RENAME TO idx_somoslamickey_ciclos_cliente_id;
ALTER INDEX IF EXISTS public.idx_compras_cliente_id RENAME TO idx_somoslamickey_compras_cliente_id;
ALTER INDEX IF EXISTS public.idx_compras_fecha RENAME TO idx_somoslamickey_compras_fecha;
ALTER INDEX IF EXISTS public.idx_promociones_activa RENAME TO idx_somoslamickey_promociones_activa;

-- 4) Auth trigger: insert into prefixed tables
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_name text;
begin
  derived_name := coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1));

  insert into public.somoslamickey_profiles (id, email, role)
  values (new.id, new.email, 'cliente')
  on conflict (id) do update set email = excluded.email;

  insert into public.somoslamickey_clientes (auth_user_id, email, nombre, fecha_alta, activo)
  values (new.id, new.email, initcap(replace(derived_name, '.', ' ')), current_date, true)
  on conflict (auth_user_id) do update set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 5) RLS policies on prefixed tables (drop if re-run, then create)
DROP POLICY IF EXISTS "profiles_select_self" ON public.somoslamickey_profiles;
CREATE POLICY "profiles_select_self"
ON public.somoslamickey_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "clientes_select_self_or_admin" ON public.somoslamickey_clientes;
CREATE POLICY "clientes_select_self_or_admin"
ON public.somoslamickey_clientes FOR SELECT
TO authenticated
USING (
  auth.uid() = auth_user_id
  OR EXISTS (
    SELECT 1 FROM public.somoslamickey_profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "configuracion_read_authenticated" ON public.somoslamickey_configuracion;
CREATE POLICY "configuracion_read_authenticated"
ON public.somoslamickey_configuracion FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "ciclos_select_self_or_admin" ON public.somoslamickey_ciclos;
CREATE POLICY "ciclos_select_self_or_admin"
ON public.somoslamickey_ciclos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.somoslamickey_clientes c
    WHERE c.id = somoslamickey_ciclos.cliente_id AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.somoslamickey_profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "compras_select_self_or_admin" ON public.somoslamickey_compras;
CREATE POLICY "compras_select_self_or_admin"
ON public.somoslamickey_compras FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.somoslamickey_clientes c
    WHERE c.id = somoslamickey_compras.cliente_id AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.somoslamickey_profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "promociones_read_authenticated" ON public.somoslamickey_promociones;
CREATE POLICY "promociones_read_authenticated"
ON public.somoslamickey_promociones FOR SELECT
TO authenticated
USING (true);
