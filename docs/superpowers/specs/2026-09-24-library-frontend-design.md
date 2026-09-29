# Design Specification: Library Management System Web Frontend

**Date**: 2026-09-24  
**App**: `apps/web`  
**Status**: Approved  

---

## 1. Objective & Scope

Design and implement a responsive, modern frontend in `apps/web` for the Neighborhood Library service. The system provides a unified librarian-centric workspace to manage library members, books, and lending operations (borrowing and returning) using exclusively existing `backend` REST APIs without creating new endpoints.

---

## 2. Architecture & Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Component Primitives**: `@repo/ui`
- **State Management & Data Fetching**: TanStack Query (`@tanstack/react-query`)
- **Forms**: `@tanstack/react-form-nextjs` and `@repo/ui` input components
- **Network Requests**: `fetchWithAuth` / `fetchWithoutAuth` via `@/utils/api`
- **Backend Origin / Proxy**: In dev, `/api/*` proxies to `http://localhost:3000`.

---

## 3. Backend API Contract Mapping

All frontend interactions map directly to the existing backend endpoints:

| Domain | Frontend Action | Backend Endpoint | Method | Request Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | Login | `/auth/login` | `POST` | `{ email, password }` |
| **Auth** | Signup | `/auth/signup` | `POST` | `{ email, password, firstName, lastName, phone? }` |
| **Auth** | Get Current User | `/auth/me` | `GET` | Headers: `x-user-id` (via cookie) |
| **Auth** | Logout | `/auth/logout` | `POST` | — |
| **Books** | Create / Upsert Book | `/books` | `POST` | `{ title, isbn?, publishedYear?, numberOfCopies, authorFirstName?, authorLastName?, authorId? }` |
| **Books** | Update Book Metadata | `/books/[id]` | `PUT` | `{ title?, isbn?, publishedYear? }` |
| **Books** | Book Status & Copies | `/books/[id]/status` | `GET` | Path param: `id` |
| **Loans** | Borrow Book Copy | `/loans/borrow` | `POST` | `{ bookId, daysToBorrow }` |
| **Loans** | Return Book Copy | `/loans/return` | `POST` | `{ loanId }` |
| **Members** | List Members | `/user` | `GET` | — |
| **Members** | Member Details | `/user/[userId]` | `GET` | Path param: `userId` |
| **Members** | Member Active Loans | `/user/[userId]/loans` | `GET` | Path param: `userId` |
| **Members** | Update Profile | `/user/[userId]` | `PUT` | `{ firstName?, lastName?, phone? }` |
| **Members** | Change Password | `/user/[userId]/password` | `PUT` | `{ currentPassword, newPassword }` |

---

## 4. UI Layout & User Experience

### 4.1 Dashboard Layout (`/dashboard` or `/`)
A unified Librarian Console with three integrated panels:

1. **Lending & Returns Hub**:
   - **Quick Borrow**: Form to enter `bookId` and duration in days (default: 14), with immediate submission and cache refresh.
   - **Active Loans Table**: Real-time list of current user loans fetched via `/user/[userId]/loans`. Displays book title, copy ID, borrow date, due date, overdue indicator badge, and a 1-click **Return** action button.

2. **Book Operations & Status Inspector**:
   - **Search / Lookup Bar**: Direct Book ID lookup bar with quick-select shortcuts from active loans and recent history.
   - **Book Details & Status Card**: Fetches status via `/books/[id]/status`. Displays:
     - Title, ISBN, Authors list, Published year.
     - Inventory summary metrics (Total, Available, Borrowed, Maintenance, Lost).
     - Individual copy status breakdown table with active borrower names, emails, due dates, and overdue status.
     - One-click "Borrow Available Copy" button.
   - **Add / Manage Book Modal**: Form triggering `POST /books` with copy counts and author details.

3. **Members Directory & Loans Viewer**:
   - Directory table from `/user` with search filter by member name/email.
   - Member inspection drawer: displays member details and their active loans from `/user/[userId]/loans`.

### 4.2 Authentication Flow (`/(auth)/login` and `/(auth)/signup`)
- Sleek card-based authentication forms with form validation, error message alerts, and redirect handling.

---

## 5. Query Keys & Cache Management

Centralized in `apps/web/lib/query-keys.ts`:
- `queryKeys.auth.me`: `['auth', 'me']`
- `queryKeys.books.status(bookId)`: `['books', 'status', bookId]`
- `queryKeys.loans.user(userId)`: `['loans', 'user', userId]`
- `queryKeys.members.all`: `['members', 'all']`
- `queryKeys.members.detail(userId)`: `['members', 'detail', userId]`
- `queryKeys.members.loans(userId)`: `['members', 'loans', userId]`

Mutations (`borrowBook`, `returnBook`, `createOrUpdateBook`) automatically invalidate related query caches to keep inventory counts and loan lists consistent across all panels.

---

## 6. Verification & Validation Plan

1. **Static Analysis & Type Checking**:
   - `yarn workspace web exec tsc --noEmit`
   - `yarn workspace backend exec tsc --noEmit`
   - `yarn workspace web lint`
2. **End-to-End Functional Walkthrough**:
   - Log in with seed user (`alice.smith@example.com` / `password123`).
   - Create a book via `/books` with 2 copies.
   - Inspect status via `/books/[id]/status`.
   - Borrow a copy via `/loans/borrow` and verify inventory decrements and loan appears in active loans.
   - Return the loan via `/loans/return` and verify copy returns to available state.
   - Inspect members list and member loan records.
