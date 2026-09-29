# Library Management System Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, librarian-centric dashboard in `apps/web` for managing members, books, and lending operations (borrow/return) using exclusively existing backend APIs.

**Architecture:** Next.js 16 App Router interface connecting to backend routes via `/api/*` rewrite proxy. State managed with TanStack Query and forms with TanStack Form + `@repo/ui` primitives.

**Tech Stack:** Next.js 16, TypeScript, TanStack Query v5, TanStack Form, `@repo/ui`, TailwindCSS.

**Spec:** [`docs/superpowers/specs/2026-09-24-library-frontend-design.md`](file:///Users/rajatraikar/Documents/Github/Neighborhood-Library/docs/superpowers/specs/2026-09-24-library-frontend-design.md)

## Global Constraints

- Must use existing backend REST endpoints only; do not create or modify backend API routes.
- Web app communicates with backend via `/api/*` path rewrites (`fetchWithAuth` / `fetchWithoutAuth`).
- UI styling and components must prioritize workspace package `@repo/ui`.
- Typechecking (`yarn workspace web exec tsc --noEmit`) must succeed with zero errors.

## Review Focus

1. **Book Status with Zero or Overdue Copies**: Handle empty inventory states, missing authors, and overdue loan flags gracefully.
2. **Borrow Action on Unavailable Book**: Ensure borrow button is disabled when `available === 0` and surfaces backend `409` conflict cleanly.
3. **Return Action Authorization**: Ensure only valid active loans can be returned and cache updates immediately.
4. **Member Search & Empty Roster**: Filter members by query string without crashing on null/undefined phone numbers.
5. **Auth Session Lifecycle**: Unauthenticated access redirects smoothly to `/login`, and successful login refreshes user context.

---

### Task 1: Type Definitions & Centralized Query Keys

**Files:**
- Modify: `apps/web/types.ts`
- Modify: `apps/web/lib/query-keys.ts`

**Interfaces:**
- Produces: `Member`, `BookStatusReport`, `BookCopyStatus`, `InventorySummary`, `CreateBookInput`, `ActiveLoan`, `queryKeys`

- [ ] **Step 1: Update `apps/web/types.ts` with domain interfaces**

Define `Member`, `BookCopyStatus`, `InventorySummary`, `BookStatusReport`, `ActiveLoan`, `CreateBookInput`, `BorrowBookInput`, `ReturnBookInput`.

- [ ] **Step 2: Update `apps/web/lib/query-keys.ts` with library query keys**

Define keys for `auth.me`, `books.status(id)`, `loans.user(userId)`, `members.all`, `members.loans(userId)`.

- [ ] **Step 3: Run typecheck to verify interface definitions**

Run: `yarn workspace web exec tsc --noEmit`

---

### Task 2: Server Actions & TanStack Query Hooks

**Files:**
- Create: `apps/web/actions/library.ts`
- Create: `apps/web/hooks/use-library-queries.ts`
- Modify: `apps/web/actions/auth.ts`

**Interfaces:**
- Consumes: `types.ts`, `query-keys.ts`, `fetchWithAuth`, `fetchWithoutAuth`
- Produces: `useAuthMeQuery`, `useBookStatusQuery`, `useUserLoansQuery`, `useMembersQuery`, `useMemberLoansQuery`, `useBorrowBookMutation`, `useReturnBookMutation`, `useCreateOrUpdateBookMutation`

- [ ] **Step 1: Create `apps/web/actions/library.ts`**

Implement `getBookStatusAction`, `createOrUpdateBookAction`, `borrowBookAction`, `returnBookAction`, `getMembersAction`, `getMemberLoansAction`.

- [ ] **Step 2: Create `apps/web/hooks/use-library-queries.ts`**

Implement queries and mutations with proper cache invalidation on mutations (e.g. invalidate `loans.user`, `books.status`, `members.loans`).

- [ ] **Step 3: Verify TypeScript compilation**

Run: `yarn workspace web exec tsc --noEmit`

---

### Task 3: Authentication UI Components & Login/Signup Pages

**Files:**
- Modify: `apps/web/components/login-form.tsx`
- Modify: `apps/web/components/signup-form.tsx`
- Modify: `apps/web/app/(auth)/login/page.tsx`
- Modify: `apps/web/app/(auth)/signup/page.tsx`

**Interfaces:**
- Consumes: `actions/auth.ts`, `loginAction`, `signupAction`, `@repo/ui`
- Produces: Streamlined responsive login and signup UI with error alerts.

- [ ] **Step 1: Update `login-form.tsx`**

Ensure email/password inputs match backend `/auth/login` contract and provide clear error messages on auth failure.

- [ ] **Step 2: Update `signup-form.tsx`**

Ensure fields (firstName, lastName, email, password, phone) align with `/auth/signup` and redirect to dashboard upon success.

- [ ] **Step 3: Verify auth pages compile**

Run: `yarn workspace web exec tsc --noEmit`

---

### Task 4: Lending & Returns Console Component

**Files:**
- Create: `apps/web/components/lending-console.tsx`

**Interfaces:**
- Consumes: `useUserLoansQuery`, `useBorrowBookMutation`, `useReturnBookMutation`, `ActiveLoan`
- Produces: `LendingConsole` component rendering Quick Borrow card and Active Loans table with 1-click Return action and Overdue alerts.

- [ ] **Step 1: Implement `LendingConsole`**

Implement quick checkout form (`bookId`, `daysToBorrow`), active loans table with badges for due date & overdue status, and instant Return loan mutation.

- [ ] **Step 2: Verify typechecking**

Run: `yarn workspace web exec tsc --noEmit`

---

### Task 5: Book Inspector & Management Modal

**Files:**
- Create: `apps/web/components/book-inspector.tsx`
- Create: `apps/web/components/book-form-modal.tsx`

**Interfaces:**
- Consumes: `useBookStatusQuery`, `useCreateOrUpdateBookMutation`, `BookStatusReport`
- Produces: `BookInspector` (search by ID, inventory stats, copy breakdown table with borrower details) and `BookFormModal` (create/upsert book & copies).

- [ ] **Step 1: Implement `BookFormModal`**

Modal with fields: Title, ISBN, Published Year, Copies Count, Author First & Last Name, submitting via `POST /books`.

- [ ] **Step 2: Implement `BookInspector`**

Search bar with Book ID input, preset pills for quick selection, inventory summary badges, copies status table, and direct "Borrow Copy" shortcut.

- [ ] **Step 3: Verify typechecking**

Run: `yarn workspace web exec tsc --noEmit`

---

### Task 6: Members Directory & Loan Inspection Drawer

**Files:**
- Create: `apps/web/components/members-console.tsx`

**Interfaces:**
- Consumes: `useMembersQuery`, `useMemberLoansQuery`, `Member`
- Produces: `MembersConsole` component rendering member roster, search filter, and loan history drawer per member.

- [ ] **Step 1: Implement `MembersConsole`**

Searchable member directory table with status badges and detail drawer showing active borrowed books.

- [ ] **Step 2: Verify typechecking**

Run: `yarn workspace web exec tsc --noEmit`

---

### Task 7: Main Unified Dashboard & Navigation Layout

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/components/nav-main.tsx`
- Modify: `apps/web/components/app-sidebar.tsx`

**Interfaces:**
- Consumes: `LendingConsole`, `BookInspector`, `MembersConsole`, `AuthGuard`
- Produces: Full unified Librarian Workspace page.

- [ ] **Step 1: Assemble unified dashboard in `apps/web/app/dashboard/page.tsx`**

Integrate top navbar stats, Lending Console, Book Inspector, and Members Console into a coordinated 3-panel workspace.

- [ ] **Step 2: Update root redirect in `apps/web/app/page.tsx`**

Redirect to `/dashboard` or `/login` based on session.

- [ ] **Step 3: Clean up legacy timesheet navigation links in sidebar**

Update sidebar navigation items to Library features: Dashboard, Books, Lending, Members, Settings.

---

### Task 8: Full Verification & Clean Up

**Files:**
- Clean up unused legacy timesheet components if necessary
- Verify complete app build

- [ ] **Step 1: Run workspace typecheck**

Run: `yarn workspace web exec tsc --noEmit`

- [ ] **Step 2: Run lint check**

Run: `yarn workspace web lint`

- [ ] **Step 3: Verify full monorepo build**

Run: `yarn build`
