# Insurance Management Platform

A production-grade, full-stack enterprise web application built for managing customers, insurance policies, premium payments, claims, document uploads, and real-time analytics.

---

## Architecture & Tech Stack

### Monorepo Folder Structure
```
Insurance Management Platform/
├── server/                    # Express.js REST API Server
│   ├── prisma/                # Prisma PostgreSQL Schema & Migrations
│   ├── src/
│   │   ├── config/            # DB & Environment Configuration
│   │   ├── controllers/       # Auth, Customer, Policy, Premium, Claim, Document, Report
│   │   ├── middleware/        # JWT Auth, Role Guard, Zod Validator, Multer Upload, ErrorHandler
│   │   ├── routes/            # Express Routers
│   │   ├── services/          # PDFKit Receipt Generator & Cron Job Service
│   │   ├── utils/             # Policy Number Generator & Pagination Helper
│   │   ├── validators/        # Zod Schemas
│   │   ├── app.js             # Express App Configuration
│   │   └── server.js          # Entry Point & Process Handlers
│   ├── uploads/               # Uploaded Documents Directory
│   └── package.json
├── client/                    # Vite React Frontend
│   ├── src/
│   │   ├── components/        # Reusable DataTable, Modal, Layout, Navbar, Sidebar
│   │   ├── context/           # AuthContext (JWT State & Token Refresh)
│   │   ├── pages/             # Dashboard, Customers, Policies, Premiums, Claims, Documents
│   │   ├── routes/            # Protected Routes & Role Guards
│   │   ├── services/          # Axios Client with 401 Auto-Refresh Interceptor
│   │   ├── App.jsx            # Main React Component & Routing
│   │   └── index.css          # Tailwind CSS & Glassmorphism Utilities
│   └── package.json
├── postman_collection.json    # Exported API Collection
└── README.md
```

### Technology Stack
- **Frontend**: React.js (Vite), Tailwind CSS, React Router v6, Axios, Chart.js, React Hook Form, Zod, React Hot Toast, Lucide Icons.
- **Backend**: Node.js, Express.js, Prisma ORM, PostgreSQL.
- **Authentication**: JWT (Access Token 15 min + Refresh Token 7 days in httpOnly cookie), bcryptjs.
- **FileUpload**: Multer (stores in `/server/uploads`, validates size <= 5MB & mime types: pdf/jpg/png).
- **PDF Generation**: PDFKit (official payment receipts).
- **Scheduling**: Node-Cron (hourly policy expiry check & overdue premium detection).

---

## Local Setup & Quickstart

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database running locally or remotely (e.g. Supabase, Railway, Neon)

### 1. Database Setup & Prisma Migration
```bash
cd server
npm install
# Configure DATABASE_URL in server/.env
npx prisma migrate dev --name init
npx prisma generate
```

### 2. Backend Startup
```bash
# In /server folder
npm run dev
# Server starts on http://localhost:5000
```

### 3. Frontend Startup
```bash
cd ../client
npm install
npm run dev
# Vite client starts on http://localhost:5173
```

---

## API Endpoints Matrix

| Module | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| **Auth** | POST | `/api/auth/register` | Public | Register new CUSTOMER account |
| **Auth** | POST | `/api/auth/login` | Public | Login & receive JWT access + refresh cookie |
| **Auth** | POST | `/api/auth/refresh` | Public | Rotate refresh token for new access token |
| **Auth** | POST | `/api/auth/logout` | Authenticated | Clear session refresh cookie |
| **Customer** | GET | `/api/customers` | ADMIN, AGENT, CUSTOMER | List paginated customers / search |
| **Customer** | POST | `/api/customers` | ADMIN, AGENT | Create new customer profile |
| **Customer** | PUT | `/api/customers/:id` | ADMIN, AGENT, CUSTOMER | Update customer details |
| **Customer** | DELETE | `/api/customers/:id` | ADMIN | Delete customer record |
| **Policy** | GET | `/api/policies` | ADMIN, AGENT, CUSTOMER | List policies with status filters |
| **Policy** | POST | `/api/policies` | ADMIN, AGENT | Issue new policy with auto policyNumber |
| **Policy** | PUT | `/api/policies/:id/renew` | ADMIN, AGENT | Extend end date & create new premium |
| **Policy** | PUT | `/api/policies/:id/cancel` | ADMIN, AGENT | Cancel policy |
| **Premium** | GET | `/api/premiums` | ADMIN, AGENT, CUSTOMER | Payment history |
| **Premium** | GET | `/api/premiums/overdue` | ADMIN, AGENT, CUSTOMER | List overdue premium invoices |
| **Premium** | PUT | `/api/premiums/:id/pay` | ADMIN, AGENT, CUSTOMER | Record premium payment |
| **Premium** | GET | `/api/premiums/:id/receipt` | ADMIN, AGENT, CUSTOMER | Download PDF payment receipt |
| **Claim** | GET | `/api/claims` | ADMIN, AGENT, CUSTOMER | List claims |
| **Claim** | POST | `/api/claims` | ADMIN, AGENT, CUSTOMER | Submit claim (Requires ACTIVE policy) |
| **Claim** | PUT | `/api/claims/:id/review` | ADMIN, AGENT | Approve or reject claim with notes |
| **Document**| POST | `/api/documents/upload` | ADMIN, AGENT, CUSTOMER | Upload PDF/JPG/PNG file (max 5MB) |
| **Document**| GET | `/api/documents/:id/download` | ADMIN, AGENT, CUSTOMER | Download uploaded document |
| **Reports** | GET | `/api/reports/dashboard` | ADMIN, AGENT, CUSTOMER | Aggregate stats for Chart.js dashboard |

---

## Deployment Instructions

### Backend (Render / Railway)
1. Push repository to GitHub.
2. Create a new Web Service on Render/Railway pointing to the `/server` folder.
3. Set environment variables in platform dashboard:
   - `PORT=5000`
   - `DATABASE_URL=postgresql://...`
   - `JWT_SECRET=your_production_access_secret`
   - `JWT_REFRESH_SECRET=your_production_refresh_secret`
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-client-app.vercel.app`
4. Set Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
5. Set Start Command: `node src/server.js`

### Frontend (Vercel)
1. Import project in Vercel pointing to the `/client` directory.
2. Set Build Command: `npm run build` and Output Directory: `dist`.
3. Set Environment Variable:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
4. Deploy application.
