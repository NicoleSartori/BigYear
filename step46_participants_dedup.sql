-- BigYear Step 46 - partecipanti: pulizia duplicati + vincoli anti-duplicato
-- NOTA: big_year_participants NON ha una colonna created_at.

begin;

-- 1) Per account_id valorizzato: mantieni una sola riga per Big Year + account.
-- Preferisci una riga accepted rispetto a pending; a parità, quella con accepted_at/invited_at più vecchia.
with ranked as (
    select
        id,
        row_number() over (
            partition by big_year_id, account_id
            order by
                case when status = 'accepted' then 0 else 1 end,
                accepted_at asc nulls last,
                invited_at asc nulls last,
                id asc
        ) as rn
    from public.big_year_participants
    where account_id is not null
)
delete from public.big_year_participants p
using ranked r
where p.id = r.id
  and r.rn > 1;

-- 2) Per inviti ancora pendenti senza account_id: mantieni una sola riga
-- per Big Year + email.
with ranked as (
    select
        id,
        row_number() over (
            partition by big_year_id, lower(trim(email))
            order by
                invited_at asc nulls last,
                id asc
        ) as rn
    from public.big_year_participants
    where account_id is null
      and status = 'pending'
      and nullif(trim(email), '') is not null
)
delete from public.big_year_participants p
using ranked r
where p.id = r.id
  and r.rn > 1;

-- 3) Impedisci nuovi duplicati dello stesso account nello stesso Big Year.
create unique index if not exists big_year_participants_big_year_account_uidx
    on public.big_year_participants (big_year_id, account_id)
    where account_id is not null;

-- 4) Impedisci duplicati di inviti pendenti alla stessa email nello stesso Big Year.
create unique index if not exists big_year_participants_pending_email_uidx
    on public.big_year_participants (big_year_id, lower(trim(email)))
    where status = 'pending'
      and account_id is null
      and nullif(trim(email), '') is not null;

commit;
