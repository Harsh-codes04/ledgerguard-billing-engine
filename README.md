# LedgerGuard

LedgerGuard is my MERN project for billing in separate workspaces. I am building it in 10 milestones.

## Working so far

- Workspace registration and sign-in
- `OrgAdmin`, `BillingManager`, and `Auditor` roles
- A dashboard with an API and MongoDB health check
- A browser vault demo using PBKDF2, AES-GCM, and HMAC

The vault demo does not encrypt customer or billing records yet. It also cannot check whether a passphrase is the one previously chosen. This project is for demo data only; it does not yet make zero-knowledge proofs.

## Run it on your computer

You need Node.js, npm, and MongoDB. From the project folder, install the packages:

```powershell
npm install
```

If the `.env` files do not exist yet, copy the examples:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Set `MONGO_URI` in `server/.env` to your MongoDB connection string. Keep `.env` files private; commit the `.env.example` files only. Workspace registration needs MongoDB Atlas or a local replica set.

Open two terminals in the project folder. Start the API in the first:

```powershell
npm run dev:server
```

Start the website in the second:

```powershell
npm run dev:client
```

Open the Vite address shown in the second terminal, usually `http://localhost:5173`.

## If login says “Failed to fetch”

The API must be running. In my current local setup, check `http://localhost:4000/api/health`. Use the port from `PORT` in `server/.env`; the port in `VITE_API_URL` in `client/.env` must match. After changing `client/.env`, stop and restart the client.

If the server says it cannot find a package such as `cookie-parser`, run `npm install` from the project folder, then restart the server.

For Vercel, deploy the API as a separate project. Set `VITE_API_URL` in the client project to `https://your-api-address/api`, and set `CLIENT_URL` in the API project to the client’s full URL. Redeploy both after changing these values.

## Main folders

```text
client/   React website and browser-side vault code
server/   Express API, MongoDB models, and authentication
```

The vault keys stay in browser memory and are cleared on sign-out or after 15 minutes without activity. Blind indexes can reveal when two values match. The SHA-256 commitment helper is an integrity digest, not a zero-knowledge proof.
sjksdfhhjsdlhalhsdfjlhasjld,f,ljdn,vzcs,cn,zn,.cn,nz,cnvlskhdfksj,dzsbn,bcdm,zbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbn