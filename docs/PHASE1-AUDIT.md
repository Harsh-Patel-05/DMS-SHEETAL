# DMS.SHEETAL COOL — Phase 1 Deep Project Audit

**Date:** September 2026  
**Scope:** Full frontend repository (`src/`, ~100 application files)  
**Mode:** Frontend-only mock DMS with API-ready services layer  
**Instruction:** Audit only — no mandatory code changes in this document.

---

## 1. Executive summary

The application is a **working distribution-management demo** with a strong central domain store (sales, purchases, stock, ledger, GST, parties) and a consistent UI shell. Recent upgrades added executive dashboard widgets, command palette, dark mode, outstanding center, inventory overview, payment allocation, and corrected report data sources.

It is **not yet** a full commercial ERP: role-based access is cosmetic, many advanced features from the upgrade spec are partial or missing (bulk actions, saved views, report builder, import/export centers, approval workflows, invoice templates, offline mock, skeleton loaders, searchable selects everywhere).

**Overall maturity:** **Partial → Advanced (core flows)** | **Basic → Partial (enterprise extras)**

---

## 2. Architecture snapshot

| Layer | Implementation |
|--------|----------------|
| **Framework** | React 19, TypeScript 6, Vite 8 |
| **Routing** | React Router 7, `createBrowserRouter`, lazy routes + Suspense |
| **Styling** | Tailwind CSS 4 (`@theme` in `src/index.css`), semantic tokens + `html.dark` |
| **State** | Zustand: `dms-store.ts` (domain + auth), `prefs-store.ts` (UI prefs) |
| **Persistence** | `localStorage`: `dms-sheetal-cool-v2`, `dms-sheetal-prefs-v1`, table cols `dms-table-cols:*`, drafts `dms-sale-draft`, `dms-purchase-draft` |
| **Data access** | Pages mostly `useDmsStore` directly; `src/services/index.ts` async façade (mostly unused except `searchService`) |
| **Forms** | react-hook-form + Zod on **Login** and **Products** only |
| **Charts** | Recharts (dashboard, inventory, outstanding, reports) |
| **Query** | `@tanstack/react-query` provider in `main.tsx` — **no page usage** |

### Folder structure

```
src/
  app/router.tsx          # Route map
  config/navigation.ts    # Sidebar groups (single source for nav links)
  store/                  # dms-store, prefs-store
  mock/                   # seed.ts, parties.ts (Indian demo data)
  services/index.ts       # API-ready stubs
  types/index.ts          # Domain types
  utils/                  # cn, format, calculations, date-range, *-metrics
  hooks/use-theme-sync.ts
  components/
    auth/                 # ProtectedRoute
    layout/               # AppLayout, Sidebar, Header, CommandPalette, ThemeSync
    shared/               # ReportShell, LineItemsEditor, StatusBadge, ErrorBoundary
    ui/                   # Design system (~27 components)
  pages/
    auth, dashboard, master, parties, transactions,
    inventory, finance, reports, admin
docs/
  PHASE1-AUDIT.md         # This file
```

---

## 3. Routes & navigation

### Route coverage (~52 protected paths)

- **Auth:** `/login`
- **Dashboard:** `/dashboard`
- **Master:** `/master/products`, categories, brands, units, gst-rates (+ product `:id`)
- **Parties:** customers, distributors, suppliers (+ `:id` detail)
- **Transactions:** purchases/sales (list, new, `:id/edit`), invoices, payments, returns, expenses
- **Inventory:** `/inventory/overview`, `/inventory/stock` (same `StockPage` tabs), movement, adjustment, transfer, low-stock
- **Finance:** `/finance/outstanding`
- **Reports:** 16 report routes under `/reports/*`
- **Admin:** users, roles, permissions, notifications, audit-logs, settings

### Routing issues

| Issue | Severity | Detail |
|--------|----------|--------|
| Wildcard `*` → `/dashboard` | P2 | Hides true 404; bad deep links appear “successful” then redirect |
| Spec vs actual paths | P2 | Original spec used `/products`, `/sales`; app uses `/master/*`, `/transactions/*` (internally consistent) |
| Duplicate inventory routes | P3 | `overview` and `stock` both load `StockPage` (intentional tab split) |
| `landingPage` pref unused | P2 | `prefs-store.landingPage` never applied after login |
| `sidebarCollapsed` pref unused | P2 | Stored but Sidebar does not read it |

