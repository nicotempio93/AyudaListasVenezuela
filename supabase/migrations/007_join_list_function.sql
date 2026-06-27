create or replace function join_list(
  p_list_id        uuid,
  p_name           text,
  p_contact        text default null,
  p_whatsapp_group text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_status      text;
  v_range_start int;
  v_range_end   int;
  v_block_size  int;
  v_count       int;
  v_last_to     int;
  v_from        int;
  v_to          int;
  v_pid         uuid;
  v_joined_at   timestamptz;
begin
  perform pg_advisory_xact_lock(('x' || md5(p_list_id::text))::bit(64)::bigint);

  select status, range_start, range_end, block_size
  into v_status, v_range_start, v_range_end, v_block_size
  from lists where id = p_list_id;

  if not found then
    raise exception 'Lista no encontrada';
  end if;

  if v_status = 'completed' then
    raise exception 'Esta lista ya está completada';
  end if;

  select count(*) into v_count from participants where list_id = p_list_id;

  if v_count >= 10 then
    raise exception 'La lista ya tiene 10 participantes';
  end if;

  if v_range_start is not null and v_range_end is not null and v_block_size is not null then
    select coalesce(max(range_to), v_range_start - 1)
    into v_last_to
    from participants where list_id = p_list_id;

    v_from := v_last_to + 1;
    v_to   := least(v_from + v_block_size - 1, v_range_end);

    if v_from > v_range_end then
      raise exception 'Todos los registros ya están asignados';
    end if;
  end if;

  insert into participants (list_id, name, contact, range_from, range_to)
  values (p_list_id, p_name, p_contact, v_from, v_to)
  returning id, joined_at into v_pid, v_joined_at;

  if v_status = 'available' then
    update lists set status = 'claimed', claimed_at = now() where id = p_list_id;
  end if;

  if p_whatsapp_group is not null then
    update lists set whatsapp_group = p_whatsapp_group where id = p_list_id;
  end if;

  return json_build_object(
    'id',         v_pid,
    'list_id',    p_list_id,
    'name',       p_name,
    'contact',    p_contact,
    'range_from', v_from,
    'range_to',   v_to,
    'joined_at',  v_joined_at
  );
end;
$$;
