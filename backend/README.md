# StockFlow API

Express API for the StockFlow inventory application. See the [project README](../README.md) for local setup and Render deployment.

## Local development

1. Copy `.env.example` to `.env` and set your PostgreSQL connection details and a private `JWT_SECRET`.
2. Run `npm install` and `npm start`. The server creates the database tables on startup.
3. In a separate terminal, start the frontend with `npm install` and `npm run dev` from `frontend`.

`GET /health` checks both the API and its PostgreSQL connection.

`DATABASE_URL` can replace the individual `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, and `DB_PORT` settings. Set `DATABASE_SSL=true` if your hosted database requires SSL. `FRONTEND_URL` is only needed when hosting the frontend on a different origin.

Never commit `.env` or expose backend secrets through frontend variables.
