# StockFlow

A simple inventory app built with React, Express, Node.js, and PostgreSQL. It includes signup/login, a dashboard, products, stock adjustments, and organization settings.

## Run locally

Install Node.js 20.19+ and PostgreSQL, and create a database named `stockflow`.

1. In `backend`, copy `.env.example` to `.env`, set your PostgreSQL password, and set a private `JWT_SECRET`.
2. Run `npm install` and `npm start` in `backend`. The server creates its tables on startup and listens on port 5000.
3. In a second terminal, run `npm install` and `npm run dev` in `frontend`. Open the URL Vite prints (usually `http://localhost:5173`).
4. Create an account and start adding products.

The Vite development server proxies API requests to the local backend. The React pages call the API helper, Express routes call controllers, and PostgreSQL stores each organization's data.

## Deploy on Render

This repository includes a Render Blueprint at [`render.yaml`](./render.yaml). It creates one PostgreSQL database and one Node web service that builds and serves both the React app and API on the same origin. Database tables are initialized automatically on server startup. The service builds from the repository root so it can access both `backend` and `frontend`.

1. Push the repository to GitHub and make sure it is public.
2. Sign in to Render, choose **New → Blueprint**, and connect `R-priya55/StockFlow`.
3. Review the services and deploy. Render generates a private `JWT_SECRET`; the database password and connection URL stay in Render.
4. When the deployment finishes, open the web service URL, create an account, and test adding a product and adjusting its stock.

Do not commit `.env` or paste database credentials into the frontend. The frontend build is public by design; database credentials and JWT secrets must remain server-side.

## Main API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create an organization and its first user |
| POST | `/api/auth/login` | Log in |
| GET / PUT | `/api/settings` | Read or update organization settings |
| GET | `/api/dashboard` | Dashboard totals and low-stock products |
| GET / POST | `/api/products` | Search or create products |
| GET / PUT / DELETE | `/api/products/:id` | Read, update, or delete a product |
| PATCH | `/api/products/:id/stock` | Adjust stock |
| GET | `/health` | Check the API and database connection |

All routes other than signup and login require a bearer token. Product data is scoped to the signed-in user's organization.
