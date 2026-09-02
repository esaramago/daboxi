# Daboxi

**Daboxi** is a modern personal finance web application designed for simple, fast tracking of expenses, incomes, refunds, and monthly statistics, with Open Banking (EnableBanking) integration.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) / React 18
- **Backend / Database**: [PocketBase](https://pocketbase.io/) (SQLite, embedded Go server)
- **UI Components**: [WebAwesome](https://www.awesome.me/webawesome)
- **Styling**: Modular CSS (BEM / ITCSS naming conventions)
- **Integrations**: Open Banking via EnableBanking API, Sentry, SheetJS (Excel export), PapaParse (CSV import)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- NPM (bundled with Node.js)
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/) *(optional, for containerized run/deployment)*

### Installation

1. Clone the repository and install dependencies:
   ```bash
   git clone <repo-url>
   cd daboxi
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

---

## 💻 Development & Running Locally

### Option 1: VS Code (One-Click with `F5`) ⭐
Press **`F5`** (or go to **Run & Debug** ▶️ **Daboxi + PocketBase**). This automatically:
1. Starts the local PocketBase daemon with data in `./pb_data` (Port `8090`).
2. Starts the Next.js development server (Port `3000`).

### Option 2: Terminal All-in-One
Run both services concurrently in a single command:
```bash
npm run dev:all
```

### Option 3: Separate Terminals
- **Start PocketBase**:
  ```bash
  npm run pb:serve
  ```
  *(Admin Dashboard accessible at `http://127.0.0.1:8090/_/`)*

- **Start Next.js**:
  ```bash
  npm run dev
  ```
  *(Application accessible at `http://localhost:3000`)*

---

## 🔑 Environment Variables

| Variable | Description | Local Value | Docker / Production Value |
| :--- | :--- | :--- | :--- |
| `POCKETBASE_URL` | Server-side PocketBase URL | `http://127.0.0.1:8090` | `http://pocketbase:8090` |
| `NEXT_PUBLIC_POCKETBASE_URL` | Client-side PocketBase URL | `http://127.0.0.1:8090` | `https://pb.yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | App public base URL | `http://localhost:3000` | `https://yourdomain.com` |
| `ENABLEBANKING_APP_ID` | EnableBanking Application ID | *(optional)* | *(optional)* |
| `ENABLEBANKING_PRIVATE_KEY` | EnableBanking RS256 Private Key | *(optional)* | *(optional)* |

---

## 🐳 Docker & Coolify Deployment

The project includes a multi-service `docker-compose.yml` for deployment on **Coolify** or standard Docker hosts.

### Running with Docker Compose:
```bash
# Build and start services in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Services:
- **`pocketbase`**: Runs PocketBase on port `8090` with persistent volume `pocketbase_data:/pb_data`.
- **`app`**: Runs the standalone Next.js production build on port `3000`.

---

## 📜 Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Start Next.js with Turbopack |
| `npm run dev:all` | Start both PocketBase and Next.js concurrently |
| `npm run pb:serve` | Start local PocketBase server using `./pb_data` |
| `npm run build` | Build Next.js production application |
| `npm run start` | Start Next.js production server |
| `npm run lint` | Run ESLint checks |
| `npm run migrate:appwrite`| Run backup extraction and import into PocketBase |

---

## 📄 License

This project is licensed under the **Daboxi Source-Available License (Non-Commercial & Share-Alike)**:

- **Non-Commercial Use**: Free to inspect, use, and modify for personal, educational, and non-profit purposes.
- **Commercial Use**: Exclusively reserved for the author ([Emanuel Saramago](https://github.com/esaramago)). Commercial use, hosting as a paid service, or distribution requires prior written authorization.
- **Share-Alike / Mandatory Publication**: Any modifications or derivative works made available to third parties must have their full source code published under the exact same license terms.

See the [LICENSE](LICENSE) file for complete terms and details.
