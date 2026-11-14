<<<<<<< HEAD
# LedgerGuard Billing Engine

**LedgerGuard: Dynamic Multi-Tenant Zero-Knowledge Billing Engine** is a MERN internship project. This starter implements workspace registration and sign-in plus tenant-scoped customer records. Billing plans, usage invoices, and a real cryptographic zero-knowledge proof are future milestones.

## Current milestone

- Create a workspace and owner account.
- Sign in with a password hash stored by the API.
- Add and remove customers.
- Keep customer reads and deletes scoped to the signed-in account's workspace.
- Use a responsive React interface.

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

## Project layout

```text
client/                    React interface
  src/App.jsx              Sign-in, workspace dashboard, customer actions
  src/api.js               Small fetch helper for the API
  src/style.css            Responsive styling
  vite.config.js            Local API proxy
server/                    Express API
  src/models/              Tenant, user, and customer schemas
  src/middleware/           Signed-in user lookup
  src/routes/               Account and customer endpoints
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
| `GET` | `/api/health` | Check whether the API is responding |

The API gets the workspace from the authenticated user. It does not trust a workspace ID sent by the browser. This is the initial tenant-isolation pattern; it still needs a security review before any real customer data or public deployment.

## Next steps

1. Add billing plans and usage records.
2. Define and implement invoice calculations in cents/paise using integer amounts.
3. Create invoice history and status views.
4. Design a narrowly scoped, real proof that validates an invoice total while keeping the line-item inputs private.
5. Document the proof's public inputs, private inputs, and limitations; add the project report, slides, and demo.

## Local-development reminders

- Keep `.env` private and do not commit it.
- The session token is stored in browser local storage for this learning prototype. Review token storage and authentication before deployment.
- Use demo/test data only until tenant isolation and authentication have been reviewed.
=======
# ledgerguard-billing-engine
>>>>>>> fe2daf0550d500ae1d3e32b57ef0be64d1c22714
