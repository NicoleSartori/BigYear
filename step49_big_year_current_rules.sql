-- BIGYEAR - STEP 49
-- One current (planned/active) Big Year per account + lifecycle guard.
-- Historical/concluded Big Years remain available.

create or replace function public.prevent_multiple_current_big_years()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- A Big Year is "current" when its end date has not passed.
    -- This covers both planned and active projects.
    if new.owner_id is not null and new.end_date >= current_date then
        if exists (
            select 1
            from public.big_years other
            where other.owner_id = new.owner_id
              and other.id <> new.id
              and other.end_date >= current_date
        ) then
            raise exception 'Questo account ha già un Big Year in programma o attivo. Concludilo prima di iniziarne un altro.';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_prevent_multiple_current_big_years on public.big_years;

create trigger trg_prevent_multiple_current_big_years
before insert or update of owner_id, start_date, end_date
on public.big_years
for each row
execute function public.prevent_multiple_current_big_years();

grant execute on function public.prevent_multiple_current_big_years() to authenticated;
