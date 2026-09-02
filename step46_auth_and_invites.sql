-- ==========================================
-- BIGYEAR - STEP 46
-- Authenticated invitation acceptance
-- ==========================================

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
    if v_user_id is null then
        raise exception 'Non autenticato';
    end if;

    select *
    into v_project
    from public.big_years
    where upper(join_code) = upper(trim(p_join_code))
    limit 1;

    if not found then
        raise exception 'Codice Big Year non valido';
    end if;

    select *
    into v_participant
    from public.big_year_participants
    where big_year_id = v_project.id
      and status = 'pending'
      and (
          account_id = v_user_id
          or lower(coalesce(email, '')) = v_email
      )
    order by invited_at nulls last
    limit 1;

    if not found then
        raise exception 'Non risulta un invito per questo account';
    end if;

    update public.big_year_participants
    set
        account_id = v_user_id,
        display_name = coalesce(nullif(display_name, ''), split_part(coalesce(auth.email(), ''), '@', 1)),
        status = 'accepted',
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

create or replace function public.get_big_year_invitation(p_join_code text)
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
    if v_user_id is null then
        raise exception 'Non autenticato';
    end if;

    select *
    into v_project
    from public.big_years
    where upper(join_code) = upper(trim(p_join_code))
    limit 1;

    if not found then
        return null;
    end if;

    select *
    into v_participant
    from public.big_year_participants
    where big_year_id = v_project.id
      and status = 'pending'
      and (
          account_id = v_user_id
          or lower(coalesce(email, '')) = v_email
      )
    order by invited_at nulls last
    limit 1;

    if not found then
        return null;
    end if;

    return jsonb_build_object(
        'big_year_id', v_project.id,
        'join_code', v_project.join_code,
        'name', v_project.name,
        'area', v_project.area,
        'start_date', v_project.start_date,
        'end_date', v_project.end_date,
        'invited_email', v_participant.email
    );
end;
$$;

grant execute on function public.get_big_year_invitation(text) to authenticated;
