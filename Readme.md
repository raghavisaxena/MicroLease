# MicroLease (MVP)

MicroLease is an equipment leasing MVP connecting owners (lessors) with renters (lessees). This project uses Node.js, Express, Sequelize (MySQL), JWT auth, and a minimal static frontend.

## Features (MVP)
- Register / Login (lessor, lessee, admin)
- Lessor: create item listings
- Lessee: request leases for a date range
- Owner can approve/reject lease
- Payment records (mocked in MVP)
- Admin endpoint to list payments

## Requirements
- Node.js (v16+ recommended)
- MySQL
- npm

## Setup (local)
1. Clone or copy the files. Create folders `backend` and `frontend` accordingly.
2. In `backend` folder:
   - Copy `.env.example` to `.env` and fill values (`DB_PASS`, `JWT_SECRET`).
   - Install dependencies:
     ```
     npm install
     ```
   - Create the database in MySQL matching `DB_NAME` in .env (e.g., `microlease_db`).
   - Seed sample data:
     ```
     npm run seed
     ```
   - Start the server:
     ```
     npm run start
     ```
   - API will run at `http://localhost:5000/`

3. Frontend:
   - Open `frontend/index.html` in browser (or serve with a static server).
   - Use `login.html` to register/login. Seeded users:  
     - alice@example.com (lessor) / password  
     - bob@example.com (lessee) / password  
     - admin@example.com (admin) / adminpass

## API Endpoints (MVP)
- `POST /api/auth/register` — {name,email,password,role}
- `POST /api/auth/login` — {email,password}
- `GET /api/items` — list available items
- `POST /api/items` — create item (lessor only)
- `POST /api/leases` — request lease (lessee only)
- `POST /api/leases/:id/decision` — approve/reject (owner only)
- `GET /api/leases` — list leases (for lessee or lessor)
- `GET /api/payments` — list payments (admin only)

## Notes & Next steps
- Payments are mocked on approval. Integrate Razorpay/Stripe for real payments.
- Add file/image uploads (multer + S3 or local).
- Add validations, rate-limits, pagination, search, filters.
- Move frontend to React for a modern UI.
- Add Dockerfile & docker-compose for easy deployment.