**Nav vs router:** `navigation.ts` aligns with `router.tsx` (including Outstanding under Reports).

---

## 4. State management & mock data

### Strengths

- Single **source of truth** for business entities in `dms-store.ts`
- **Transactional integrity** on confirm: sale/purchase → stock → ledger → invoices → notifications → audit
- **Counters** for document numbering (SC-*, PO-*, PAY-*)
- **resetDemoData** for demo reset
- Shared **calculation utilities** (`calculateInvoiceTotal`, profit helpers)

### Weaknesses

| Issue | Severity | Detail |
|--------|----------|--------|
| Monolithic store file (~1,400 lines) | P2 | Hard to test/swap for API modules |
| Services bypassed | P2 | UI couples to Zustand; API migration needs refactors per page |
| Passwords in persist | P1 (demo) | Full `users[]` with plaintext passwords in localStorage |
| Edit confirmed sale/purchase | P1 | Limited reversal when editing non-draft docs; risk of desync |
| Distributor ledger sparse | P2 | Distributors not first-class in sale flow; detail uses proxy sales |
| Multi-warehouse | P3 | `locations` + transfers log movement but **no per-location qty** |
| React Query unused | P3 | No loading/retry abstraction for future HTTP |

### Mock data

- **Realistic Indian** names, GST, ₹, Indore-centric addresses
- Seeds in `mock/seed.ts` + `mock/parties.ts` (products, parties, transactions, notifications)
- **Persist merges** user changes with seed on first load; version bump (`v2`) resets structure for new installs only

### LocalStorage keys (known)

- `dms-sheetal-cool-v2` — domain + session
- `dms-sheetal-prefs-v1` — theme, dashboard widgets, density, etc.
- `dms-table-cols:{storageKey}` — column visibility (only if pages pass `storageKey`)
- `dms-sale-draft`, `dms-purchase-draft` — form drafts

---

## 5. Authentication & roles

| Feature | Status |
|---------|--------|
| Login / logout | Works (`LoginPage`, store `login`/`logout`) |
| Protected routes | Session check only (`ProtectedRoute.tsx`) |
| Demo users | 7 roles with quick-pick chips |
| Permissions matrix UI | Editable (`PermissionsPage.tsx`) |
| **Enforcement** | **None** — all modules visible and writable for any logged-in user |
| Permission denied page | Missing |
| Session timeout UX | Missing |
| Remember me | Checkbox not wired (session always persisted via Zustand) |

---

## 6. Design system

### Present (`src/index.css`)

- Brand palette 50–900, semantic success/warning/danger/info
- Surfaces, borders, ink hierarchy, radii, shadows
- Fonts: IBM Plex Sans (UI), DM Sans (display)
- Spacing tokens: `--spacing-page-x/y`, section, stack
- Chart tokens: `--chart-1` … `--chart-5`
- **Dark mode:** `html.dark` overrides (not simple invert)
- Print utilities (`.no-print`)

### Components (`src/components/ui/`)

Button, Input, Select, Checkbox, Badge, Card, Modal/Dialog, ConfirmDialog, Drawer*, Dropdown, Tabs, Toast, Tooltip, Pagination, Table, DataTable, SearchInput, EmptyState, LoadingState, ErrorState*, PageHeader, Breadcrumb*, FormField, StatCard, ChartCard, FilterPanel*

\*Exported but **unused in pages** (Drawer, Breadcrumb, FilterPanel, ErrorState).

### Consistency gaps

- Date preset chips duplicated (Dashboard vs `ReportShell`)
- Raw `<table>` in invoice, permissions, line items vs `Table`/`DataTable` elsewhere
- `navIcons` in `navigation.ts` unused
- Not all list pages pass `storageKey` to DataTable → column prefs inconsistent
- Skeleton loaders: **not implemented** (only `LoadingState` spinner text)

---

## 7. Module maturity matrix

