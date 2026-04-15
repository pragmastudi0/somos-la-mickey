-- Bootstrap completo desde cero para Somos la Mickey.
-- Uso recomendado: proyecto Supabase nuevo o DB previamente limpiada.

create extension if not exists pgcrypto;

-- Limpieza defensiva para reinstalacion total
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.somoslamickey_compras cascade;
drop table if exists public.somoslamickey_ciclos cascade;
drop table if exists public.somoslamickey_promociones cascade;
drop table if exists public.somoslamickey_clientes cascade;
drop table if exists public.somoslamickey_profiles cascade;
drop table if exists public.somoslamickey_configuracion cascade;

create table public.somoslamickey_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'cliente' check (role in ('admin', 'cliente')),
  created_at timestamptz not null default now()
);

create table public.somoslamickey_clientes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  nombre text not null,
  email text not null unique,
  telefono text,
  fecha_alta date not null default current_date,
  activo boolean not null default true,
  porcentaje_efectivo_custom numeric(5,2),
  porcentaje_tarjeta_custom numeric(5,2),
  created_at timestamptz not null default now()
);

create table public.somoslamickey_configuracion (
  id uuid primary key default gen_random_uuid(),
  slug_app text not null default 'somos-la-mickey',
  nombre_negocio text not null default 'Somos la Mickey',
  porcentaje_efectivo numeric(5,2) not null default 10,
  porcentaje_tarjeta numeric(5,2) not null default 5,
  umbral_compras integer not null default 15,
  created_at timestamptz not null default now()
);

create table public.somoslamickey_ciclos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.somoslamickey_clientes(id) on delete cascade,
  numero integer not null default 1,
  acum_reintegro numeric(12,2) not null default 0,
  compras_count integer not null default 0,
  puede_retirar boolean not null default false,
  retirado boolean not null default false,
  monto_retirado numeric(12,2),
  fecha_retiro date,
  created_at timestamptz not null default now()
);

create table public.somoslamickey_compras (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.somoslamickey_clientes(id) on delete cascade,
  ciclo_id uuid references public.somoslamickey_ciclos(id) on delete set null,
  ciclo_numero integer not null default 1,
  monto numeric(12,2) not null,
  metodo_pago text not null check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia')),
  porcentaje_aplicado numeric(5,2) not null,
  reintegro_generado numeric(12,2) not null default 0,
  fecha date not null,
  created_at timestamptz not null default now()
);

create table public.somoslamickey_promociones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  badge text,
  activa boolean not null default true,
  fecha_inicio date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_somoslamickey_ciclos_cliente_id on public.somoslamickey_ciclos(cliente_id);
create index idx_somoslamickey_compras_cliente_id on public.somoslamickey_compras(cliente_id);
create index idx_somoslamickey_compras_fecha on public.somoslamickey_compras(fecha desc);
create index idx_somoslamickey_promociones_activa on public.somoslamickey_promociones(activa);

insert into public.somoslamickey_configuracion (slug_app, nombre_negocio, porcentaje_efectivo, porcentaje_tarjeta, umbral_compras)
values ('somos-la-mickey', 'Somos la Mickey', 10, 5, 15);

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
  on conflict (id) do update
    set email = excluded.email;

  -- Si existe un cliente legacy con el mismo email, lo vinculamos al auth user.
  update public.somoslamickey_clientes
  set
    auth_user_id = new.id,
    nombre = coalesce(nullif(trim(nombre), ''), initcap(replace(derived_name, '.', ' '))),
    activo = true
  where email = new.email
    and (auth_user_id is null or auth_user_id <> new.id);

  insert into public.somoslamickey_clientes (auth_user_id, email, nombre, fecha_alta, activo)
  values (new.id, new.email, initcap(replace(derived_name, '.', ' ')), current_date, true)
  on conflict (auth_user_id) do update
    set
      email = excluded.email,
      nombre = coalesce(nullif(trim(somoslamickey_clientes.nombre), ''), excluded.nombre),
      activo = true;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.somoslamickey_profiles enable row level security;
alter table public.somoslamickey_clientes enable row level security;
alter table public.somoslamickey_configuracion enable row level security;
alter table public.somoslamickey_ciclos enable row level security;
alter table public.somoslamickey_compras enable row level security;
alter table public.somoslamickey_promociones enable row level security;

create policy "profiles_select_self"
on public.somoslamickey_profiles for select
to authenticated
using (auth.uid() = id);

create policy "clientes_select_self_or_admin"
on public.somoslamickey_clientes for select
to authenticated
using (
  auth.uid() = auth_user_id
  or exists (
    select 1 from public.somoslamickey_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "configuracion_read_authenticated"
on public.somoslamickey_configuracion for select
to authenticated
using (true);

create policy "ciclos_select_self_or_admin"
on public.somoslamickey_ciclos for select
to authenticated
using (
  exists (
    select 1 from public.somoslamickey_clientes c
    where c.id = somoslamickey_ciclos.cliente_id and c.auth_user_id = auth.uid()
  )
  or exists (
    select 1 from public.somoslamickey_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "compras_select_self_or_admin"
on public.somoslamickey_compras for select
to authenticated
using (
  exists (
    select 1 from public.somoslamickey_clientes c
    where c.id = somoslamickey_compras.cliente_id and c.auth_user_id = auth.uid()
  )
  or exists (
    select 1 from public.somoslamickey_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "promociones_read_authenticated"
on public.somoslamickey_promociones for select
to authenticated
using (true);
