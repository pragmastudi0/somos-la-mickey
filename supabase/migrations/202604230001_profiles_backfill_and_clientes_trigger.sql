-- Backfill de perfiles faltantes y trigger inverso desde clientes -> profiles.
-- Objetivo: reducir inconsistencias historicas entre somoslamickey_clientes y somoslamickey_profiles.

-- ============================================================
-- Diagnostico previo (ejecutar manualmente si queres validar)
-- ============================================================
-- A) Clientes con auth_user_id pero sin profile
-- select count(*) as clientes_sin_profile
-- from public.somoslamickey_clientes c
-- left join public.somoslamickey_profiles p on p.id = c.auth_user_id
-- where c.auth_user_id is not null
--   and p.id is null;
--
-- B) Clientes legacy sin auth_user_id (no se resuelven solos)
-- select count(*) as clientes_sin_auth_user
-- from public.somoslamickey_clientes
-- where auth_user_id is null;
--
-- C) Detalle de clientes legacy potencialmente recuperables por email en auth.users
-- select c.id, c.nombre, c.email
-- from public.somoslamickey_clientes c
-- where c.auth_user_id is null
-- order by c.created_at desc nulls last, c.fecha_alta desc nulls last;

-- ============================================================
-- 1) Backfill de profiles faltantes para clientes con auth_user_id
-- ============================================================
do $$
declare
  has_app_id_profiles boolean;
  has_app_id_clientes boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'somoslamickey_profiles'
      and column_name = 'application_id'
  ) into has_app_id_profiles;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'somoslamickey_clientes'
      and column_name = 'application_id'
  ) into has_app_id_clientes;

  if has_app_id_profiles and has_app_id_clientes then
    execute $sql$
      insert into public.somoslamickey_profiles (id, email, role, application_id)
      select c.auth_user_id, c.email, 'cliente', c.application_id
      from public.somoslamickey_clientes c
      left join public.somoslamickey_profiles p
        on p.id = c.auth_user_id
       and p.application_id = c.application_id
      where c.auth_user_id is not null
        and p.id is null
      on conflict (id) do update
      set
        email = excluded.email
    $sql$;
  else
    execute $sql$
      insert into public.somoslamickey_profiles (id, email, role)
      select c.auth_user_id, c.email, 'cliente'
      from public.somoslamickey_clientes c
      left join public.somoslamickey_profiles p on p.id = c.auth_user_id
      where c.auth_user_id is not null
        and p.id is null
      on conflict (id) do update
      set
        email = excluded.email
    $sql$;
  end if;
end $$;

-- ============================================================
-- 2) Trigger AFTER INSERT en clientes para auto-crear profile
-- ============================================================
drop trigger if exists on_cliente_created_sync_profile on public.somoslamickey_clientes;
drop function if exists public.handle_cliente_insert_profile_sync();

create or replace function public.handle_cliente_insert_profile_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.auth_user_id is null then
    return new;
  end if;

  -- No pisa admin existente. Si ya existe profile, solo sincroniza email.
  insert into public.somoslamickey_profiles (id, email, role)
  values (new.auth_user_id, new.email, 'cliente')
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

create trigger on_cliente_created_sync_profile
after insert on public.somoslamickey_clientes
for each row
execute procedure public.handle_cliente_insert_profile_sync();

-- ============================================================
-- Diagnostico posterior (ejecutar manualmente)
-- ============================================================
-- select count(*) as clientes_sin_profile_post
-- from public.somoslamickey_clientes c
-- left join public.somoslamickey_profiles p on p.id = c.auth_user_id
-- where c.auth_user_id is not null
--   and p.id is null;
