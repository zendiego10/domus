-- 001_complete_task.sql · ADR-003 (problema P2)
-- Completar una tarea pasa a ser una sola transacción en la base de datos.

-- 1. El historial se relaciona con la tarea por su id, no por su título.
--    Los registros antiguos quedan con task_id vacío; los nuevos ya lo traen.
alter table public.activity_log
  add column if not exists task_id bigint references public.tasks (id) on delete set null;

create index if not exists idx_activity_task on public.activity_log (task_id);

-- 2. Función transaccional: actualiza la tarea y registra el historial.
--    Si cualquiera de las dos escrituras falla, PostgreSQL deshace ambas.
create or replace function public.complete_task(p_task_id bigint)
returns public.tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_task public.tasks;
begin
  -- Bloquea la fila: dos peticiones al mismo tiempo no pueden completarla dos veces.
  select * into v_task from public.tasks where id = p_task_id for update;

  if not found then
    raise exception 'TASK_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Se revisa el estado con la fila ya bloqueada (el permiso por rol lo valida la API).
  if v_task.status <> 'pending' then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  update public.tasks
     set status = 'completed', completed_at = now()
   where id = p_task_id
  returning * into v_task;

  insert into public.activity_log (parent_id, child_id, task_id, action, points)
  values (v_task.parent_id, v_task.child_id, v_task.id, v_task.title, v_task.points);

  return v_task;
end;
$$;

-- 3. Solo el servidor (llave de servicio) puede ejecutarla; la llave pública no.
revoke execute on function public.complete_task(bigint) from public, anon, authenticated;
grant execute on function public.complete_task(bigint) to service_role;