# GreenCharge — Localhost Frontend

## Run locally

From this folder:

```bash
python -m http.server 5500
```

Then open:

http://localhost:5500

You can also use VS Code + Live Server.

## Current storage

This version uses browser `localStorage` for the prototype:
- registered accounts
- charging-session demo records

The final version should NOT store real passwords this way. Once the backend is added, authentication and passwords should be handled server-side with secure password hashing.

The final screen has a **Save my demo data** button that exports the current local demo records as `greencharge-demo-data.json`.

## Suggested final architecture

Frontend:
- index.html
- style.css
- app.js

Backend:
- Node.js / Express
- API routes
- PostgreSQL/Supabase database
- secure authentication
- optimization service

The frontend can later call backend endpoints such as:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/optimize
- POST /api/bookings
- GET /api/stations
- GET /api/energy
