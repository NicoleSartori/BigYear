-- BIGYEAR - STEP 48
-- Lifecycle, exited participants, admin transfer

-- Allow the explicit participant state used when someone leaves a Big Year.
do $$
declare
    c record;
begin
    for c in
        select conname
        from pg_constraint
        where conrelid = 'public.big_year_participants'::regclass
          and contype = 'c'
          and pg_get_constraintdef(oid) ilike '%status%'
    loop
        execute format('alter table public.big_year_participants drop constraint %I', c.conname);
    end loop;
end $$;

alter table public.big_year_participants
    add constraint big_year_participants_status_check
    check (status in ('pending', 'accepted', 'exited'));

-- Transfer administration explicitly before the current owner leaves.
create or replace function public.transfer_big_year_ownership(
    p_big_year_id uuid,
    p_new_owner_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_current_owner uuid;
    v_target public.big_year_participants;
begin
    if v_user_id is null then
        raise exception 'Non autenticato';
    end if;

    select owner_id into v_current_owner
    from public.big_years
    where id = p_big_year_id;

    if v_current_owner is null then
        raise exception 'Big Year non trovato';
    end if;

    if v_current_owner <> v_user_id then
        raise exception 'Solo l’amministratore può trasferire l’amministrazione';
    end if;

    select * into v_target
    from public.big_year_participants
    where big_year_id = p_big_year_id
      and account_id = p_new_owner_id
      and status = 'accepted'
    limit 1;

    if not found then
        raise exception 'Il nuovo amministratore deve essere un partecipante accettato';
    end if;

    update public.big_years
    set owner_id = p_new_owner_id
    where id = p_big_year_id;

    update public.big_year_participants
    set role = 'member'
    where big_year_id = p_big_year_id
      and account_id = v_user_id;

    update public.big_year_participants
    set role = 'owner'
    where id = v_target.id;

    return jsonb_build_object(
        'big_year_id', p_big_year_id,
        'new_owner_id', p_new_owner_id
    );
end;
$$;

grant execute on function public.transfer_big_year_ownership(uuid, uuid) to authenticated;

-- Leaving means changing the membership state, not deleting the participant row.
create or replace function public.leave_big_year(p_big_year_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_membership public.big_year_participants;
    v_owner_id uuid;
begin
    if v_user_id is null then
        raise exception 'Non autenticato';
    end if;

    select * into v_membership
    from public.big_year_participants
    where big_year_id = p_big_year_id
      and account_id = v_user_id
      and status = 'accepted'
    limit 1;

    if not found then
        raise exception 'Non risulti partecipante a questo Big Year';
    end if;

    select owner_id into v_owner_id
    from public.big_years
    where id = p_big_year_id;

    if v_owner_id = v_user_id then
        raise exception 'Prima di uscire devi trasferire l’amministrazione a un altro partecipante';
    end if;

    update public.big_year_participants
    set status = 'exited', role = 'member'
    where id = v_membership.id;

    return jsonb_build_object(
        'big_year_id', p_big_year_id,
        'left', true
    );
end;
$$;

grant execute on function public.leave_big_year(uuid) to authenticated;

-- If an exited participant is invited again, reactivate the existing membership instead of creating a duplicate.
create or replace function public.accept_big_year_invitation(p_join_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_email text := lower(coalesce(auth.email(), ''));
    v_project public.big_years;
    v_participant public.big_year_participants;
begin
    if v_user_id is null then raise exception 'Non autenticato'; end if;

    select * into v_project
    from public.big_years
    where upper(join_code) = upper(trim(p_join_code))
    limit 1;
    if not found then raise exception 'Codice Big Year non valido'; end if;

    select * into v_participant
    from public.big_year_participants
    where big_year_id = v_project.id
      and status in ('pending', 'exited')
      and (account_id = v_user_id or lower(coalesce(email, '')) = v_email)
    order by invited_at nulls last
    limit 1;
    if not found then raise exception 'Non risulta un invito per questo account'; end if;

    update public.big_year_participants
    set account_id = v_user_id,
        display_name = coalesce(nullif(display_name, ''), split_part(coalesce(auth.email(), ''), '@', 1)),
        status = 'accepted',
        role = 'member',
        accepted_at = now()
    where id = v_participant.id;

    return jsonb_build_object(
        'big_year_id', v_project.id,
        'join_code', v_project.join_code,
        'name', v_project.name,
        'area', v_project.area,
        'start_date', v_project.start_date,
        'end_date', v_project.end_date
    );
end;
$$;

grant execute on function public.accept_big_year_invitation(text) to authenticated;
