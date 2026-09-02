-- BIGYEAR - STEP 51
-- Account profile editing + definitive account deletion.
-- Run once in Supabase SQL Editor after the previous BigYear migrations.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'Non autenticato';
    end if;

    -- Remove observations created by this account, including observations
    -- belonging to Big Years owned by somebody else.
    delete from public.observations
     where created_by = v_user_id;

    -- Remove friendships involving the account.
    delete from public.friendships
     where user_id = v_user_id
        or friend_id = v_user_id;

    -- Remove participant/invitation rows referencing the account.
    delete from public.big_year_participants
     where account_id = v_user_id
        or invited_by = v_user_id;

    -- Remove Big Years administered by the account. Their dependent rows
    -- are removed by the existing foreign-key relationships where defined.
    delete from public.big_years
     where owner_id = v_user_id;

    delete from public.profiles
     where id = v_user_id;

    delete from auth.users
     where id = v_user_id;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
