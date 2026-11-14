# Project progress checklist

Based on the progress screen shared by the project owner:

| Item | Status at screenshot | Next action |
| --- | --- | --- |
| Select project | Complete | Already saved |
| Connect GitHub repository and branch | Pending | Create `ledgerguard-billing-engine`, then connect the repo and choose the branch in the tracker |
| Commit on 10 different days | 0/10 | Make a meaningful commit on each of 10 actual calendar days; the count cannot be completed in one day |
| Submit two weekly write-ups | 0/2 | Review the Week 1 draft and use the Week 2 template after recording actual work |

## Deployment update

- React client deployed on Vercel.
- Express API still needs its own Vercel project with root directory `server`.
- After the API is deployed, set `VITE_API_URL` in the client Vercel project to the backend deployment origin and redeploy the client.

## Current project work

- Required stack confirmed: MERN.
- Initial React/Express/MongoDB workspace and customer-record foundation prepared.
- MongoDB connection and browser setup still need to be configured locally.
- Billing and cryptographic zero-knowledge proof are not implemented yet.

## Repository setup

Recommended repository: **`ledgerguard-billing-engine`**.

The GitHub connection step needs the repository created under the account selected in the progress tracker. After connecting it, select the branch where the project work will be pushed. Keep `.env` files and database credentials out of the repository.
