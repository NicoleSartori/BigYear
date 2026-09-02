-- BIGYEAR - STEP 50
-- Public display names, invitation participation rules and profile visibility.
-- Run after the previous BigYear migrations.

-- Allow participants of the same Big Year to resolve each other's public name.
drop policy if exists "Profiles are visible to Big Year participants" on public.profiles;
create policy "Profiles are visible to Big Year participants"
on public.profiles
for select
to authenticated
using (
    id = auth.uid()
    or exists (
        select 1
        from public.big_year_participants p_me
        join public.big_year_participants p_other
          on p_other.big_year_id = p_me.big_year_id
        where p_me.account_id = auth.uid()
          and p_me.status = 'accepted'
          and p_other.account_id = profiles.id
          and p_other.status = 'accepted'
    )
);

-- Replace invitation acceptance with the definitive participation rules:
-- * an accepted account cannot participate in two current Big Years;
-- * a previously exited participant is reactivated instead of duplicated;
-- * the public display name comes from profiles, never from the email prefix.
create or replace function public.accept_big_year_invitation(p_join_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_email text := lower(coalesce(auth.email(), ''));
    v_display_name text;
    v_project public.big_years;
    v_participant public.big_year_participants;
begin
    if v_user_id is null then
        raise exception 'Non autenticato';
    end if;

    select p.display_name
      into v_display_name
      from public.profiles p
     where p.id = v_user_id;

    select *
      into v_project
      from public.big_years
     where upper(join_code) = upper(trim(p_join_code))
     limit 1;

    if not found then
        raise exception 'Codice Big Year non valido';
    end if;

    if v_project.end_date < current_date then
        raise exception 'Questo Big Year è già concluso e non accetta nuovi partecipanti';
    end if;

    if exists (
        select 1
          from public.big_year_participants p
          join public.big_years b on b.id = p.big_year_id
         where p.account_id = v_user_id
           and p.status = 'accepted'
           and b.id <> v_project.id
           and b.end_date >= current_date
    ) then
        raise exception 'Stai già partecipando a un Big Year in programma o attivo. Esci prima dal Big Year corrente.';
    end if;

    select *
      into v_participant
      from public.big_year_participants
     where big_year_id = v_project.id
       and status in ('pending', 'exited')
       and (
            account_id = v_user_id
            or lower(coalesce(email, '')) = v_email
       )
     order by
        case when account_id = v_user_id then 0 else 1 end,
        invited_at nulls last
     limit 1;

    if not found then
        raise exception 'Non risulta un invito per questo account';
    end if;

    update public.big_year_participants
       set account_id = v_user_id,
           display_name = coalesce(nullif(v_display_name, ''), display_name),
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

-- Keep the participant row's public name synchronized when an account's profile is updated.
create or replace function public.sync_profile_display_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.big_year_participants
       set display_name = new.display_name
     where account_id = new.id;
    return new;
end;
$$;

drop trigger if exists trg_sync_profile_display_name on public.profiles;
create trigger trg_sync_profile_display_name
after update of display_name on public.profiles
for each row
when (old.display_name is distinct from new.display_name)
execute function public.sync_profile_display_name();

grant execute on function public.sync_profile_display_name() to authenticated;
