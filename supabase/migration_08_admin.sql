-- FlowPub — panel de control (idempotente). Correr en el SQL Editor.
-- El rol admin lo otorga SOLO el servidor/SQL (los privilegios de columna de
-- migration_03 impiden auto-promoverse por la API). Aquí: Julio = admin.

update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = 'pentrexyl@gmail.com'
  and p.role <> 'admin';

-- Verificación: debe regresar 1 fila con role = 'admin'.
select p.username, p.role
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = 'pentrexyl@gmail.com';
