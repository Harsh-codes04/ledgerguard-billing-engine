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

## Day 2: authentication and tenant roles

Day 2 adds workspace registration, sign-in, sign-out, session restoration, role checks, and an administrator-only invite endpoint. Passwords are stored as `bcryptjs` hashes. JWTs are sent in an HTTP-only `token` cookie; the browser API helper includes credentials and does not store the token in local storage.

Configure `server/.env` with:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ledgerguard
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters_long
JWT_EXPIRES_IN=7d
```

Use a different, random `JWT_SECRET` for any shared or production deployment. In production the authentication cookie is `Secure` and uses `SameSite=None` for a separately deployed client/API; configure `CLIENT_URL` to the exact frontend origin. For localhost, the cookie uses `SameSite=Lax`.

### Authentication API

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/auth/register-tenant` | Public; creates a workspace and its first `OrgAdmin` |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/logout` | Public; clears the cookie |
| `GET` | `/api/auth/me` | Signed-in user |
| `POST` | `/api/auth/invite` | `OrgAdmin`; creates a `BillingManager` or `Auditor` in the current tenant |

The authentication middleware checks the signed-in user and active tenant in MongoDB on each protected request. It pins `req.tenantId` to that account's tenant and ignores any tenant ID supplied by the browser. Future tenant-owned database routes must include `tenantId: req.tenantId` in every query (the middleware exports `tenantScopedFilter` for this). A tenant ID property alone cannot make an unscoped future query safe.

Tenant and first-admin creation runs in one MongoDB transaction. MongoDB Atlas and local replica-set deployments support this. A standalone local MongoDB instance does not; in that case registration returns `503` with a setup message instead of risking a partially created workspace.

### Day 2 verification

1. Run `npm install` after pulling the Day 2 changes, then start the API and client in separate terminals as above.
2. Open the client and choose **Create a workspace**. Submit a workspace name, your name, a unique email address, and a password of at least 8 characters. The dashboard should open with your name, `OrgAdmin` role, tenant name, and plan tier in the header.
3. In the same browser, open `http://localhost:5000/api/auth/me`. It should return the current user and tenant. If your API is listening on another port, use that port.
4. Click **Logout**. The app should return to `/login`; the `/api/auth/me` endpoint should now return `401`.
5. Sign in with the same email and password. The workspace header should return after login.

Day 2 does not encrypt customer data or implement the Web Crypto vault. Use demo data only.