| Module | Rating | Notes |
|--------|--------|-------|
| Auth | Partial | No RBAC enforcement |
| Dashboard | Advanced | KPI trends, widgets, customize; no drag-reorder widgets in UI |
| Master data | Partial | Modal CRUD; Zod only on products |
| Products | Partial | Detail tabs; import/export UI mostly toast stubs |
| Parties | Partial | Customer 360 upgraded; supplier detail thinner |
| Sales | Advanced | Totals, credit, draft, Ctrl+Enter; not full POS keyboard spec |
| Purchases | Partial | Draft + totals; no supplier-centric advanced layout |
| Invoices | Partial | Print layout; no template picker / preview drawer |
| Payments | Partial | Allocation for customers; supplier payables simpler |
| Returns / Expenses | Partial | Functional forms, basic lists |
| Inventory | Advanced (overview) / Partial (ops) | Metrics + alerts; transfer is audit-only qty |
| Reports | Partial | Fixed datasets per report; no report builder |
| Finance outstanding | Partial | Dedicated page + aging; overlaps receivables/payables reports |
| Admin | Partial | Users CRUD; roles read-only list; audit/notifications basic |
| Settings | Partial | Business + appearance; not full categorized settings center |
| Search | Partial | Header + **Ctrl+K** command palette |
| Import / Export centers | Missing | Export mostly CSV in DataTable or toast |
| Approvals / discount limits | Missing | |
| Offline mock | Missing | |

---

## 8. Findings by audit category

### 8.1 Duplicate components / logic

- **Date range presets** — Dashboard + ReportShell + duplicated preset arrays
- **CRUD page pattern** — Similar modal forms across categories/brands/units/GST (acceptable duplication)
- **Outstanding** — `/finance/outstanding` vs `/reports/receivables` and `/reports/payables` (overlapping purpose)
- **Metrics helpers** — Good extraction: `dashboard-metrics`, `inventory-metrics`, `outstanding-metrics`

### 8.2 Hardcoded values

- Demo passwords in seed users
- Chart fallbacks in some older code paths (mostly migrated to CSS vars)
- Fast-moving threshold (e.g. 5 units / 30 days) in inventory metrics
- Credit/discount limits **not** role-based in UI

### 8.3 Broken / weak interactions

| Item | Severity |
|------|----------|
| Cancel sale/purchase in store, **no list UI** | P1 |
| Edit sale on confirmed doc may not restore stock correctly | P1 |
| `allocateCustomerPayment` + `recordPayment` — customer balance logic must stay consistent (verify edge cases) | P2 |
| Notification links in **seed** data — fixed to `/transactions/*`; runtime store links fixed in prior pass | — |
| Distributor “Receive payment” — party type may not match distributor ledger model | P2 |

### 8.4 Dead routes / nav

- No dead nav entries found (all `to:` paths exist in router)
- `*` catch-all masks unknown URLs

### 8.5 Loading / empty / error states

| State | Coverage |
|-------|----------|
| Route lazy load | `LoadingState` in Suspense |
| DataTable empty | `emptyTitle` widely used |
| Entity not found | `EmptyState` on detail pages |
| DataTable loading | `isLoading` prop exists, **rarely used** |
| ErrorState component | **Unused** in pages |
| ErrorBoundary | Wraps app (`App.tsx`) |
| Skeletons | **Missing** |

### 8.6 Validation

- **Strong:** Login, Products (Zod)
- **Weak:** Parties, master CRUD (except products), sale/purchase (store validates stock/credit partially), payments, expenses
- No shared validation module (mobile, GST, email) as reusable rules

### 8.7 UX / spacing / typography

- Generally consistent PageHeader + card + DataTable rhythm
- Long forms (sale/purchase) improved but still dense on mobile
- Dashboard widget grid strong on desktop; mobile chart stacking acceptable
- Settings still single-page form, not tabbed settings center

### 8.8 Accessibility

- Partial: search `aria-label`, breadcrumb component unused
- Sidebar accordion: limited `aria-expanded` / focus trap patterns
- Command palette: keyboard nav implemented; focus trap quality not audited to WCAG
- Color contrast in dark mode: designed but not formally verified

