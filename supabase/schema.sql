-- Legacy Group – database Supabase
-- Come usarlo: Supabase → SQL Editor → New query → incolla tutto questo file → Run.
-- Si può rieseguire: non cancella dati già inseriti.

-- ---------------------------------------------------------------- tabelle
create table if not exists public.classi (
  classe  text primary key check (classe ~ '^[1-5][A-Z]{1,2}$'),
  squadra text not null check (squadra in ('componidori','mamuthones','eleonora','giganti','shardana','mariano-iv'))
);

create table if not exists public.attivita (
  id          bigint generated always as identity primary key,
  data        date not null,
  data_fine   date check (data_fine is null or data_fine >= data),
  titolo      text not null check (length(trim(titolo)) > 0),
  tipo        text not null default '',
  descrizione text not null default '',
  annullata   boolean not null default false,
  pubblicata  boolean not null default false,  -- false = bozza, non visibile sul sito
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- squadra vincitrice scelta dagli organizzatori (facoltativa; se vuota vince chi ha più punti)
alter table public.attivita add column if not exists vincitore text
  check (vincitore is null or vincitore in ('componidori','mamuthones','eleonora','giganti','shardana','mariano-iv'));

create table if not exists public.punti (
  id          bigint generated always as identity primary key,
  attivita_id bigint not null references public.attivita(id) on delete cascade,
  classe      text not null references public.classi(classe) on update cascade,
  punti       integer not null check (punti between -1000 and 1000),
  tipo        text not null check (tipo in ('collettiva','individuale')),
  created_at  timestamptz not null default now()
);
create index if not exists punti_attivita_idx on public.punti(attivita_id);

create table if not exists public.registro (
  id        bigint generated always as identity primary key,
  quando    timestamptz not null default now(),
  utente    text,
  azione    text not null,      -- INSERT / UPDATE / DELETE
  tabella   text not null,
  record_id text,
  prima     jsonb,
  dopo      jsonb
);

-- ---------------------------------------------------------------- le 43 classi
insert into public.classi(classe, squadra) values
  ('1BS','componidori'),('2AS','componidori'),('2E','componidori'),('3CB','componidori'),('3F','componidori'),('4BB','componidori'),('5BS','componidori'),
  ('1AS','mamuthones'),('1C','mamuthones'),('2D','mamuthones'),('3E','mamuthones'),('4CB','mamuthones'),('4CS','mamuthones'),('5AS','mamuthones'),
  ('1A','eleonora'),('1D','eleonora'),('2F','eleonora'),('3CS','eleonora'),('4F','eleonora'),('5A','eleonora'),('5BB','eleonora'),
  ('1CS','giganti'),('1F','giganti'),('2CB','giganti'),('3BB','giganti'),('3G','giganti'),('4A','giganti'),('4AS','giganti'),('5E','giganti'),
  ('1BB','shardana'),('2A','shardana'),('2BS','shardana'),('3BS','shardana'),('3D','shardana'),('4E','shardana'),('5DB','shardana'),
  ('1E','mariano-iv'),('2BB','mariano-iv'),('3A','mariano-iv'),('3AS','mariano-iv'),('4BS','mariano-iv'),('5G','mariano-iv'),('5H','mariano-iv')
on conflict (classe) do nothing;

-- Chi può scrivere: solo gli utenti con login la cui email è in questa lista.
create table if not exists public.organizzatori (
  email text primary key check (email = lower(email))
);

create or replace function public.is_organizzatore() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organizzatori o where o.email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- ---------------------------------------------------------------- registro automatico delle modifiche
create or replace function public.registra_modifica() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.registro(utente, azione, tabella, record_id, prima, dopo)
  values (
    coalesce(auth.jwt() ->> 'email', 'sistema'),
    tg_op,
    tg_table_name,
    coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id',
             (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'classe'),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create or replace function public.tocca_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists attivita_updated on public.attivita;
create trigger attivita_updated before update on public.attivita for each row execute function public.tocca_updated_at();

drop trigger if exists log_attivita on public.attivita;
create trigger log_attivita after insert or update or delete on public.attivita for each row execute function public.registra_modifica();
drop trigger if exists log_punti on public.punti;
create trigger log_punti after insert or update or delete on public.punti for each row execute function public.registra_modifica();
drop trigger if exists log_classi on public.classi;
create trigger log_classi after insert or update or delete on public.classi for each row execute function public.registra_modifica();

-- ---------------------------------------------------------------- sicurezza (Row Level Security)
-- Il pubblico (sito) legge solo le attività pubblicate e i loro punti.
-- Scrivono solo gli organizzatori: utenti con login E email nella tabella "organizzatori".
alter table public.classi   enable row level security;
alter table public.attivita enable row level security;
alter table public.punti    enable row level security;
alter table public.registro enable row level security;
alter table public.organizzatori enable row level security;
drop policy if exists organizzatori_lettura on public.organizzatori;
create policy organizzatori_lettura on public.organizzatori for select to authenticated using (public.is_organizzatore());

drop policy if exists classi_lettura on public.classi;
create policy classi_lettura on public.classi for select using (true);
drop policy if exists classi_scrittura on public.classi;
create policy classi_scrittura on public.classi for all to authenticated using (public.is_organizzatore()) with check (public.is_organizzatore());

drop policy if exists attivita_lettura on public.attivita;
create policy attivita_lettura on public.attivita for select using (pubblicata or public.is_organizzatore());
drop policy if exists attivita_scrittura on public.attivita;
create policy attivita_scrittura on public.attivita for all to authenticated using (public.is_organizzatore()) with check (public.is_organizzatore());

drop policy if exists punti_lettura on public.punti;
create policy punti_lettura on public.punti for select using (
  public.is_organizzatore()
  or exists (select 1 from public.attivita a where a.id = attivita_id and a.pubblicata)
);
drop policy if exists punti_scrittura on public.punti;
create policy punti_scrittura on public.punti for all to authenticated using (public.is_organizzatore()) with check (public.is_organizzatore());

drop policy if exists registro_lettura on public.registro;
create policy registro_lettura on public.registro for select to authenticated using (public.is_organizzatore());



-- ---------------------------------------------------------------- organizzatori
-- Ogni utente creato dal pannello Supabase (Authentication → Users → Add user) diventa organizzatore.
-- Le iscrizioni libere vanno disattivate (Authentication → Sign In / Providers → Allow new users to sign up: OFF),
-- così gli utenti li crea solo chi gestisce il progetto.
create or replace function public.nuovo_organizzatore() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is not null then
    insert into public.organizzatori(email) values (lower(new.email)) on conflict do nothing;
  end if;
  return new;
end $$;

do $$
begin
  if to_regclass('auth.users') is not null then
    execute 'drop trigger if exists organizzatore_da_utente on auth.users';
    execute 'create trigger organizzatore_da_utente after insert on auth.users for each row execute function public.nuovo_organizzatore()';
    insert into public.organizzatori(email) select lower(email) from auth.users where email is not null on conflict do nothing;
  end if;
end $$;

-- Per togliere un organizzatore: delete from public.organizzatori where email = '...';

-- ---------------------------------------------------------------- blocco dei tentativi sul PIN
-- Dopo 5 PIN sbagliati dallo stesso dispositivo (impronta dell'indirizzo IP, mai l'IP in chiaro)
-- l'ingresso è bloccato per 15 minuti. La tabella non è leggibile da nessuno: si usa solo con queste funzioni.
create table if not exists public.pin_tentativi (
  chiave text primary key check (chiave ~ '^[0-9a-f]{64}$'),
  falliti int not null default 0,
  ultimo timestamptz not null default now(),
  bloccato_fino timestamptz
);
alter table public.pin_tentativi enable row level security;
revoke all on public.pin_tentativi from anon, authenticated;

-- fino a quando è bloccato (null = libero)
create or replace function public.pin_bloccato(k text) returns timestamptz
language sql stable security definer set search_path = public as $$
  select bloccato_fino from public.pin_tentativi where chiave = k and bloccato_fino > now()
$$;

-- registra un PIN sbagliato; restituisce i tentativi rimasti (0 = appena bloccato)
create or replace function public.pin_errore(k text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if k !~ '^[0-9a-f]{64}$' then raise exception 'chiave non valida'; end if;
  delete from public.pin_tentativi where ultimo < now() - interval '1 day';
  insert into public.pin_tentativi as t (chiave, falliti, ultimo) values (k, 1, now())
  on conflict (chiave) do update set
    falliti = case when t.ultimo < now() - interval '15 minutes' or t.bloccato_fino <= now() then 1 else t.falliti + 1 end,
    bloccato_fino = case when t.bloccato_fino <= now() then null else t.bloccato_fino end,
    ultimo = now()
  returning falliti into n;
  if n >= 5 then
    update public.pin_tentativi set bloccato_fino = now() + interval '15 minutes', falliti = 0 where chiave = k;
    return 0;
  end if;
  return 5 - n;
end $$;

-- PIN giusto: azzera il conteggio (solo l'organizzatore appena entrato)
create or replace function public.pin_azzera(k text) returns void
language sql security definer set search_path = public as $$
  delete from public.pin_tentativi where chiave = k and public.is_organizzatore()
$$;

revoke all on function public.pin_bloccato(text), public.pin_errore(text), public.pin_azzera(text) from public;
grant execute on function public.pin_bloccato(text), public.pin_errore(text) to anon, authenticated;
revoke execute on function public.pin_azzera(text) from anon;
grant execute on function public.pin_azzera(text) to authenticated;
