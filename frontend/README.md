# StockFlow frontend

The React app provides signup, login, dashboard, product management, inventory, and organization settings pages. It uses React Router and calls the Express API through `src/services/api.js`.

## Run locally

```powershell
npm install
npm run dev
```

The Vite development server proxies `/api` requests to `http://localhost:5000`. Start the backend in a second terminal first. For a production build, run `npm run build`; the static output is written to `dist`.

See the [project setup and deployment guide](../README.md) for PostgreSQL and hosting instructions.