### 8.9 Mobile

- Responsive sidebar drawer + scrollable tables
- No bottom action bar; no mobile-specific sale POS layout
- Sticky totals on sale form (desktop-oriented)

### 8.10 State synchronization

- **Good:** Confirm sale/purchase updates stock, ledger, dashboard inputs
- **Risk:** `.find()` in Zustand selectors on detail pages (stable if parent array reference stable; prefer `useMemo` from full entity list)
- **Remaining `.find` selectors:** `ProductDetailPage`, `CustomerDetailPage`, `SupplierDetailPage`, `DistributorDetailPage`, `InvoiceDetailPage`, sale/purchase edit `existing`

### 8.11 Mock-data architecture

- **Good:** Centralized seeds, typed entities, single store
- **Gap:** No separate MockDatabase / repository layer — store is both DB and business logic
- **Gap:** No import validation pipeline

---

## 9. Tables & DataTable

### Implemented

- Search (client), pagination props, empty states
- Optional density (prefs default)
- Column visibility + localStorage when `storageKey` set
- Client-side sort when `sortable` and no `onSortChange`
- CSV export of visible columns

### Missing vs enterprise spec

- Multi-select rows / bulk actions
- Sticky header/columns
- Saved views (filters + sort + columns + page size)
- Advanced filter builder (AND/OR)
- Virtualization for large lists
- Widespread `storageKey` adoption on list pages

---

## 10. Charts

- Dashboard, inventory overview, outstanding, daily summary, P&L
- Uses Recharts + theme chart CSS variables (dashboard/inventory/outstanding)
- Dark mode: relies on token colors; tooltips/grid use shared stroke helpers

---

## 11. Priority issue register

### P0 — Critical (fix before claiming “production demo”)

_None open after recent report/link fixes; monitor payment allocation and confirmed-doc edits._

### P1 — High

1. RBAC not enforced (permissions UI only)
2. Cancel sale/purchase not exposed in UI
3. Confirmed document edit / stock reversal gaps
4. Plaintext passwords in persisted store (demo security)
5. Forms lack consistent Zod validation outside products/login

### P2 — Medium

1. Services layer unused; pages tightly coupled to store
2. React Query unused
3. Unused prefs: `landingPage`, `sidebarCollapsed`; widget `reorderWidgets` not in UI
4. Overlapping outstanding/report pages
5. Import/export/report builder absent
6. Invoice: no templates, preview drawer, share/download mock
7. Admin roles page read-only; no admin dashboard
8. FilterPanel, Breadcrumb, Drawer unused
9. Wildcard routing hides 404

### P3 — Low / polish

1. Skeleton loaders
2. Offline mock indicator
3. Session timeout / logout confirm
4. Virtualized tables
5. Multi-warehouse stock quantities
6. Bundle size (dashboard + main chunk >500KB)

---

## 12. Recommended implementation order (post-audit)

1. **RBAC** — `usePermission(module, action)` + route guards + hidden nav
2. **Transaction safety** — Cancel UI; block or reverse edit on confirmed docs
3. **Adopt services** incrementally for new features; keep store as implementation
4. **Enterprise tables** — bulk select, saved views, FilterPanel on key lists
5. **Billing** — invoice preview drawer + template setting
6. **Import / export centers** — frontend mock pipelines
7. **Settings center** — tabbed categories per spec
8. **Approvals + discount limits** — frontend workflow states
9. **Skeletons + ErrorState** on heavy pages
10. **Mobile pass** on sale/purchase flows
11. **Performance** — split dashboard charts; optional virtualization

---

## 13. Phase 1 completion checklist

| Audit task | Done |
|------------|------|
| Inspect folder structure, components, pages | Yes |
| Routes, state, mock, localStorage, services | Yes |
| Hooks, utils, forms, tables, charts | Yes |
| Auth & roles | Yes |
| Responsive & design system | Yes |
| Identify duplicates, hardcoding, gaps | Yes |
| Document without mass code rewrite | Yes |

**Next phase:** Proceed with prioritized fixes from §12 without rebuilding from scratch.

---

*Generated from repository inspection. Re-run audit after major releases.*
