# DMS.SHEETAL COOL

Professional frontend Distribution Management System for cooling products & appliances.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- React Router
- Zustand (persisted mock data)
- TanStack Query
- React Hook Form + Zod
- Recharts + Lucide React

## Run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically http://localhost:5173).

## Demo login

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `superadmin` | `admin123` |
| Admin | `admin` | `admin123` |
| Manager | `manager` | `manager123` |
| Sales Executive | `sales` | `sales123` |
| Stock Manager | `stock` | `stock123` |
| Accountant | `accounts` | `accounts123` |
| Viewer | `viewer` | `viewer123` |

## Architecture

```
src/
  components/ui|layout|shared|auth
  pages/          # feature screens
  services/       # API-ready service layer (mock today)
  store/          # Zustand + localStorage persistence
  mock/           # Indian business seed data
  types/ hooks/ utils/
```

Business flows (purchase → stock ↑, sale → stock ↓, payments, ledger, returns, audit logs) run entirely in the frontend store. Swap `src/services` implementations for Django REST later without rewriting UI.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build
