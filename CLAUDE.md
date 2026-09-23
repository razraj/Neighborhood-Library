# Neighborhood-Library Service — Monorepo

Turborepo monorepo (yarn workspaces, Node ≥22) with two Next.js apps (`apps/web` and `apps/backend`) and shared packages.

> **Keep in sync:** When updating this file, also keep the actual route files and seed data in sync with what is documented here.

## Quick Reference Commands

- **Install**: `yarn install`
- **Dev**: `yarn dev` (all) or `yarn workspace backend dev` / `yarn workspace web dev`
- **Build**: `yarn build`
- **Lint/Format**: `yarn lint` / `yarn format`
- **Database** (`@repo/db`): `yarn workspace @repo/db db:generate|db:migrate|db:seed|db:reset`
- **Env**: `yarn env:cp`
- **E2E**: `yarn workspace web test:e2e`
- **Onboarding**: root `README.md` — setup, stack, seed users, assumptions

## Current Codebase Snapshot

- **Backend routes (today):**
  - Auth: `/auth/login`, `/auth/signup`, `/auth/logout`, `/auth/me`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/resend-verification`
  - Books: `POST /books`, `PUT /books/[id]`, `GET /books/[id]/status`
  - Loans: `POST /loans/borrow`, `POST /loans/return`
  - Users: `GET /user`, `GET /user/[userId]`, `PUT /user/[userId]`, `PUT /user/[userId]/password`, `GET /user/[userId]/loans`
  - Verify with: `find apps/backend/app -type f`
- **Web pages (today):** `(auth)/login`, `(auth)/signup`, `(auth)/forgot-password`, `(auth)/reset-password`, `(auth)/verify-email`, `dashboard/`, `dashboard/[weekStart]`, `projects/`, `settings/`
- **Tests:** no vitest harness configured; `yarn test` is currently a no-op
- **E2E:** Playwright in `apps/web/e2e/`

## Auth Model

- **JWT httpOnly cookies, not server-side sessions** — `auth_token` (access) + `refresh_token`; issued in `apps/backend/lib/auth-session.ts`
- **`proxy.ts` reads `auth_token` from Cookie header** — verifies via `jose`, sets `x-user-id`; refresh token also in DB for revoke/refresh only
- **Cookie parse:** JWT contains `=` — use `getAuthTokenFromCookie` in `proxy.ts`, not naive `split("=")`

## Verification Habits

- `find apps/backend/app -type f` — list actual backend routes (prefer over glob when unsure)
- `yarn workspace web exec tsc --noEmit` — typecheck web app
- `yarn workspace backend exec tsc --noEmit` — typecheck backend
- `yarn workspace backend lint` / `yarn workspace web lint` — per-app lint when turbo filter fails
- Read `.claude/rules/*.md` before architectural changes — surface conflicts to the user

## Environment & Secrets

- **Required**: `DATABASE_URL` (PostgreSQL), `JWT_SECRET` (shared between backend and web).
- **Source of truth**: root `.env`, distributed to apps via `yarn env:cp`.
- **Production web rewrite:** `apps/web/next.config.js` uses `DATABASE_HOST` as backend origin in prod (rules may still mention `API_URL`).

## Dev Quirks

- **Dev ports:** web `3001`, backend `3000` — browser entry is `http://localhost:3001`
- **Seed logins:** `alice.smith@example.com` / `bob.jones@example.com` / `charlie.brown@example.com` — `DEFAULT_PASSWORD` or `password123`; `diana.prince@example.com` is inactive
- **Web → backend rewrite:** `apps/web/next.config.js` proxies `/api/*` to `http://localhost:3000` in dev
- **Turbo config:** `turbo.json` — declare new env vars in `global.env`
- **Turbo env lint:** `turbo/no-undeclared-env-vars` needs vars in `global.env`, not only `passThroughEnv`
- **Backend auth gate:** `apps/backend/proxy.ts` (Next.js 16 proxy) — never add `middleware.ts`
- **Next.js 16 proxy file:** must be named `proxy.ts` with `export default async function proxy` — handler rename alone won't clear the deprecation warning
- **Prisma CLI config:** root `prisma.config.ts` points at `packages/db` schema/migrations; package also has `packages/db/prisma.config.ts`

## Dependencies & Web Patterns

- **Prefer workspace packages** — `@repo/ui`, `@repo/db` (backend only), `@repo/eslint-config`, `@repo/typescript-config`
- **Server state (web):** `@tanstack/react-query` — keys in `apps/web/lib/query-keys.ts`, hooks in `apps/web/hooks/` (e.g. `use-user-queries.ts`, `use-project-queries.ts`)
- **Forms (web):** `@tanstack/react-form-nextjs` + `@repo/ui` Field components — not react-hook-form or ad-hoc `useState` forms
- **UI (web):** import from `@repo/ui/components/*` — add new primitives to `packages/ui`, don't copy into web

## Documentation

- **Web app guide**: [apps/web/README.md](apps/web/README.md)
- **Agent specs & plans**: `/docs/superpowers/` (root only)
- **Backend-specific docs**: `apps/backend/docs/`
- **Cross-cutting architecture**: `/docs/` (root)
- Do **not** create `apps/web/docs/` — web docs go inline in `apps/web/README.md` or root `/docs/`.

## Detailed Instructions

For specific guidelines, see:
- [Architecture & design decisions](docs/)
- [Web app patterns](apps/web/README.md)
