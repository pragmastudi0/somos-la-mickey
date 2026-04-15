alter table if exists public.configuracion
add column if not exists slug_app text;

update public.configuracion
set slug_app = 'somos-la-mickey'
where slug_app is null or trim(slug_app) = '';

alter table public.configuracion
alter column slug_app set default 'somos-la-mickey';

alter table public.configuracion
alter column slug_app set not null;
