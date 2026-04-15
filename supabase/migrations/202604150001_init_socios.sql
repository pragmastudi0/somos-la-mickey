create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'cliente' check (role in ('admin', 'cliente')),
  created_at timestamptz not null default now()
);

create table if not exists public.clientes (
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

create table if not exists public.configuracion (
  id uuid primary key default gen_random_uuid(),
  nombre_negocio text not null default 'Somos la Mickey',
  porcentaje_efectivo numeric(5,2) not null default 10,
  porcentaje_tarjeta numeric(5,2) not null default 5,
  umbral_compras integer not null default 15,
  created_at timestamptz not null default now()
);

create table if not exists public.ciclos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  numero integer not null default 1,
  acum_reintegro numeric(12,2) not null default 0,
  compras_count integer not null default 0,
  puede_retirar boolean not null default false,
  retirado boolean not null default false,
  monto_retirado numeric(12,2),
  fecha_retiro date,
  created_at timestamptz not null default now()
);

create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  ciclo_id uuid references public.ciclos(id) on delete set null,
  ciclo_numero integer not null default 1,
  monto numeric(12,2) not null,
  metodo_pago text not null check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia')),
  porcentaje_aplicado numeric(5,2) not null,
  reintegro_generado numeric(12,2) not null default 0,
  fecha date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.promociones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  badge text,
  activa boolean not null default true,
  fecha_inicio date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_ciclos_cliente_id on public.ciclos(cliente_id);
create index if not exists idx_compras_cliente_id on public.compras(cliente_id);
create index if not exists idx_compras_fecha on public.compras(fecha desc);
create index if not exists idx_promociones_activa on public.promociones(activa);

insert into public.configuracion (nombre_negocio, porcentaje_efectivo, porcentaje_tarjeta, umbral_compras)
select 'Somos la Mickey', 10, 5, 15
where not exists (select 1 from public.configuracion);

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

  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'cliente')
  on conflict (id) do update set email = excluded.email;

  insert into public.clientes (auth_user_id, email, nombre, fecha_alta, activo)
  values (new.id, new.email, initcap(replace(derived_name, '.', ' ')), current_date, true)
  on conflict (auth_user_id) do update set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.configuracion enable row level security;
alter table public.ciclos enable row level security;
alter table public.compras enable row level security;
alter table public.promociones enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "clientes_select_self_or_admin" on public.clientes;
create policy "clientes_select_self_or_admin"
on public.clientes for select
to authenticated
using (
  auth.uid() = auth_user_id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "configuracion_read_authenticated" on public.configuracion;
create policy "configuracion_read_authenticated"
on public.configuracion for select
to authenticated
using (true);

drop policy if exists "ciclos_select_self_or_admin" on public.ciclos;
create policy "ciclos_select_self_or_admin"
on public.ciclos for select
to authenticated
using (
  exists (
    select 1 from public.clientes c
    where c.id = ciclos.cliente_id and c.auth_user_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "compras_select_self_or_admin" on public.compras;
create policy "compras_select_self_or_admin"
on public.compras for select
to authenticated
using (
  exists (
    select 1 from public.clientes c
    where c.id = compras.cliente_id and c.auth_user_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "promociones_read_authenticated" on public.promociones;
create policy "promociones_read_authenticated"
on public.promociones for select
to authenticated
using (true);
