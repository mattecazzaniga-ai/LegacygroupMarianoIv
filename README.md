# Legacy Group – Mariano Quarto 2026/27

Sito pubblico della competizione tra le 6 squadre e le 43 classi dell'Istituto Mariano IV di Oristano.

- I dati stanno in **un Google Sheet**. Il sito lo rilegge **ogni 60 secondi**.
- Sul sito compaiono solo **sigle di classe e squadre**, mai nomi di studenti.
- Gratis: piano Hobby di Vercel e Google Sheets. Niente account per chi consulta, niente pubblicità, niente tracker.

---

## 1. Inserire i punti: area organizzatori (Supabase)

I punti si inseriscono da **`/admin`** (anche dal telefono), con login.
Le attività nascono come **bozza** (non visibili). Quando le pubblichi, il sito si aggiorna **subito**.
Ogni modifica finisce nel **registro modifiche**, con chi l'ha fatta e quando.

### Configurazione (una volta sola, circa 10 minuti, gratis)
1. Vai su [supabase.com](https://supabase.com) → **Start your project** → accedi con GitHub.
2. **New project**: nome `legacy-group`, region **Central EU (Frankfurt)**, genera e salva la password del database → **Create new project**. Attendi 1-2 minuti.
3. Menu a sinistra **SQL Editor** → **New query** → incolla tutto il file `supabase/schema.sql` di questo repository → **Run**. Crea le tabelle, le regole di sicurezza, il registro e le 43 classi.
4. (Automatico) Ogni utente creato al punto 6 diventa organizzatore. Per toglierne uno: `delete from public.organizzatori where email = '...';`
5. **Authentication → Sign In / Providers**: disattiva **Allow new users to sign up** (nessuno può registrarsi da solo).
6. **Authentication → Users → Add user → Create new user**: email e password dell'organizzatore, spunta **Auto Confirm User**.
7. **Project Settings → Data API** (o **API Keys**): copia **Project URL** e la chiave **anon public** (non la `service_role`).
8. Su Vercel → progetto → **Settings → Environment Variables** aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chiave anon public
   - `ADMIN_PIN` = il PIN per entrare nell'area organizzatori (tipo **Sensitive**)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` = email e password dell'utente creato al punto 6 (tipo **Sensitive**: nessuno le digita, le usa solo il server)
   poi **Deployments → ⋯ → Redeploy**.
9. Apri `https://IL-TUO-SITO/admin` e inserisci il PIN. L'accesso dura finché non chiudi il browser (massimo 2 ore).

**Cambiare il PIN:** Vercel → Settings → Environment Variables → `ADMIN_PIN` → Edit → Redeploy. Le sessioni aperte si chiudono.

Note:
- La chiave **anon** può stare nel sito: le regole del database fanno vedere al pubblico solo le attività pubblicate e fanno scrivere solo gli organizzatori in lista.
- Il piano gratuito mette in pausa un progetto senza attività per 7 giorni; finché il sito viene visitato resta attivo. Se capita, il sito mostra l'ultima versione salvata e il progetto si riattiva dal pannello Supabase (**Restore**).
- Classi e squadre si cambiano in Supabase → **Table Editor → classi**.
- Se Supabase è configurato, il foglio Google non viene più letto.

### Uso quotidiano
1. `/admin` → **+ Nuova attività**: titolo, data, tipo → **Crea come bozza**.
2. **Aggiungi punti**: scegli la classe, i punti e se sono collettivi o individuali. Con **+ Altra classe** inserisci tutta la classifica di una sfida in un colpo solo → **Salva punti**.
3. **Pubblica sul sito**. Per correggere: elimina la riga sbagliata (✕) e reinseriscila, oppure **Rimetti in bozza**.
4. **Segna come annullata**: l'attività resta nel calendario come annullata e i suoi punti non contano.
5. **Squadra vincitrice**: scegline una solo per le sfide che prevedono un vincitore (tornei, quizzoni…). Lasciala su "Nessuna" per i punti di collaborazione o aiuto. La vincitrice compare in Hall of Fame, calendario, scontri diretti e nel riconoscimento "Dominatore"; non cambia la classifica.
6. **A fine stagione**: aggiungi la vincitrice all'albo d'oro in `lib/config.ts` (lista `ALBO`), così resta anche nelle edizioni successive.

---

## 1-bis. In alternativa: il foglio Google

(una volta sola)

### Crearlo
1. Apri [sheets.google.com](https://sheets.google.com) → **File → Importa → Carica** e scegli `modello/LegacyGroup_foglio.xlsx` da questo repository.
2. Nella finestra scegli **"Sostituisci foglio di lavoro"** → **Importa dati**.
3. Trovi tre fogli: **Attivita**, **Punti**, **Classi**. Non cambiare i nomi delle colonne nella riga 1.
   Le note sulle intestazioni (triangolino nero) spiegano cosa scrivere.

### Pubblicarlo come CSV
1. **File → Condividi → Pubblica sul web**.
2. Nella prima tendina scegli il foglio **Attivita**, nella seconda **Valori separati da virgole (.csv)** → **Pubblica** → **OK**.
3. Copia il link che appare (finisce con `output=csv`). È il valore di `SHEET_ATTIVITA_CSV`.
4. Senza chiudere la finestra, cambia la prima tendina in **Punti** e copia il nuovo link (`SHEET_PUNTI_CSV`). Poi fai lo stesso con **Classi** (`SHEET_CLASSI_CSV`).
5. Lascia spuntato "Ripubblica automaticamente quando vengono apportate modifiche".

> Il link pubblicato rende leggibili quei tre fogli a chiunque abbia l'indirizzo. Nel foglio non devono mai esserci nomi di studenti: solo classi e punti.

---

## 2. Con il foglio Google: come aggiornare i punti

### Prima: crea l'attività nel foglio **Attivita**

| colonna | cosa scrivere | esempio |
|---|---|---|
| `id` | codice breve e **unico**, da non cambiare più | `a7` |
| `data` | giorno dell'attività | `12/12/2026` |
| `titolo` | nome che compare sul sito | `Torneo di calcetto` |
| `tipo` | tipologia (facoltativo) | `Sport` |
| `descrizione` | facoltativa, **mai nomi** | `Finale interclasse` |
| `stato` | vuoto (o `auto`) oppure `annullata` | |
| `data_fine` | solo se dura più giorni | `13/12/2026` |

Un'attività **senza punti** compare nel calendario come *programmata*, *in corso* o *conclusa* in base alle date.

### Poi: assegna i punti nel foglio **Punti**, una riga per ogni assegnazione

| `id_attivita` | `classe` | `punti` | `tipo` |
|---|---|---|---|
| `a7` | `3A` | `10` | `collettiva` |
| `a7` | `2E` | `8` | `collettiva` |
| `a7` | `4F` | `3` | `individuale` |

- `classe` e `id_attivita` si scelgono dai menu a tendina.
- `individuale` = punti vinti da uno studente. Il nome **non** si scrive mai: conta solo la classe.
- La squadra **non** va scritta: il sito la ricava dal foglio **Classi**.
- Ogni assegnazione si scrive **una volta sola**. Per correggerla, modifica o cancella la riga.
- Punti negativi (es. `-2`) = penalità.

Il sito si aggiorna entro **1 minuto**. Google però a volte aggiorna il CSV pubblicato con qualche minuto di ritardo (fino a ~5).

### Classi e squadre
Il foglio **Classi** è già compilato con le 43 classi. Se una classe cambia squadra o ne arriva una nuova, modifica qui: il sito si adegua.

### Controllare gli errori: `/controllo`
Apri `https://IL-TUO-SITO/controllo?token=IL-TUO-TOKEN`.
La pagina legge il foglio in quel momento ed elenca:
- **Errori**: righe che **non vengono contate** (classe inesistente, punti non numerici, id duplicato, data sbagliata, attività inesistente o annullata), con il **numero di riga** del foglio. Correggile e ricarica.
- **Avvisi**: righe contate ma da ricontrollare (doppia assegnazione collettiva, punti a zero o negativi, classi spostate).
- **Totali per squadra**, per confrontarli con il foglio.

Se il foglio non si legge (non pubblicato, colonne rinominate, Google irraggiungibile), il sito continua a mostrare **l'ultima versione valida**.

---

## 3. Come cambiare date e regole

Tutto sta in **`lib/config.ts`**. Su GitHub apri il file, clicca la **matita** (Edit), modifica e premi **Commit changes**. Vercel ripubblica da solo in circa un minuto.

| impostazione | a cosa serve |
|---|---|
| `startDate` | inizio della competizione (barra di avanzamento) |
| `endDate` | fine: countdown e, dal giorno dopo, modalità finale con la squadra vincitrice |
| `closed: true` | forza subito la modalità finale |
| `tiebreak` | spareggio a pari punti: `"ultima"` (più punti nell'ultima attività), `"attivita"` (punti in più attività), `"nessuno"` |

Le date in questo file si scrivono `AAAA-MM-GG` (es. `2027-06-08`).
Nome, colori e stemmi delle squadre stanno in `lib/teams.ts` e `public/loghi/`.

---

## 4. Pubblicazione su Vercel (gratis)

1. Vai su [vercel.com](https://vercel.com) → **Sign Up / Log In → Continue with GitHub**.
2. **Add New… → Project** → accanto a `legacygroupmarianoiv` clicca **Import**.
   Se il repository non compare: **Adjust GitHub App Permissions** e autorizza il repository.
3. Lascia tutto come proposto (Framework: **Next.js**). Apri **Environment Variables** e aggiungi:

   | Name | Value |
   |---|---|
   | `SHEET_ATTIVITA_CSV` | link CSV del foglio Attivita |
   | `SHEET_PUNTI_CSV` | link CSV del foglio Punti |
   | `SHEET_CLASSI_CSV` | link CSV del foglio Classi |
   | `CONTROLLO_TOKEN` | una parola segreta lunga a scelta (es. 20 lettere e numeri a caso) |
   | `NEXT_PUBLIC_SITE_URL` | l'indirizzo del sito, es. `https://legacy-group.vercel.app` (serve per le anteprime su WhatsApp) |

4. **Deploy**. Dopo circa 1 minuto il sito è online all'indirizzo `https://<nome-progetto>.vercel.app`.
5. Se l'indirizzo finale è diverso da quello messo in `NEXT_PUBLIC_SITE_URL`: **Settings → Environment Variables**, correggilo, poi **Deployments → ⋯ → Redeploy**.

Ogni modifica al codice su GitHub viene ripubblicata in automatico. **I punti non richiedono nessuna ripubblicazione**: basta il foglio.

Senza le variabili del foglio il sito funziona lo stesso e mostra tutto a 0.

---

## 5. Per sviluppatori

```bash
npm install
npm test               # test dei calcoli (Vitest)
npm run build          # build di produzione
LEGACY_FIXTURES=1 npm run build && npm start   # prova in locale con i dati di /fixtures (mai su Vercel)
node scripts/loghi.mjs # rigenera gli stemmi (estrae quelli originali se c'è index3.html nella cartella principale)
python3 scripts/modello.py  # rigenera il foglio modello .xlsx
```

Struttura:
- `lib/calc/` – tutti i calcoli come funzioni pure: classifica e pari merito, spareggio, variazioni (rispetto a prima dell'ultima giornata), storico, settimana, record, i 5 riconoscimenti (senza soglie di punti fisse), statistiche per punteggio variabile (media sulle attività con punti, quota media per sfida, punti per tipologia), scontri diretti, Legacy Moment, calendario.
- `lib/data/` – lettura e validazione del foglio.
- `app/` – pagine (Next.js App Router), rigenerate ogni 60 s.
- `components/` – interfaccia; grafici, statistiche, calendario, rivalità, menu e countdown sono le uniche parti eseguite nel browser.
- Pagine: Home (con la classifica generale), Squadre, Statistiche, Rivalità, Hall of Fame, Calendario, Regolamento. I vecchi indirizzi /classifica, /live e /attivita reindirizzano a Home e Calendario.
- `tests/` e `fixtures/` – test e dati di prova (mai usati dal sito pubblicato).
