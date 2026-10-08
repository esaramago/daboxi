# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-10-08

### Added
- **Transaction Search**: Added search filtering to `fetchTransactions` API and `/transactions` UI to filter transactions by `description`, `niceDescription`, or `notes`.
- **Save Feedback & Error Handling**: Integrated dynamic `WaToast` success notifications and error handling for inline field edits (date, description, nice description, notes, and value) on the transaction details page.
- **Production Build Configuration**: Added `NODE_OPTIONS="--max-old-space-size=2048"` support in Dockerfile and Docker Compose to optimize Node.js memory during production builds.

### Changed
- **Environment Resolution**: Updated RootLayout to use `ENV` environment variable with fallback to `development`.
- **Transactions Toolbar Layout**: Replaced row container with responsive `Grid` layout for transaction search and category dropdown filters.

---

## [0.2.1] - 2026-10-08

### Added
- **ASPSP Caching & Deduplication**: Added in-memory caching (24h TTL) and concurrent request deduplication for EnableBanking ASPSPs in `getAspsps.ts`.
- **Transactions Pagination**: Introduced pagination support in `fetchTransactions` API and UI with dynamic page size and navigation controls.
- **Bank Selection**: Added `fetchEnableBankingBanks` API endpoint and dynamic bank selector dropdown in EnableBanking settings dialog.
- **Password Recovery**: Implemented forgot password flow with email request and password confirmation endpoints.
- **Layout & Feedback Components**: Added `Grid` and `EmptyState` WebAwesome-compatible components.
- **Base URL Utility**: Introduced `getBaseUrl` helper for consistent redirect URLs across authentication and Open Banking callbacks.

### Changed
- **Package Metadata**: Renamed project package name to `daboxi` and added author details in `package.json`.
- **Default Page Size**: Reduced default transaction fetch page size from 100 to 50 items for faster load times.
- **EnableBanking Settings**: Enhanced settings dialog with transition states, loading indicators, and stricter bank name validation.
- **Design & Assets**: Updated logo, brand icons, and improved UI contrast and theme colors across development and staging environments.
- **Transaction Sanitization**: Extracted and centralized transaction update payload validation into `sanitizeTransactionUpdate` utility.
- **Container & Docker Images**: Updated base and runner Docker images to `node:22-alpine` with global `pnpm` workspace support.
- **Documentation**: Restructured [AGENTS.md](AGENTS.md) conventions with clean headings and relative markdown links.

### Fixed
- **Date Standardization**: Fixed transaction date handling across components and added `fix:dates` script.
- **Sticky Elements**: Corrected z-index and positioning hierarchy for sticky date headers and sticky action buttons.
- **Docker Compose Configuration**: Cleaned up service port exposures, removed deprecated container names, and updated Traefik labels.
- **Session Synchronization**: Improved cookie sync and fresh user data fetching during EnableBanking authorization.

### Removed
- **Sentry Integration**: Removed Sentry SDK and related build plugins in favor of streamlined runtime error handling.
- **Obsolete Scripts**: Removed legacy Python date correction scripts and unused component state variables.

---

## [0.2.0] - 2026-09-02

### Added
- **PocketBase Backend Migration**: Migrated the database and authentication layer from Appwrite to embedded PocketBase (SQLite).
- **Automated Database Migrations**: Added PocketBase migration scripts for `users`, `types`, `categories`, `subcategories`, `transactions`, and `bank_sessions` collections.
- **Open Banking (EnableBanking)**: Added integration with EnableBanking Account Information Service using RS256 token signing and automated session tracking.
- **Design System Transition**: Replaced Shoelace with WebAwesome (`@awesome.me/webawesome`) components and custom theme tokens.
- **Batch Transactions**: Introduced `CreateMultiple` view for fast batch transaction entry alongside single creation and CSV import.
- **Transaction Notes**: Added `notes` field support across transaction schemas, forms, and detail views.
- **License**: Added Daboxi Source-Available License.

### Changed
- **Architecture**: Rewrote data operations to use Next.js Server Actions with PocketBase SDK.
- **Dependencies**: Upgraded to Next.js 16 (Turbopack) and React 19.

### Removed
- Deprecated Appwrite SDKs and migration scripts.
- Removed `@shoelace-style/shoelace` and legacy Vercel Analytics packages.

---

## [0.1.0] - 2025-12-14

### Added
- Initial project release with Next.js App Router and Appwrite BaaS.
- Personal expense, income, and refund tracking with net balance calculations.
- Transaction category and subcategory hierarchies.
- Monthly statistics view with expense breakdown.
- CSV transaction import and XLSX sheet export.
- Docker and development environment setup.
