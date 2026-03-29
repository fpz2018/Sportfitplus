-- ============================================================
-- Sportfit Plus — Supabase Schema
-- Voer dit uit in de Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- Helper: controleer of huidige gebruiker admin is
-- Gebruikt plpgsql zodat de tabelreferentie pas bij uitvoering wordt gevalideerd
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return coalesce(
    (select role = 'admin' from public.user_profiles where id = auth.uid()),
    false
  );
end;
$$;

-- ============================================================
-- 1. USER_PROFILES
-- ============================================================
create table if not exists public.user_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  role                text not null default 'user' check (role in ('user', 'admin')),
  gender              text,
  age                 int,
  weight_kg           numeric(5,2),
  height_cm           int,
  activity_level      text,
  goal_group          text,
  tdee                int,
  target_calories     int,
  protein_target_g    int,
  carbs_target_g      int,
  fat_target_g        int,
  slaap_uren          numeric(4,1),
  stress_niveau       int,
  ai_welzijn_advies   text,
  is_premium          boolean not null default false,
  onboarding_complete boolean not null default false,
  full_name           text,
  avatar_url          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
create policy "Gebruiker ziet eigen profiel"    on public.user_profiles for select using (auth.uid() = id);
create policy "Gebruiker past eigen profiel aan" on public.user_profiles for update using (auth.uid() = id);
create policy "Profiel aanmaken bij registratie" on public.user_profiles for insert with check (auth.uid() = id);
create policy "Admin ziet alle profielen"        on public.user_profiles for select using (public.is_admin());

