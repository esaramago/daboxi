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
- **Language**: TypeScript 5.6+ / React 18.
- **Backend / BaaS**: Appwrite (TablesDB API).
- **UI Components**: WebAwesome (`@awesome.me/webawesome`).
- **Styling**: Modular CSS (`src/css/`) following BEM / ITCSS naming conventions.
- **Observability**: Sentry (`@sentry/nextjs`).
- **Utilities**: `papaparse` (CSV), `xlsx` (SheetJS), `jsonwebtoken` + native `crypto` (RS256 signing for Open Banking).

---

## 3. Database & Data Model (Appwrite)

The database schema and TypeScript definitions are defined in:
- Schema configuration: [`appwrite.config.json`](file:///home/emanuelsaramago/www/daboxi/appwrite.config.json)
- Generated types: [`src/appwrite.d.ts`](file:///home/emanuelsaramago/www/daboxi/src/appwrite.d.ts)

### Tables
- **`types`**: Transaction types (`income`, `expense`, `refund`, `undefined`).
- **`categories`**: Main category classifications linked to a type with an icon.
- **`subcategories`**: Subcategories linked to a parent category, with optional budget.
- **`transactions`**: Financial movements containing amount, date, descriptions, category relations, and linked refund IDs (Row-Level Security enabled).
- **`bank_sessions`**: Stored EnableBanking sessions, authorized accounts, and validity status.

---

## 4. Key Architecture & Coding Conventions

### Server Actions & Appwrite SDK
- All database mutations and queries reside in `src/api/` as Server Actions (`'use server'`).
- Use the helper methods in `src/lib/appwrite.ts` (`fetchAppwriteDB`, `createAppwriteRow`, `updateAppwriteRow`, `deleteAppwriteRow`).
- Enforce authentication on server actions using `requireAuth()` from `src/lib/appwriteServer.ts`.
- Use `getCachedData` or `getCachedDataWithSession` from `src/lib/cache.ts` for cacheable queries.

### WebAwesome UI Components
- WebAwesome custom elements must **always** be dynamically imported with SSR disabled in client components:
  ```tsx
  const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
  const WaCard = dynamic(() => import('@awesome.me/webawesome/dist/react/card/index.js'), { ssr: false })
  ```

### Financial Business Logic
- **Values**: Expenses are stored as negative numbers (e.g., `-25.00`); Incomes are positive numbers (e.g., `1500.00`).
- **Refunds & `netValue`**: When a refund transaction (`code: 'refund'`) is linked to an expense:
  - Refund transaction gets `netValue = calcNetValue(refund.value, expense.value)`.
  - Expense gets `netValue = expense.value + refund.value` and references the refund ID in `refundsIds`.
  - In summaries and balance calculations, always prefer `netValue` when it is not null (`transaction.netValue ?? transaction.value`).
- **Date Grouping**: Transactions lists are grouped by date using `Map.groupBy` or `Object.groupBy`.

---

## 5. Development Commands

- `npm run dev`: Start Next.js local development server with Turbopack.
- `npm run build`: Run icon preparation script and build production bundle.
- `npm run lint`: Run ESLint checks.
- `npm run copy-icons`: Ensure icon assets directory exists.
- `docker-compose up -d`: Run the application via Docker.

### Appwrite CLI
- `appwrite push tables`: Deploy table schema to remote Appwrite database.
- `appwrite pull tables`: Pull remote table schema into `appwrite.config.json`.
- `appwrite types --language ts ./`: Regenerate TypeScript types in `src/appwrite.d.ts`.

---

## 6. Environment Variables

Refer to [`.env.example`](file:///home/emanuelsaramago/www/daboxi/.env.example) for the required environment variables.
