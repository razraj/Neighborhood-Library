# Neighborhood-Library Service

Turborepo monorepo for the **Neighborhood-Library Service** — a comprehensive library management and cataloging system. The **web** app is the user-facing UI; the **backend** app is the API layer and sole database accessor. Shared packages hold the Prisma database client, shared UI components, and tooling configs.

---

## Setup instructions

### Prerequisites

- **Node.js** ≥ 22.13.0
- **Yarn** 4 (via Corepack: `corepack enable`)
- **PostgreSQL** (local instance or hosted, e.g. Neon)

### 1. Install dependencies

```sh
yarn install
```

### 2. Configure environment

Create a root `.env` file with at least:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/neighborhood_library
JWT_SECRET=your-long-random-secret
```

Optional configuration:

```env
DEFAULT_PASSWORD=password123
WEB_URL=http://localhost:3001
RESEND_API_KEY=re_your_api_key_here
```

Copy the root env into each workspace:

```sh
yarn env:cp
```

This distributes `.env` to `apps/backend`, `apps/web`, and `packages/db`.

### 3. Prepare the database

```sh
yarn workspace @repo/db db:generate
yarn workspace @repo/db db:migrate
yarn workspace @repo/db db:seed
```

To reset the database and re-seed from scratch:

```sh
yarn workspace @repo/db db:reset
```

### 4. Run locally

Start both apps concurrently:

```sh
yarn dev
```

Or run individual workspaces:

```sh
yarn workspace backend dev   # http://localhost:3000
yarn workspace web dev       # http://localhost:3001
```

Open **http://localhost:3001** in your browser. The web app automatically proxies `/api/*` requests to the backend API running on port 3000.

### 5. Verify & Test

```sh
yarn lint
yarn check-types
yarn workspace web test:e2e   # Playwright end-to-end tests
```

---

## Repository layout

| Path                         | Description                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| `apps/web`                   | Next.js frontend (port **3001**)                                 |
| `apps/backend`               | Next.js API layer + JWT auth gate via `proxy.ts` (port **3000**) |
| `packages/db`                | Prisma schema, migrations, seed data, and client (`@repo/db`)    |
| `packages/ui`                | Shared React components (Radix UI + Tailwind CSS)                |
| `packages/eslint-config`     | Shared ESLint configurations                                     |
| `packages/typescript-config` | Shared TypeScript configurations                                 |

---

## Dependencies & patterns

**Prefer workspace packages** (`@repo/ui`, `@repo/db`, shared configs) before adding duplicate npm deps to individual apps.

| Layer            | Standard libraries                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Web server state | `@tanstack/react-query` — hooks in `apps/web/hooks/`, keys in `apps/web/lib/query-keys.ts` |
| Web forms        | `@tanstack/react-form-nextjs` + `@repo/ui` Field components                                |
| Web UI           | `@repo/ui` components and styles                                                           |
| Backend data     | `@repo/db` (backend only)                                                                  |

---

## Frameworks & Libraries

### Monorepo & Tooling

- [Turborepo](https://turbo.build/) — Build pipeline orchestration and remote caching
- [Yarn Workspaces](https://yarnpkg.com/features/workspaces) (v4)
- [TypeScript](https://www.typescriptlang.org/) 5.9
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io)

### Apps

- [Next.js](https://nextjs.org/) 16 (App Router) — both `web` and `backend`
- [React](https://react.dev/) 19

### Web (`apps/web`)

- [TanStack Query](https://tanstack.com/query) — Asynchronous state management & caching
- [TanStack Form](https://tanstack.com/form) — Type-safe form validation and state
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Lucide React](https://lucide.dev/) — Icons
- [next-themes](https://github.com/pacocoursey/next-themes) — Theme switching
- [Playwright](https://playwright.dev/) — E2E testing

### Backend (`apps/backend`)

- [Prisma](https://www.prisma.io/) 7 + `@prisma/adapter-pg` — PostgreSQL ORM
- [Zod](https://zod.dev/) — Schema validation
- [jose](https://github.com/panva/jose) — JWT signing & token verification
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — Password hashing
- [Resend](https://resend.com/) / Nodemailer — Transactional email services

### Shared UI (`packages/ui`)

- [Radix UI](https://www.radix-ui.com/) — Accessible component primitives
- [class-variance-authority](https://cva.style/) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) — Component variant styling
- [Sonner](https://sonner.emilkowal.ski/) — Toast notifications

---

## Architectural Principles

1. **Backend Database Isolation**: Only `apps/backend` imports `@repo/db` or communicates with PostgreSQL. The `apps/web` client never connects directly to the database.
2. **Unified Routing**: Client-side network requests target `/api/*` on the web origin (`http://localhost:3001`), which proxies to the backend (`http://localhost:3000`).
3. **Cookie-Based JWT Authentication**: Auth state is maintained via httpOnly `auth_token` (access) and `refresh_token` cookies. Backend Next.js 16 `proxy.ts` verifies tokens and forwards user identity via the `x-user-id` header to downstream route handlers.
