-- Admins no deben tener fila en somoslamickey_clientes (no son socios).

delete from public.somoslamickey_clientes c
using public.somoslamickey_profiles p
where c.auth_user_id = p.id
  and p.role = 'admin';

drop trigger if exists on_profile_role_admin on public.somoslamickey_profiles;
drop function if exists public.handle_profile_admin_drop_cliente();

create or replace function public.handle_profile_admin_drop_cliente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'admin' and old.role is distinct from new.role then
    delete from public.somoslamickey_clientes where auth_user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_profile_role_admin
after update of role on public.somoslamickey_profiles
for each row
execute procedure public.handle_profile_admin_drop_cliente();
