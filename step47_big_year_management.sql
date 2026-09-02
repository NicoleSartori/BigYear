-- BIGYEAR - STEP 47
-- Gestione uscita dal Big Year / eliminazione per tutti

create or replace function public.leave_big_year(p_big_year_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_membership public.big_year_participants;
    v_next public.big_year_participants;
begin
    if v_user_id is null then
        raise exception 'Non autenticato';
    end if;

    select * into v_membership
    from public.big_year_participants
    where big_year_id = p_big_year_id
      and account_id = v_user_id
      and status = 'accepted'
    order by accepted_at nulls last, invited_at nulls last
    limit 1;

    if not found then
        raise exception 'Non risulti partecipante a questo Big Year';
    end if;

    if v_membership.role = 'owner' then
        select * into v_next
        from public.big_year_participants
        where big_year_id = p_big_year_id
          and account_id is not null
          and account_id <> v_user_id
          and status = 'accepted'
        order by accepted_at nulls last, invited_at nulls last
        limit 1;

        if not found then
            raise exception 'Sei l''unico partecipante: per chiudere questo Big Year usa "Elimina il Big Year per tutti".';
        end if;

        update public.big_years
        set owner_id = v_next.account_id
        where id = p_big_year_id;

        update public.big_year_participants
        set role = 'member'
        where id = v_membership.id;

        update public.big_year_participants
        set role = 'owner'
        where id = v_next.id;
    end if;

    delete from public.big_year_participants
    where id = v_membership.id;

    return jsonb_build_object(
        'big_year_id', p_big_year_id,
        'left', true,
        'new_owner_id', case when v_membership.role = 'owner' then v_next.account_id else null end
    );
end;
$$;

grant execute on function public.leave_big_year(uuid) to authenticated;

create or replace function public.delete_big_year(p_big_year_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_owner_id uuid;
begin
    if v_user_id is null then
        raise exception 'Non autenticato';
    end if;

    select owner_id into v_owner_id
    from public.big_years
    where id = p_big_year_id;

    if v_owner_id is null then
        raise exception 'Big Year non trovato';
    end if;

    if v_owner_id <> v_user_id then
        raise exception 'Solo l''amministratore può eliminare questo Big Year';
    end if;

    -- Eliminazione esplicita, così non dipendiamo dal comportamento delle FK.
    delete from public.observations where big_year_id = p_big_year_id;
    delete from public.big_year_participants where big_year_id = p_big_year_id;
    delete from public.big_years where id = p_big_year_id;

    return jsonb_build_object(
        'big_year_id', p_big_year_id,
        'deleted', true
    );
end;
$$;

grant execute on function public.delete_big_year(uuid) to authenticated;
