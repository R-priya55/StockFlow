# StockFlow

A small, organization-based inventory app built with React, Express, Node.js, and PostgreSQL. The code is kept intentionally straightforward: React pages call a small API helper, Express routes call controllers, and PostgreSQL stores the data.

## What it can do

- Create an organization and user account, then log in
- View product totals, stock value, and low-stock alerts on the dashboard
- Add, search, edit, and delete products
- Add or remove stock from the inventory page
- Set the organization name and default low-stock limit
- Keep each organization's products separate

## Project layout

```text
StockFlow/
├── backend/
│   ├── config/       # PostgreSQL connection
│   ├── controllers/  # Login, settings, and product logic
│   ├── db/           # Database schema
│   ├── routes/       # API endpoints
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        └── services/ # Shared API helper
```

## Run it locally

### 1. Install the requirements

Install Node.js 20.19+ (or 22.12+) and PostgreSQL. Create an empty database named `stockflow` using pgAdmin or the PostgreSQL command line.

### 2. Configure and prepare the backend

In a terminal:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` and set your PostgreSQL password. Replace `JWT_SECRET` with a private random value; never commit `.env` or share its values.

```powershell
npm install
npm run db:init
npm start
```

The API runs at `http://localhost:5000`. Keep this terminal open.

### 3. Run the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The Vite development server forwards `/api` requests to the backend. Create your first user with **Create an account**.

## Deploy it

The easiest beginner-friendly layout is a static React site, an Express web service, and a managed PostgreSQL database. Render can host these as separate services; any provider that supports the same setup also works.

1. Push this project to your public GitHub repository.
2. Create a PostgreSQL database with your hosting provider. Keep its credentials private and note its connection string.
3. Create a Node web service from the repository with `backend` as its root directory and `npm start` as its start command. Add these environment variables in the host dashboard:
   - `DATABASE_URL`: the database connection string
   - `JWT_SECRET`: a newly generated, private random value of at least 32 characters
   - `FRONTEND_URL`: the final deployed frontend origin, such as `https://your-site.example.com`
   - `DATABASE_SSL=true` only if your database provider requires SSL for its connection
4. Open a shell for the backend service and run `npm run db:init` once to create the tables.
5. Create a static site from the same repository with `frontend` as its root directory, `npm run build` as its build command, and `dist` as its publish directory. Set `VITE_API_URL` to the backend URL followed by `/api`, for example `https://your-api.example.com/api`.
6. Configure the static host's single-page-app fallback so unknown paths serve `/index.html`. Set `FRONTEND_URL` on the API to the static site's exact HTTPS origin, then redeploy the API.
7. Open the public site, create an account, and test adding a product and changing stock.

Do not put database credentials or `JWT_SECRET` in frontend variables: frontend variables are public in the built website. Free hosting plans may sleep or have limits; check your provider's current database retention and service limits before using real business data.

## API overview

| Method | Route | What it does |
|---|---|---|
| POST | `/api/auth/signup` | Create an organization and its first user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the current user |
| GET / PUT | `/api/settings` | Read or update organization settings |
| GET | `/api/dashboard` | Read dashboard totals and low-stock items |
| GET / POST | `/api/products` | Search or add products |
| GET / PUT / DELETE | `/api/products/:id` | Read, edit, or delete a product |
| PATCH | `/api/products/:id/stock` | Adjust stock |
| GET | `/health` | Check API and database availability |

All routes other than signup and login require a bearer token. Each product query is scoped to the signed-in user's organization.
