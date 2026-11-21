# LedgerGuard: Zero-Knowledge Billing Engine

LedgerGuard is a 10-day MERN learning project exploring multi-tenant billing and privacy-preserving verification. **Day 1 provides the monorepo foundation, tenant and user schemas, an API health endpoint, and a React overview dashboard.** Encryption, authentication, billing, and zero-knowledge proofs are not active in this scaffold yet.

## Day 1 prerequisites

- Node.js 20.19 or newer
- npm
- MongoDB running locally, or a MongoDB connection string

## Install and configure

From the repository root in PowerShell:

```powershell
npm install
if (-not (Test-Path server/.env)) { Copy-Item server/.env.example server/.env }
if (-not (Test-Path client/.env)) { Copy-Item client/.env.example client/.env }
```

The example environment files point to a local MongoDB database and the local React development server. If either `.env` already exists, keep it and update the needed values instead of replacing it. Set `MONGO_URI` in `server/.env` to your MongoDB connection string. Keep `.env` files private; only `.env.example` files belong in Git.

## Run locally

Open two PowerShell terminals in the repository root.

Terminal 1, start the API:

```powershell
npm run dev:server
```

Terminal 2, start the React client:

```powershell
npm run dev:client
```

Open the Vite URL printed in Terminal 2, usually `http://localhost:5173`. Check the API at `http://localhost:5000/api/health`. If the API prints a different port, set that same port in `VITE_API_URL` in `client/.env` and restart Vite. The server stays available if MongoDB is offline, and the health response reports `dbConnected: false` in that case.

For a production-style API start, use `npm run start:server` from the repository root.

## Day 1 structure

```text
server/
  src/
    config/db.js
    controllers/             # Reserved for upcoming milestones
    middleware/              # Reserved for upcoming milestones
    models/Tenant.js
    models/User.js
    routes/healthRoutes.js
    index.js
client/
  src/
    components/Layout.jsx
    context/                  # Reserved for upcoming milestones
    crypto/                   # Reserved for upcoming milestones
    pages/Overview.jsx
    services/api.js
    App.jsx
    index.css
```

The tenant schema includes a `vaultSalt` field for a future browser-side PBKDF2 flow. A salt is not an encryption key. Day 1 does not derive keys, encrypt records, authenticate users, or prove invoice integrity. Do not enter real customer data.

## 10-day roadmap

1. Foundation, schemas, and live health dashboard
2. Tenant isolation, authentication, and role-based access
3. Browser key vault and key derivation
4. Encrypted customer and product catalog
5. Subscription plans and usage metering
6. Invoice commitments and integrity checks
7. Client-side PDF receipts and private share links
8. Signed, idempotent payment webhook simulator
9. Tamper-evident audit ledger
10. Client-side analytics, integration, and review
