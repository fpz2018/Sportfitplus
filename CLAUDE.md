# Sportfit Plus — Projectcontext voor Claude

## Wat is dit project?
Sportfit Plus is een fitness/gezondheids-app voor sporters. Gebruikers kunnen voeding, training, supplementen, weekmenu's, recepten, welzijn en voortgang bijhouden. Er is ook een AI-laag voor menu-generatie, kennis-updates en een orthomoleculaire chat.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Radix UI (shadcn/ui componenten in `src/components/ui/`)
- **Database/Auth**: Supabase (`src/api/supabaseClient.js`)
- **Hosting + Serverless**: Netlify (`netlify/functions/`)
- **State/Data**: React Query (`src/lib/query-client.js`)
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`) via Netlify functions

## Migratie-geschiedenis
De app is omgezet van **Base44** naar **Supabase + Netlify**:
- `src/api/entities.js` = centrale data-laag die alle `base44.entities.*` aanroepen vervangt
- `src/api/netlifyClient.js` = wrapper voor Netlify function calls
- `src/api/base44Client.js` = nog aanwezig maar deprecated/legacy
- Database schema staat in `supabase/schema.sql`

## Structuur
```
src/
  api/          # Data-laag: entities.js (Supabase), netlifyClient.js, supabaseClient.js
  components/
    ui/          # shadcn/ui componenten (generiek)
    dashboard/   # Dashboard widgets
    voeding/     # Voeding/food components
    schemas/     # Trainingsschema's
    recepten/    # Recepten
    weekmenu/    # Weekmenu planner
    analytics/   # Correlatiematrix, charts
    voortgang/   # HRV, kracht
    onboarding/  # Onboarding stappen
  pages/         # Route-pagina's (Dashboard, Voeding, Recepten, etc.)
  lib/           # AuthContext, i18n, utils
netlify/
  functions/     # Serverless: AI-functies, food import, PubMed, etc.
supabase/
  schema.sql     # Database schema
```

## Key Pages
Dashboard, Voeding, Weekmenu, Recepten, Schemas (training), Supplementen, Voortgang, Welzijn, Nieuws, Gids, KennisMonitor, CoachAnalytics, Onboarding, Premium, Profiel, Login, Landing

## Netlify Functions (AI/backend)
- `invokeLLM.js` — generieke LLM-aanroep
- `generateFullDayMenu.js` — dag-menu generatie
- `voedingsChat.js` / `kennisAnalyse.js` — AI chat
- `pubmedFetch.js` — PubMed artikelen ophalen
- `importFoods.js` / `syncFoodDatabase.js` — voedingsdatabase
- `fetchReceptenFromSheet.js` / `importRecepten.js` — recepten import

## Belangrijke conventies
- Supabase errors worden altijd via `unwrap()` helper in `entities.js` gegooid
- Auth via `supabase.auth.getUser()`, user-id via `uid()` helper
- i18n aanwezig (`src/lib/i18n.js`, `LanguageSwitcher`)
- Premium gating via `PremiumGate` component
