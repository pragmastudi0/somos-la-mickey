-- Persistir teléfono y fecha de nacimiento desde user_metadata al crear auth user.
-- Solo aplica a Somos la Mickey: si raw_user_meta_data.slug_app es otro valor, no toca tablas Mickey.
-- Las otras apps del mismo proyecto deben enviar su propio slug_app en signUp y (si aplica) otra rama aquí o otro trigger.
-- Compat: si slug_app viene vacío/null (altas viejas u orígenes sin metadata), se mantiene el comportamiento anterior (Mickey).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_name text;
  meta_tel text;
  meta_fn date;
  app_slug text;
begin
  app_slug := nullif(trim(new.raw_user_meta_data->>'slug_app'), '');

  if app_slug is not null and app_slug <> 'somos-la-mickey' then
    return new;
  end if;

  derived_name := coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1));
  meta_tel := nullif(trim(new.raw_user_meta_data->>'telefono'), '');

  if new.raw_user_meta_data->>'fecha_nacimiento' is not null
     and (new.raw_user_meta_data->>'fecha_nacimiento') ~ '^\d{4}-\d{2}-\d{2}$' then
    meta_fn := (new.raw_user_meta_data->>'fecha_nacimiento')::date;
  else
    meta_fn := null;
  end if;

  insert into public.somoslamickey_profiles (id, email, role)
  values (new.id, new.email, 'cliente')
  on conflict (id) do update
    set email = excluded.email;

  update public.somoslamickey_clientes
  set
    auth_user_id = new.id,
    nombre = coalesce(nullif(trim(nombre), ''), initcap(replace(derived_name, '.', ' '))),
    activo = true,
    telefono = coalesce(nullif(trim(telefono), ''), meta_tel),
    fecha_nacimiento = coalesce(fecha_nacimiento, meta_fn)
  where email = new.email
    and (auth_user_id is null or auth_user_id <> new.id);

  insert into public.somoslamickey_clientes (auth_user_id, email, nombre, fecha_alta, activo, telefono, fecha_nacimiento)
  values (
    new.id,
    new.email,
    initcap(replace(derived_name, '.', ' ')),
    current_date,
    true,
    meta_tel,
    meta_fn
  )
  on conflict (auth_user_id) do update
    set
      email = excluded.email,
      nombre = coalesce(nullif(trim(somoslamickey_clientes.nombre), ''), excluded.nombre),
      activo = true,
      telefono = coalesce(nullif(trim(somoslamickey_clientes.telefono), ''), excluded.telefono),
      fecha_nacimiento = coalesce(somoslamickey_clientes.fecha_nacimiento, excluded.fecha_nacimiento);

  return new;
end;
$$;
