# Cencore Operations Console — Agent Guide

## Stack
- **Next.js 16** (App Router, Server Actions, TS) + **Tailwind CSS 4** (`@tailwindcss/postcss`)
- **Supabase** (PostgreSQL + Auth + SSR via `@supabase/ssr`)
- **FastAPI** pricing microservice in `pricing-service/`
- **n8n** webhook for emailing quotes
- No Redux/RTK — state lives in Server Actions + DB directly

## Architecture
- `app/` — Next.js App Router; `app/admin/` protected via middleware (`proxy.ts:34-37`)
- `actions/` — Server Actions (`"use server"`); direct Supabase queries, not repositories
- `repositories/` — class-based pattern (only `quote-repository.ts`; prefer `actions/` for new code)
- `services/pricing-service.ts` — wraps FastAPI client (`axios`); not used by current Server Actions (they call `/calculate` via `fetch` directly in `actions/quotes.ts:263`)
- `types/database.ts` — Supabase row types; `types/domain.ts` — app-level DTOs (two separate `Quote` interfaces)
- `lib/supabase/` — three clients: `client.ts` (browser), `server.ts` (server component), `middleware.ts` (proxy)
- `pricing-service/` — standalone FastAPI app with Strategy pattern calculators in `engine.py`
- Brand color: `#F97316` (orange)

## Env (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # used by browser client (not ANON_KEY)
PRICING_SERVICE_URL=http://localhost:8000
N8N_WEBHOOK_URL=https://...n8n.cloud/webhook/cencore-quotes
```

## Commands
| Task | Command |
|------|---------|
| Dev server | `npm run dev` (Next.js on :3000) |
| Pricing service | `uvicorn main:app --reload --port 8000` (in `pricing-service/`, venv activated) |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Seed pricing data | `python seed_db.py` (in `pricing-service/`, venv activated) |

No test framework or CI configured.

## Key Conventions
- Server Actions return `{ data, error }` or `{ success, error }` — check `error` before using `data`
- Auth via `supabase.auth.signInWithPassword()` in `actions/auth.ts`; session refresh via middleware
- Proxy middleware at `proxy.ts` (not `middleware.ts`) — protects `/admin` routes, redirects `/login` when authenticated
- Login credentials (dev): `admin@cencore.com` / `password123`
- Print-friendly admin layout uses CSS classes `no-print` and `print:block`
- Pricing config has V2 tables (`pricing_materials_catalog`, `pricing_labor_routes`, etc.) and legacy V1 tables — V2 functions in `actions/pricing_config.ts`, V1 retained for backward compat in same file
- `@/*` path alias maps to root (e.g. `@/lib/supabase/server`)
- `quote_items.configuration` stores JSONB of the industrial recipe (dimensions, BOM, routing)
- Margin input as % (e.g. `7.77` = 7.77%); stored as decimal (e.g. `0.0777`)
- Delete quote allowed only on `draft` status (`actions/quotes.ts:296`)
- Send quote via n8n only on `approved` status (`actions/quotes.ts:318`)
- n8n webhook URL must be Production URL (prefix `/webhook/`), NOT editor URL (`/workflow/...`)
- Quote updates reset status to `draft` automatically
- Files with both TS and PY: modify both the Next.js action and the FastAPI endpoint if changing pricing logic
