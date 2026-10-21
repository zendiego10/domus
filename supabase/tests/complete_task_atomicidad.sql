-- Prueba del escenario de confiabilidad (arquitectura.md, sección 5.2).
-- Fuerza una falla en la segunda escritura de complete_task y comprueba
-- que la tarea no queda a medias. Al final lanza un error a propósito para
-- que TODO se deshaga: no deja cambios en la base de datos.
do $$
declare
  v_id bigint;
  v_status text;
  v_logs int;
begin
  select id into v_id from public.tasks where status = 'pending' order by id limit 1;
  if v_id is null then
    raise exception 'No hay tareas pendientes para probar';
  end if;

  -- Simula que la inserción en activity_log falla.
  alter table public.activity_log add constraint simular_falla check (false) not valid;

  begin
    perform public.complete_task(v_id);
  exception when others then
    null; -- se espera que falle
  end;

  select status into v_status from public.tasks where id = v_id;
  select count(*) into v_logs from public.activity_log where task_id = v_id;

  raise exception 'RESULTADO -> tarea %: estado = %, registros nuevos en activity_log = % (esperado: pending y 0)',
    v_id, v_status, v_logs;
end $$;