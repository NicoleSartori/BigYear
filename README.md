# BigYear — Step 53

## Lifecycle rules
- Un solo Big Year corrente per account: il più recente tra quelli in programma o attivi.
- I Big Year conclusi restano consultabili nello storico.
- La Home mantiene la sua struttura estetica e mostra solo un piccolo stato informativo del Big Year selezionato.
- Un Big Year concluso può essere consultato e le sue impostazioni possono essere corrette dall'amministratore, ma non accetta nuove osservazioni.
- Un Big Year in programma non accetta osservazioni prima della data di inizio.
- Le osservazioni fuori periodo possono essere conservate ma non contano nel Big Year.
- La creazione/modifica non può introdurre un secondo Big Year corrente; il database applica inoltre un trigger di sicurezza.
- L'eliminazione di un Big Year rimuove quel solo progetto dalla cache locale e seleziona il successivo progetto valido, senza lasciare il progetto eliminato nello storico locale.

## Supabase
Run once: `step49_big_year_current_rules.sql` in Supabase SQL Editor, without deleting previous lifecycle/auth SQL.

## Step 50
- The account's public display name is the name chosen at registration; email remains an authentication/contact field.
- Users can accept an invitation to another current Big Year only when they are not already participating in another current Big Year.
- A concluded Big Year remains available while its owner can open its settings and use the in-app “Partecipa a un Big Year” action.


## Step 53 — observer persistence hardening
- Observer account IDs are resolved from participant identity before an observation is synchronized.
- Cloud synchronization also resolves stale local observer references against the authoritative participant rows.
- Observation deletion removes the cloud row before deleting the local copy, preventing deleted observations from returning on the next sync.
- The local project history cache is cleared when changing account, preventing cross-account history leakage and false “current Big Year already exists” conflicts.
- The checklist/map date formatter is unified so date-only and date+time views use the same implementation.
- The distributable archive includes the required `assets/` directory and `species.json`.
