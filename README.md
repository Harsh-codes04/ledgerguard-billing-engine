# LedgerGuard: Zero-Knowledge Billing Engine

LedgerGuard is a 10-day MERN learning project exploring multi-tenant billing and privacy-preserving verification. Day 1 established the monorepo, tenant and user schemas, API health endpoint, and React dashboard. Day 2 added authentication and workspace roles. Day 3 adds a browser-only key vault; customer records and billing data are not connected to encryption yet, and there is no zero-knowledge proof.

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

## Monorepo layout

```text
server/
  src/
    config/db.js
    controllers/
    middleware/
    models/Tenant.js
    models/User.js
    routes/healthRoutes.js
    index.js
client/
  src/
    components/Layout.jsx
    context/AuthContext.jsx
    context/VaultContext.jsx
    crypto/zkVault.js
    components/VaultModal.jsx
    pages/Overview.jsx
    services/api.js
    App.jsx
    index.css
```

The tenant schema's `vaultSalt` is a public random salt for browser-side PBKDF2; it is not a password, encryption key, or verifier. The vault derives keys locally, but it does not encrypt customer or billing records in this milestone. Do not enter real customer data.

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

Day 2 adds authentication and roles but does not encrypt customer data. Use demo data only.

## Day 3: browser-side key vault

`client/src/crypto/zkVault.js` uses only the browser Web Crypto API. It derives 512 bits with PBKDF2-SHA-256 (310,000 iterations), splits them into separate non-extractable AES-GCM-256 and HMAC-SHA-256 keys, and clears the temporary byte arrays. Encryption uses a fresh 12-byte IV per call. The vault keys live in React memory only and are cleared on logout or after 15 minutes without activity.

The vault modal can run a local round-trip diagnostic and display its ciphertext and decrypted sample. It does not send the sample to the API. The current workspace salt has no saved encrypted verifier, so any passphrase derives a key; the diagnostic only confirms that the same key can encrypt and decrypt. It does not prove that a user entered a previously chosen passphrase.

Blind indexes are deterministic HMAC values. They hide the original string from the API but reveal equality when identical normalized values are indexed. `computeCommitment` returns a SHA-256 digest over a minor-unit amount and nonce; this is an integrity digest, not a Pedersen commitment or a zero-knowledge proof.

### Day 3 verification

1. Start the API and client as above and sign in to a workspace. The API response from `/api/auth/me` includes `tenant.vaultSalt`; the salt is public input to the browser key derivation.
2. Select **Vault Locked** in the header, enter a passphrase of at least 12 characters, and unlock. The header badge should turn emerald.
3. Run **Verify round-trip encryption**. Confirm a Base64 ciphertext and matching decrypted sample appear; the sample is handled in the browser only.
4. Lock the vault manually or sign out. The badge should return to amber. The vault also locks after 15 minutes of inactivity.
5. Run `npm run build` from the repository root to confirm the client bundle compiles.

The key vault is not yet connected to customer, plan, usage, or invoice API requests. Do not treat this prototype as production zero-knowledge billing.
