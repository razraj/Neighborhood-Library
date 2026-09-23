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

## Data Models & Schema

The data layer in `packages/db/src/prisma/schema.prisma` models a normalized library system:

| Model            | Purpose                       | Key Fields                                                                                    |
| ---------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| **`Author`**     | Book contributors             | `authorId`, `firstName`, `lastName`                                                           |
| **`Book`**       | Cataloged titles              | `bookId`, `isbn` (unique), `title`, `publishedYear`                                           |
| **`BookAuthor`** | M:N junction table            | `bookId`, `authorId` (Cascades on book/author deletion)                                       |
| **`BookCopy`**   | Physical inventory copies     | `copyId`, `bookId`, `status` (`available`, `borrowed`, `lost`, `maintenance`)                 |
| **`Member`**     | Library patrons / users       | `id`, `firstName`, `lastName`, `email` (unique), `phone`, `joinDate`, `isActive`, auth tokens |
| **`Loan`**       | Borrowing transaction records | `loanId`, `copyId`, `memberId`, `borrowDate`, `dueDate`, `returnDate`                         |

---

## API Endpoints

### Authentication (`/auth`)

- `POST /auth/login` — Authenticate member, issue httpOnly access (`auth_token`) and refresh tokens.
- `POST /auth/signup` — Register a new member account.
- `GET /auth/me` — Retrieve current authenticated member profile.
- `POST /auth/logout` — Revoke active refresh token and clear auth cookies.
- `POST /auth/refresh` — Refresh expired access token.
- `POST /auth/forgot-password` & `POST /auth/reset-password` — Password reset workflow.
- `POST /auth/verify-email` & `POST /auth/resend-verification` — Email verification workflows.

### Books & Inventory (`/books`)

- `POST /books` — Create or update a book, associate author(s), and manage inventory copy count (only available copies can be scaled down).
- `PUT /books/:id` — Update book metadata (`title`, `isbn`, `publishedYear`).
- `GET /books/:id/status` — Retrieve full inventory status for a book: per-copy status, active borrower info, overdue flags, and inventory summary (total / available / borrowed / lost / maintenance).

### Loans & Circulation (`/loans`)

- `POST /loans/borrow` — Check out an available copy to a member (`memberId`, `copyId`, `daysToBorrow`), set copy status to `borrowed`.
- `POST /loans/return` — Mark a loan returned (`returnDate`), restore copy status to `available`.

### Members / Users (`/user`)

- `GET /user` — List all active members.
- `GET /user/:userId` — Get a specific member's profile.
- `PUT /user/:userId` — Update member profile fields (`firstName`, `lastName`, `email`, `phone`).
- `PUT /user/:userId/password` — Change member password (requires `oldPassword` + new `password`; same-user only).
- `GET /user/:userId/loans` — List all currently active (unreturned) loans for a member, sorted by due date.

---

## Seed Data & Test Users

The database seed (`packages/db/src/seed.ts`) is idempotent and populates sample library data:

### Seed Members

- **Alice Smith**: `alice.smith@example.com` (Active)
- **Bob Jones**: `bob.jones@example.com` (Active)
- **Charlie Brown**: `charlie.brown@example.com` (Active)
- **Diana Prince**: `diana.prince@example.com` (Inactive)
- **Default password**: `password123` (or `DEFAULT_PASSWORD` env var)

### Seed Books & Authors

- _1984_ by George Orwell (`978-0451524935`)
- _The Hobbit_ by J.R.R. Tolkien (`978-0547928227`)
- _Pride and Prejudice_ by Jane Austen (`978-0141439518`)
- _Foundation_ by Isaac Asimov (`978-0553293357`)
- _Good Omens_ by Neil Gaiman & Terry Pratchett (`978-0060853983`)

### Seed Copies & Loans

- Copies across all statuses: `available`, `borrowed`, `lost`, and `maintenance`.
- Loan scenarios: Active on-time loan, active overdue loan, completed on-time return, and completed late return.

---

## Error Handling & Prisma Codes

The API maps common Prisma database errors (`PrismaClientKnownRequestError`) to clean HTTP responses:

- **`P2002` (Unique Constraint Failed)**: Returned when attempting to insert a duplicate unique value (e.g. existing Member `email` or duplicate Book `isbn`).
- **`P2025` (Record Not Found)**: Returned when updating or deleting a non-existent entity (`bookId`, `memberId`, `copyId`, `loanId`).
- **`P2003` (Foreign Key Constraint Failed)**: Returned when referencing a non-existent parent record (e.g. loan with invalid `copyId`/`memberId`) or attempting to delete a copy with linked loan history.
- **`P2014` (Relation Violation)**: Returned when an action would violate a required relational restriction (`onDelete: Restrict`).
- **`P2000` (Value Too Long)**: Returned when a string input exceeds column length constraints (e.g. title exceeding `@db.VarChar(255)`).

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