-- Trigger: maak profiel automatisch aan bij nieuwe gebruiker
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: updated_at automatisch bijwerken
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 2. FOOD
-- ============================================================
create table if not exists public.food (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  brand           text,
  category        text check (category in (
    'vlees_vis','zuivel_eieren','granen_brood','groenten','fruit',
    'noten_zaden','peulvruchten','vetten_olien','dranken','overig'
  )),
  calories        numeric(7,2) not null,
  protein_g       numeric(6,2) not null,
  carbs_g         numeric(6,2) not null,
  fat_g           numeric(6,2) not null,
  fiber_g         numeric(6,2),
  sugar_g         numeric(6,2),
  saturated_fat_g numeric(6,2),
  sodium_mg       numeric(7,2),
  source          text default 'handmatig' check (source in ('handmatig','openfoodfacts','nevo_rivm')),
  external_id     text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table public.food enable row level security;
create policy "Iedereen kan voedingsmiddelen lezen"     on public.food for select to authenticated using (true);
create policy "Gebruiker kan eigen voedingsmiddel aanmaken" on public.food for insert to authenticated with check (auth.uid() = created_by);
create policy "Gebruiker past eigen voedingsmiddel aan"    on public.food for update using (auth.uid() = created_by or public.is_admin());
create policy "Admin of eigenaar kan voedingsmiddel verwijderen" on public.food for delete using (auth.uid() = created_by or public.is_admin());

-- ============================================================
-- 3. FOOD_LOGS
-- ============================================================
create table if not exists public.food_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  log_date       date not null,
  meals          jsonb default '[]',
  extras         jsonb default '[]',
  total_calories numeric(7,2),
  total_protein_g numeric(6,2),
  total_carbs_g  numeric(6,2),
  total_fat_g    numeric(6,2),
  status         text default 'draft' check (status in ('draft','submitted')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.food_logs enable row level security;
create policy "Gebruiker ziet eigen voedingslog"        on public.food_logs for select using (auth.uid() = user_id);
create policy "Gebruiker maakt eigen voedingslog"       on public.food_logs for insert with check (auth.uid() = user_id);
create policy "Gebruiker past eigen voedingslog aan"    on public.food_logs for update using (auth.uid() = user_id);
create policy "Gebruiker verwijdert eigen voedingslog"  on public.food_logs for delete using (auth.uid() = user_id);

create trigger set_food_logs_updated_at
  before update on public.food_logs
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 4. RECIPES
-- ============================================================
create table if not exists public.recipes (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text,
  image_url            text,
  source_url           text,
  category             text check (category in ('ontbijt','lunch','diner','snack','dessert','smoothie')),
  prep_time_min        int,
  cook_time_min        int,
  servings             int,
  calories_per_serving numeric(7,2),
  protein_g            numeric(6,2),
  carbs_g              numeric(6,2),
  fat_g                numeric(6,2),
  ingredients          jsonb default '[]',
  instructions         jsonb default '[]',
  tags                 text[] default '{}',
  is_favorite          boolean default false,
  status               text default 'concept' check (status in ('concept','gepubliceerd')),
  created_by           uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.recipes enable row level security;
create policy "Gepubliceerde recepten zichtbaar voor iedereen" on public.recipes for select to authenticated using (status = 'gepubliceerd' or auth.uid() = created_by or public.is_admin());
create policy "Gebruiker maakt eigen recept"    on public.recipes for insert to authenticated with check (auth.uid() = created_by);
create policy "Eigenaar of admin past recept aan" on public.recipes for update using (auth.uid() = created_by or public.is_admin());
create policy "Eigenaar of admin verwijdert recept" on public.recipes for delete using (auth.uid() = created_by or public.is_admin());

create trigger set_recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 5. WEEK_MENUS
-- ============================================================
create table if not exists public.week_menus (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  datum           date not null,
  maaltijd_type   text not null,
  recept_id       uuid references public.recipes(id) on delete set null,
  recept_titel    text,
  recept_image_url text,
  calories        numeric(7,2),
  protein_g       numeric(6,2),
  carbs_g         numeric(6,2),
  fat_g           numeric(6,2),
  quantity        numeric(6,2),
  quantity_unit   text,
  notitie         text,
  created_at      timestamptz not null default now()
);

alter table public.week_menus enable row level security;
create policy "Gebruiker ziet eigen weekmenu"     on public.week_menus for select using (auth.uid() = user_id);
create policy "Gebruiker maakt eigen weekmenu"    on public.week_menus for insert with check (auth.uid() = user_id);
create policy "Gebruiker past eigen weekmenu aan" on public.week_menus for update using (auth.uid() = user_id);
create policy "Gebruiker verwijdert eigen weekmenu" on public.week_menus for delete using (auth.uid() = user_id);

-- ============================================================
-- 6. DAILY_LOGS
-- ============================================================
create table if not exists public.daily_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  log_date        date not null,
  weight_kg       numeric(5,2),
  steps           int,
  calories_eaten  int,
  protein_g       numeric(6,2),
  carbs_g         numeric(6,2),
  fat_g           numeric(6,2),
  training_done   boolean default false,
  training_type   text check (training_type in ('kracht','cardio_liss','cardio_hiit','rust')),
  water_ml        int,
  mood            text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.daily_logs enable row level security;
create policy "Gebruiker ziet eigen daglog"        on public.daily_logs for select using (auth.uid() = user_id);
create policy "Gebruiker maakt eigen daglog"       on public.daily_logs for insert with check (auth.uid() = user_id);
create policy "Gebruiker past eigen daglog aan"    on public.daily_logs for update using (auth.uid() = user_id);
create policy "Gebruiker verwijdert eigen daglog"  on public.daily_logs for delete using (auth.uid() = user_id);

create trigger set_daily_logs_updated_at
  before update on public.daily_logs
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 7. HRV_LOGS
-- ============================================================
create table if not exists public.hrv_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  log_date         date not null,
  hrv_waarde       numeric(6,2) not null,
  energiescore     int,
  slaap_uren       numeric(4,1),
  stress_niveau    int check (stress_niveau between 1 and 10),
  herstel_gevoel   int check (herstel_gevoel between 1 and 10),
  training_ready   boolean default true,
  bron             text check (bron in ('handmatig','vragenlijst')),
  created_at       timestamptz not null default now()
);

alter table public.hrv_logs enable row level security;
create policy "Gebruiker ziet eigen HRV"        on public.hrv_logs for select using (auth.uid() = user_id);
create policy "Gebruiker maakt eigen HRV"       on public.hrv_logs for insert with check (auth.uid() = user_id);
create policy "Gebruiker past eigen HRV aan"    on public.hrv_logs for update using (auth.uid() = user_id);
create policy "Gebruiker verwijdert eigen HRV"  on public.hrv_logs for delete using (auth.uid() = user_id);

-- ============================================================
-- 8. SUPPLEMENTS
-- ============================================================
create table if not exists public.supplements (
  id             uuid primary key default gen_random_uuid(),
  naam           text not null,
  categorie      text,
  beschrijving   text,
  voordelen      text[] default '{}',
  dosering       text,
  timing         text,
  bijwerkingen   text,
  evidence_level text check (evidence_level in ('A','B','C','D')),
  doelgroepen    text[] default '{}',
  doelen         text[] default '{}',
  image_url      text,
  status         text default 'actief',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.supplements enable row level security;
create policy "Iedereen ziet supplementen"      on public.supplements for select to authenticated using (true);
create policy "Alleen admin beheert supplementen" on public.supplements for all using (public.is_admin());

create trigger set_supplements_updated_at
  before update on public.supplements
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 9. SUPPLEMENT_NIEUWS
-- ============================================================
create table if not exists public.supplement_nieuws (
  id              uuid primary key default gen_random_uuid(),
  titel           text not null,
  inhoud          text not null,
  slug            text unique,
  intro           text,
  categorie       text,
  status          text default 'concept' check (status in ('concept','gepubliceerd')),
  gepubliceerd_op timestamptz,
  afbeelding_url  text,
  seo_description text,
  evidence_level  text check (evidence_level in ('A','B','C','D')),
  bron_url        text,
  bron_naam       text,
  supplement_ids  uuid[] default '{}',
  created_at      timestamptz not null default now()
);

alter table public.supplement_nieuws enable row level security;
create policy "Gepubliceerd nieuws voor iedereen"   on public.supplement_nieuws for select to authenticated using (status = 'gepubliceerd' or public.is_admin());
create policy "Alleen admin beheert supplement nieuws" on public.supplement_nieuws for all using (public.is_admin());

-- ============================================================
-- 10. SUPPLEMENT_PRODUCTEN
-- ============================================================
create table if not exists public.supplement_producten (
  id                uuid primary key default gen_random_uuid(),
  naam              text not null,
  merk              text,
  supplement_id     uuid references public.supplements(id) on delete set null,
  type              text check (type in ('eigen_product','affiliate')),
  prijs             numeric(8,2),
  voorraad          int,
  affiliate_url     text,
  affiliate_partner text,
  categorie         text,
  featured          boolean default false,
  status            text default 'actief' check (status in ('actief','inactief')),
  beschrijving      text,
  image_url         text,
  created_at        timestamptz not null default now()
);

alter table public.supplement_producten enable row level security;
create policy "Actieve producten zichtbaar"    on public.supplement_producten for select to authenticated using (status = 'actief' or public.is_admin());
create policy "Alleen admin beheert producten" on public.supplement_producten for all using (public.is_admin());

-- ============================================================
-- 11. KENNIS_ARTIKELEN
-- ============================================================
create table if not exists public.kennis_artikelen (
  id              uuid primary key default gen_random_uuid(),
  pubmed_id       text,
  title_en        text not null,
  title_nl        text,
  abstract_en     text,
  abstract_nl     text,
  summary_en      text,
  summary_nl      text,
  authors         text[] default '{}',
  journal         text,
  published_date  date,
  url             text,
  category        text check (category in (
    'voeding','supplementen','training','welzijn','gewichtsverlies','overig'
  )),
  evidence_level  text check (evidence_level in ('A','B','C','D')),
  relevance_score int,
  status          text default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  review_notes    text,
  search_query    text,
  created_at      timestamptz not null default now()
);

alter table public.kennis_artikelen enable row level security;
create policy "Goedgekeurde artikelen voor iedereen" on public.kennis_artikelen for select to authenticated using (status = 'approved' or public.is_admin());
create policy "Alleen admin beheert artikelen"        on public.kennis_artikelen for all using (public.is_admin());

-- ============================================================
-- 12. KENNIS_ANALYSE_RUNS
-- ============================================================
create table if not exists public.kennis_analyse_runs (
  id                  uuid primary key default gen_random_uuid(),
  gestart_op          timestamptz not null default now(),
  afgerond_op         timestamptz,
  status              text not null default 'bezig',
  aantal_artikelen    int default 0,
  aantal_supplementen int default 0,
  aantal_inzichten    int default 0,
  fout_melding        text,
  samenvatting        text,
  created_at          timestamptz not null default now()
);

alter table public.kennis_analyse_runs enable row level security;
create policy "Alleen admin ziet analyse runs" on public.kennis_analyse_runs for all using (public.is_admin());

-- ============================================================
-- 13. WIJZIGINGS_VOORSTELLEN
-- ============================================================
create table if not exists public.wijzigings_voorstellen (
  id                  uuid primary key default gen_random_uuid(),
  bron_type           text not null,
  bron_naam           text,
  bron_url            text,
  entity_naam         text,
  record_id           uuid,
  veld_naam           text not null,
  huidige_waarde      text,
  voorgestelde_waarde text not null,
  onderbouwing_nl     text,
  onderbouwing_en     text,
  betrouwbaarheid     int check (betrouwbaarheid between 0 and 100),
  status              text default 'pending' check (status in ('pending','approved','rejected','applied')),
  reviewed_by         uuid references auth.users(id) on delete set null,
  reviewed_at         timestamptz,
  applied_at          timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.wijzigings_voorstellen enable row level security;
create policy "Alleen admin beheert voorstellen" on public.wijzigings_voorstellen for all using (public.is_admin());

-- ============================================================
-- 14. BRON_BESTANDEN
-- ============================================================
create table if not exists public.bron_bestanden (
  id               uuid primary key default gen_random_uuid(),
  naam             text not null,
  type             text not null check (type in ('pdf','youtube','url','google_drive')),
  file_url         text,
  status           text default 'wachten' check (status in ('wachten','verwerken','klaar','fout')),
  error_message    text,
  verwerkt_op      timestamptz,
  aantal_voorstellen int default 0,
  created_at       timestamptz not null default now()
);

alter table public.bron_bestanden enable row level security;
create policy "Alleen admin beheert bronbestanden" on public.bron_bestanden for all using (public.is_admin());

-- ============================================================
-- 15. APP_INZICHTEN
-- ============================================================
create table if not exists public.app_inzichten (
  id                  uuid primary key default gen_random_uuid(),
  domein              text not null,
  titel               text not null,
  samenvatting        text,
  huidige_waarde      text,
  aanbevolen_wijziging text,
  onderbouwing        text,
  bron_artikelen      uuid[] default '{}',
  prioriteit          text check (prioriteit in ('hoog','middel','laag')),
  status              text default 'nieuw' check (status in ('nieuw','bekeken','toegepast','afgewezen')),
  analyse_run_id      uuid references public.kennis_analyse_runs(id) on delete set null,
  created_at          timestamptz not null default now()
);

alter table public.app_inzichten enable row level security;
create policy "Alleen admin beheert inzichten" on public.app_inzichten for all using (public.is_admin());

-- ============================================================
-- 16. AUDIT_LOGS
-- ============================================================
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actie        text not null check (actie in (
    'pubmed_fetch','ai_samenvatting','bron_upload','ai_analyse',
    'voorstel_goedgekeurd','voorstel_afgewezen','voorstel_toegepast',
    'artikel_goedgekeurd','artikel_afgewezen'
  )),
  gebruiker    text,
  entity_naam  text,
  record_id    uuid,
  details      jsonb default '{}',
  created_at   timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
create policy "Alleen admin ziet auditlog" on public.audit_logs for all using (public.is_admin());

-- ============================================================
-- 17. CODE_TAKEN
-- ============================================================
create table if not exists public.code_taken (
  id              uuid primary key default gen_random_uuid(),
  titel           text not null,
  beschrijving    text,
  bestand         text,
  huidige_waarde  text,
  nieuwe_waarde   text,
  onderbouwing    text,
  prioriteit      text check (prioriteit in ('hoog','middel','laag')),
  status          text default 'open' check (status in ('open','gedaan')),
  inzicht_id      uuid references public.app_inzichten(id) on delete set null,
  voorstel_id     uuid references public.wijzigings_voorstellen(id) on delete set null,
  gedaan_op       timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.code_taken enable row level security;
create policy "Alleen admin beheert codetaken" on public.code_taken for all using (public.is_admin());

-- ============================================================
-- 18. NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  type              text not null check (type in (
    'training_update','nutrition_update','recipe_update','general'
  )),
  title             text not null,
  message           text,
  related_entity    text,
  related_entity_id uuid,
  link              text,
  read              boolean not null default false,
  source            text default 'in-app' check (source in ('in-app','email')),
  created_at        timestamptz not null default now()
);

alter table public.notifications enable row level security;
create policy "Gebruiker ziet eigen notificaties"        on public.notifications for select using (auth.uid() = user_id);
create policy "Gebruiker markeert eigen notificaties"    on public.notifications for update using (auth.uid() = user_id);
create policy "Gebruiker verwijdert eigen notificaties"  on public.notifications for delete using (auth.uid() = user_id);
create policy "Service role maakt notificaties aan"      on public.notifications for insert with check (true);

-- ============================================================
-- 19. NIEUWSBERICHTEN
-- ============================================================
create table if not exists public.nieuwsberichten (
  id              uuid primary key default gen_random_uuid(),
  titel           text not null,
  slug            text unique,
  intro           text,
  inhoud          text,
  categorie       text,
  bron_artikel_id uuid references public.kennis_artikelen(id) on delete set null,
  bron_pubmed_url text,
  status          text default 'concept' check (status in ('concept','gepubliceerd')),
  seo_description text,
  gepubliceerd_op timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.nieuwsberichten enable row level security;
create policy "Gepubliceerde berichten voor iedereen" on public.nieuwsberichten for select to authenticated using (status = 'gepubliceerd' or public.is_admin());
create policy "Alleen admin beheert nieuwsberichten"  on public.nieuwsberichten for all using (public.is_admin());

-- ============================================================
-- CUSTOM SCHEMAS (trainingsschema's per gebruiker)
-- ============================================================
create table if not exists public.custom_schemas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  naam        text not null,
  methode     text,
  days        jsonb default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.custom_schemas enable row level security;
create policy "Gebruiker ziet eigen schema's"  on public.custom_schemas for select using (auth.uid() = user_id);
create policy "Gebruiker maakt eigen schema"   on public.custom_schemas for insert with check (auth.uid() = user_id);
create policy "Gebruiker past eigen schema aan" on public.custom_schemas for update using (auth.uid() = user_id);
create policy "Gebruiker verwijdert eigen schema" on public.custom_schemas for delete using (auth.uid() = user_id);

create trigger set_custom_schemas_updated_at
  before update on public.custom_schemas
  for each row execute function public.set_updated_at();

-- ============================================================
-- WORKOUT LOGS (trainingsresultaten per dag)
-- ============================================================
create table if not exists public.workout_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null default current_date,
  dag_naam    text,
  oefeningen  jsonb default '[]'::jsonb,
  notities    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.workout_logs enable row level security;
create policy "Gebruiker ziet eigen workout logs"     on public.workout_logs for select using (auth.uid() = user_id);
create policy "Gebruiker maakt eigen workout log"     on public.workout_logs for insert with check (auth.uid() = user_id);
create policy "Gebruiker past eigen workout log aan"  on public.workout_logs for update using (auth.uid() = user_id);
create policy "Gebruiker verwijdert eigen workout log" on public.workout_logs for delete using (auth.uid() = user_id);

create trigger set_workout_logs_updated_at
  before update on public.workout_logs
  for each row execute function public.set_updated_at();

-- ============================================================
-- INDEXES voor performance
-- ============================================================
create index if not exists idx_daily_logs_user_date    on public.daily_logs (user_id, log_date desc);
create index if not exists idx_food_logs_user_date     on public.food_logs (user_id, log_date desc);
create index if not exists idx_week_menus_user_datum   on public.week_menus (user_id, datum);
create index if not exists idx_hrv_logs_user_date      on public.hrv_logs (user_id, log_date desc);
create index if not exists idx_notifications_user_read on public.notifications (user_id, read, created_at desc);
create index if not exists idx_food_name               on public.food using gin (to_tsvector('dutch', name));
create index if not exists idx_recipes_status          on public.recipes (status);
create index if not exists idx_kennis_status           on public.kennis_artikelen (status);
