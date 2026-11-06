# StockFlow API

The Express API uses PostgreSQL for organization, user, and product data. See the [project setup guide](../README.md) for local development and deployment.

## Run locally

1. Copy `.env.example` to `.env` and set your PostgreSQL connection details and a private `JWT_SECRET`.
2. Install dependencies with `npm install`.
3. Create the tables with `npm run db:init`.
4. Start the API with `npm start`.

The API listens on port `5000` by default. `GET /health` checks both the API and database connection.

## Environment variables

- `DATABASE_URL` — optional PostgreSQL connection string; use this instead of the `DB_*` values below when provided.
- `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT` — local PostgreSQL connection settings.
- `DATABASE_SSL=true` — enable SSL for providers that require it.
- `JWT_SECRET` — private signing key used for login tokens.
- `FRONTEND_URL` — allowed frontend origin(s), comma-separated when needed. Defaults to `http://localhost:5173`.

Never commit `.env` or put backend secrets in frontend variables.
