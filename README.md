# LedgerGuard Billing Engine

**LedgerGuard: Dynamic Multi-Tenant Zero-Knowledge Billing Engine** is a MERN internship project. The current implementation includes workspace registration and sign-in, tenant-scoped customers and billing plans, monthly usage records, and draft invoice generation.

## Current milestone

- Create a workspace and owner account.
- Sign in with a password hash stored by the API.
- Add and remove customers.
- Create per-unit billing plans.
- Record customer usage by billing month.
- Generate one draft invoice per customer and month from saved usage.
- Move invoices through draft, sent, and paid statuses.
- Search invoices by customer or billing month, filter by status, and export the visible results to CSV.
- Keep customer reads and deletes scoped to the signed-in account's workspace.
- Use a responsive React interface.

Prices are stored as integer paise to avoid floating-point invoice totals. This prototype assumes INR, whole-number quantities, and no tax or discounts. A fixed monthly charge can be represented by a plan with unit `month` and quantity `1`.

The current app does **not** yet generate a zero-knowledge proof. It does not call ordinary encryption or hashing a proof.

## Technology

- MongoDB and Mongoose
- Express and Node.js
- React and Vite

## Run locally on Windows

1. Install and start MongoDB locally, or create a MongoDB Atlas database.
2. In PowerShell, open this project folder and install the packages:

   ```powershell
   npm install
   Copy-Item server/.env.example server/.env
   ```

3. Edit `server/.env`. Set `MONGODB_URI` to your local or Atlas connection string. Replace `JWT_SECRET` with a random string of at least 24 characters.
4. Open a first PowerShell terminal in the project folder and start the API:

   ```powershell
   npm run dev:server
   ```

5. Open a second PowerShell terminal in the same folder and start the React app:

   ```powershell
   npm run dev:client
   ```

6. Open the local address printed by Vite, usually `http://localhost:5173`.

The React development server forwards `/api` requests to the Express API at `http://localhost:4000`.

## Deploy to Vercel

This repository has separate `client` and `server` apps. Create two Vercel projects from the same GitHub repository and set each project's **Root Directory**:

### Backend project

1. Import the repository as a new Vercel project.
2. Set **Root Directory** to `server` and leave Express framework/build detection on its defaults. Vercel recognizes the Express entrypoint at `src/server.js`.
3. Add these Project Environment Variables:
   - `MONGODB_URI`: your hosted MongoDB connection string.
   - `JWT_SECRET`: a long, random secret (at least 24 characters).
   - `CLIENT_URL`: the full production URL of the React client, such as `https://your-client.vercel.app`.
4. Deploy and open `https://your-backend.vercel.app/api/health`; it should return a JSON status response.

### Frontend project

1. Import the same repository as another Vercel project.
2. Set **Root Directory** to `client` and keep the Vite build defaults.
3. Add `VITE_API_URL` with the backend's full origin, such as `https://your-backend.vercel.app` (no trailing slash).
4. Redeploy the frontend. Vite embeds this value at build time, so changing it requires a new deployment.

After both projects deploy, try creating a workspace on the frontend URL. If Vercel environment variables are changed, redeploy the affected project so the deployment receives the new values.

## Project layout

```text
client/                    React interface
  src/App.jsx              Sign-in, workspace dashboard, customer actions
  src/api.js               Small fetch helper for the API
  src/style.css            Responsive styling
  vite.config.js            Local API proxy
server/                    Express API
  src/models/              Tenant, user, customer, plan, usage, and invoice schemas
  src/middleware/           Signed-in user lookup
  src/routes/               Account, customer, plan, usage, and invoice endpoints
  src/app.js                API configuration and error handling
  src/server.js             MongoDB connection and server startup
  .env.example              Local environment settings
```

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a workspace and owner account |
| `POST` | `/api/auth/login` | Sign in and receive a short-lived token |
| `GET` | `/api/auth/me` | Return the signed-in account and workspace |
| `GET` | `/api/customers` | List customers in the signed-in workspace |
| `POST` | `/api/customers` | Add a customer to the signed-in workspace |
| `DELETE` | `/api/customers/:customerId` | Remove a customer from that workspace |
| `GET` | `/api/plans` | List the workspace's active billing plans |
| `POST` | `/api/plans` | Create a per-unit billing plan |
| `GET` | `/api/usage?period=YYYY-MM` | List usage for a billing month |
| `POST` | `/api/usage` | Record usage for a customer and plan |
| `DELETE` | `/api/usage/:usageId` | Remove usage before an invoice is generated |
| `GET` | `/api/invoices` | List draft invoices in the workspace |
| `POST` | `/api/invoices` | Generate a draft invoice from saved usage |
| `PATCH` | `/api/invoices/:invoiceId/status` | Move an invoice from draft to sent or sent to paid |
| `GET` | `/api/health` | Check whether the API is responding |

The API gets the workspace from the authenticated user. It does not trust a workspace ID sent by the browser. This is the initial tenant-isolation pattern; it still needs a security review before any real customer data or public deployment.

## Next steps

1. Run and review the customer, plan, usage, and invoice flow locally and through the deployed API.
2. Confirm billing rules, including currency, tax, discounts, and recurring charges, with the mentor.
3. Add a printable invoice document if required by the mentor.
4. Design a narrowly scoped, real proof that validates an invoice total while keeping the line-item inputs private.
5. Document the proof's public inputs, private inputs, and limitations; add the project report, slides, and demo.

## Local-development reminders

- Keep `.env` private and do not commit it.
- The session token is stored in browser local storage for this learning prototype. Review token storage and authentication before deployment.
- Use demo/test data only until tenant isolation and authentication have been reviewed.
