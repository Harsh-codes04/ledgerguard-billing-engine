# LedgerGuard

LedgerGuard is my MERN project for managing customers, usage, and invoices in separate workspaces.

## What works

- Create a workspace and sign in.
- Add and search customers. A customer with billing history cannot be deleted.
- Create per-unit billing plans and record monthly usage.
- Generate draft invoices, mark them sent or paid, filter them, and export them as CSV.
- Open the browser vault demo from the workspace header.

## Run locally

Install Node.js 20 or newer and MongoDB. From the project folder, install the packages:

```powershell
npm install
```

Copy the example environment files if you do not have local ones yet:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Set `MONGO_URI` in `server/.env`. Generate an RSA key pair from the project folder and copy the two printed values into `JWT_PRIVATE_KEY_BASE64` and `JWT_PUBLIC_KEY_BASE64` in `server/.env`:

```powershell
npm run keys:generate --workspace server
```

Keep the private key value on the server and out of GitHub. The client example uses `http://localhost:5000/api`; change it if your API uses a different port. Workspace registration uses MongoDB transactions, so use Atlas or a local replica set.

Open two terminals in the project folder. Run the API in one:

```powershell
npm run dev:server
```

Run the website in the other:

```powershell
npm run dev:client
```

Open the address printed by Vite, usually `http://localhost:5173`.

## Deploying

The client and API are separate deployments. Set `VITE_API_URL` in Vercel to the API address ending in `/api`. In the API service, set `CLIENT_URL` to the Vercel site address, `MONGODB_URI` to the Atlas connection string, and both generated RSA key values. The private key stays in Render; the public key is used to verify tokens. Deploy again after changing environment settings. Existing sessions need to sign in again after switching to RS256.

## Current limitation

The vault is a browser demo. The encryption helpers are not connected to customer or billing requests yet, so those records are currently stored as regular database fields. Do not use real customer or payment information for now.
