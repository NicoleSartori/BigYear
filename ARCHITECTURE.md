# BigYear technical architecture — Step 44

Step 40 is a technical refactor of Step 39. The visual UI and feature behavior are intentionally kept as the baseline.

## Modules

- `app.js` — application orchestration, onboarding, observations, checklist, map and project flows.
- `friends.js` — Friends feature: participant selection and checklist comparisons.
- `storage.js` — single persistence adapter. It currently uses `localStorage`; a future Supabase adapter can replace it without changing feature code.
- `utils.js` — shared safe HTML escaping, key normalization and geographic distance calculation.
- `style.css` — existing visual layer; no redesign is introduced by the refactor.
- `index.html` — screen structure and module loading order.

## Dependency direction

`index.html` → `storage.js` / `utils.js` / `friends.js` → `app.js`

`friends.js` receives its application dependencies explicitly through `BigYearFriends.init(...)` instead of reaching into application variables directly. This makes the feature easier to test and migrate later.

## Persistence

All direct persistence calls in `app.js` now go through `BigYearStorage`. JSON parsing/serialization is centralized there as well.

The storage keys and current local prototype data model are unchanged.

### Step 42 — AppState

`state.js` contiene lo stato mutabile condiviso dell'interfaccia e delle funzionalità frontend. `app.js` orchestra le azioni e legge/modifica `window.AppState`, mentre `storage.js` rimane responsabile della persistenza.

Stato centralizzato attualmente:
- posizione selezionata;
- istanze della mappa e relativi layer/marker;
- timeout della ricerca;
- database delle specie caricato;
- specie selezionata;
- osservazione in modifica;
- area selezionata nella configurazione;
- mappa delle osservazioni.

Questo passaggio non cambia il modello dati né la UI: rende esplicito dove vive lo stato volatile e prepara il terreno per una successiva gestione più strutturata della navigazione e del backend.


## Step 44 — Supabase preparation

`supabase-client.js` introduce un unico client Supabase condiviso dall'applicazione. Il client usa la Publishable Key e abilita la persistenza della sessione tramite Supabase Auth.

Per questo step la persistenza applicativa continua intenzionalmente a passare da `BigYearStorage`/`localStorage`: non viene ancora effettuata alcuna migrazione dei dati e non vengono introdotte policy database premature.

La direzione prevista è: UI/app → repository/data-access → Supabase. Il passaggio a Supabase verrà effettuato dopo aver definito schema e Row Level Security, così da evitare di esporre dati tra account.


### Step 46

`auth.js` is the browser-side Supabase Auth boundary. `cloud.js` is the browser-side data synchronization boundary. UI code continues to use the existing local storage shape so the stable screens/features are not rewritten around asynchronous database calls.

The local cache is updated from Supabase after authentication; writes are persisted locally first and then synchronized online. RLS remains the server-side authorization boundary.

### Step 50 — identity and joining
Public participant names resolve from `profiles.display_name`; email is not used as the UI name. Invitation acceptance enforces one current Big Year per account. A concluded Big Year remains the historical/current view when no current project exists, and offers in-app participation in another Big Year.
