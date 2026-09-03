# AGENTS.md

Technical guide and conventions for AI agents and developers working on **Daboxi**.

---

## 1. Project Overview

**Daboxi** (`daboxi-next`) is a personal finance web application focused on simplicity and fast tracking of expenses, incomes, refunds, and monthly statistics, with Open Banking (EnableBanking) integration.

### Core Features
- **Dashboard (`/`)**: Monthly summary (income, expense, balance) and recent transactions grouped by date.
- **Transactions (`/transactions`)**: Full transaction list with category/subcategory filters.
- **Transaction Details & Editing (`/transactions/[transactionId]`)**: Real-time editing and refund association.
- **Create Transactions (`/transactions/create`)**: Single creation, batch creation (`CreateMultiple`), and CSV import.
- **Stats (`/stats`)**: Monthly expense breakdown by category and XLSX export.
- **Backup (`/backup`)**: Direct CSV table exports.
- **Open Banking (`/enablebanking`)**: Account Information Service via EnableBanking API.

---

## 2. Tech Stack

- **Framework**: Next.js 16+ (App Router, Turbopack, standalone output).
- **Language**: TypeScript 5.6+ / React 19.
- **Backend / BaaS**: PocketBase (SQLite, embedded Go server).
- **UI Components**: WebAwesome (`@awesome.me/webawesome`).
- **Styling**: Modular CSS (`src/css/`) following BEM / ITCSS naming conventions.
- **Observability**: Sentry (`@sentry/nextjs`).
- **Utilities**: `papaparse` (CSV), `xlsx` (SheetJS), `jsonwebtoken` + native `crypto` (RS256 signing for Open Banking).

---

## 3. Database & Data Model (PocketBase)

The database schema and TypeScript definitions are defined in:
- TypeScript definitions: [`src/types/pocketbase.d.ts`](file:///home/emanuelsaramago/www/daboxi/src/types/pocketbase.d.ts) (also re-exported via [`src/appwrite.d.ts`](file:///home/emanuelsaramago/www/daboxi/src/appwrite.d.ts) for backward compatibility).

### Collections
- **`users`**: PocketBase Auth collection with custom fields for EnableBanking settings (`enablebanking_bank_name`, `enablebanking_country`, `enablebanking_enabled`).
- **`types`**: Transaction types (`income`, `expense`, `refund`, `undefined`).
- **`categories`**: Main category classifications linked to a `type` with an icon.
- **`subcategories`**: Subcategories linked to a parent `category`, with optional budget.
- **`transactions`**: Financial movements containing amount, date, descriptions, category relations, linked refund IDs, and owner `user` (API Rule: `@request.auth.id != "" && user = @request.auth.id`).
- **`bank_sessions`**: Stored EnableBanking sessions, authorized accounts, and validity status.
- **`enablebanking_transactions`**: Tracked/imported EnableBanking transaction status.

---

## 4. Key Architecture & Coding Conventions

### Server Actions & PocketBase SDK
- All database mutations and queries reside in `src/api/` as Server Actions (`'use server'`).
- Use the helper methods in `src/lib/pocketbase.ts` (`getPocketBase`, `getPublicPocketBase`, `formatRecord`).
- Enforce authentication on server actions using `requireAuth()` or `getAuthenticatedUser()` from `src/lib/pocketbaseServer.ts`.
- Relations are resolved cleanly using PocketBase `expand` (e.g. `expand: 'subCategory.category.type'`), and `formatRecord` maps expanded relations directly onto the record tree.

### Financial Business Logic
- **Values**: Expenses are stored as negative numbers (e.g., `-25.00`); Incomes are positive numbers (e.g., `1500.00`).
- **Refunds & `netValue`**: When a refund transaction (`code: 'refund'`) is linked to an expense:
  - Refund transaction gets `netValue = calcNetValue(refund.value, expense.value)`.
  - Expense gets `netValue = expense.value + refund.value` and references the refund ID in `refundsIds`.
  - In summaries and balance calculations, always prefer `netValue` when it is not null (`transaction.netValue ?? transaction.value`).
- **Date Grouping**: Transactions lists are grouped by date using `Map.groupBy` or `Object.groupBy`.

---

## 5. Development & Deployment Commands

- `npm run dev`: Start Next.js local development server with Turbopack.
- `npm run build`: Build production bundle.
- `npm run lint`: Run ESLint checks.
- `npm run pb:serve`: Start local PocketBase binary with data in `./pb_data`.
- `npm run pb:migrate`: Run pending PocketBase migrations in `./pb_migrations`.
- `npm run migrate:appwrite`: Run automated migration from Appwrite SQL backup to PocketBase.
- `docker-compose up -d`: Run both Next.js app and PocketBase services via Docker.

---

## 6. Environment Variables

Never ask to see `.env` file. Refer to [`.env.example`](./.env.example) for the required environment variables:
- `POCKETBASE_URL`: Internal PocketBase URL for server actions (e.g. `http://pocketbase:8090` in Docker or `http://127.0.0.1:8090` locally).
