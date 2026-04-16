-- Fecha de nacimiento del socio (registro self-service o admin).
alter table public.somoslamickey_clientes
  add column if not exists fecha_nacimiento date;

comment on column public.somoslamickey_clientes.fecha_nacimiento is 'Fecha de nacimiento; opcional para filas históricas o alta solo por admin.';
