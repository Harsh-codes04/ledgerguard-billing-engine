# Project progress checklist

Based on the progress screen shared by the project owner:

| Item | Latest status | Next action |
| --- | --- | --- |
| Select project | Complete | Already saved |
| Connect GitHub repository and branch | Complete | Repository and branch are linked |
| Commit on 10 different days | 1/10 | The tracker needs 9 more distinct commit days; commits need at least 50 changed characters |
| Submit two weekly write-ups | Complete | Both Week 1 and Week 2 write-ups show submitted |

The latest screenshot shows three valid Week 1 commits all on 14 Nov 2026, which count as one day, and no Week 2 commits yet. Do not backdate commits. Ask the mentor whether the evaluation window can be extended if the 10-day target cannot be reached during Weeks 1–2.

## Deployment update

- React client deployed on Vercel.
- Express API still needs its own Vercel project with root directory `server`.
- After the API is deployed, set `VITE_API_URL` in the client Vercel project to the backend deployment origin and redeploy the client.
- Workspace registration is not expected to work until the API and MongoDB are available.

## Current project work

- Required stack confirmed: MERN.
- React/Express/MongoDB workspace foundation now includes customers, billing plans, monthly usage records, draft invoice generation, invoice line-item details, and draft → sent → paid status changes.
- MongoDB connection and browser setup still need to be configured locally.
- Cryptographic zero-knowledge proof is not implemented yet.

## Repository setup

Recommended repository: **`ledgerguard-billing-engine`**.

The repository and branch are connected in the tracker. Keep `.env` files and database credentials out of the repository.
