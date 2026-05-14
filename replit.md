# MY EX-IMP MANAGER — Midas Manager

A professional Ethiopia-focused Import/Export management web app for Midas Trading Co. Covers the full trade lifecycle: LC financing, shipment tracking, warehouse inventory, export commodity lots, CAD payment collection, exchange rates, and finance/petty cash.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/eximp-manager run dev` — run the frontend (dynamic port via Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Recharts, wouter (routing)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec — must stay at 3.0.3)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/` — OpenAPI 3.0.3 spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/` — generated React Query hooks and Zod schemas (do not edit manually)
- `lib/db/src/schema/` — Drizzle ORM table definitions (7 files: lcs, shipments, inventory, sales, export-lots, cads, exchange-rates, finance/petty-cash, activity)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/eximp-manager/src/pages/` — all 10 frontend page components
- `artifacts/eximp-manager/src/components/layout/AppLayout.tsx` — main app shell with sidebar nav
- `artifacts/eximp-manager/src/lib/format.ts` — `formatCurrency`, `formatDate`, `formatNumber`

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → React Query hooks. Never call the API manually.
- **Hook destructuring**: All hooks return `UseQueryResult<T>`. Always use `const { data: foo } = useGetFoo()`, never `const foo = useGetFoo()`.
- **Shared proxy routing**: API is mounted at `/api`, frontend at `/`. The Replit reverse proxy routes by path — never hardcode ports in application code.
- **Ethiopian bank compliance**: NBE mandates 30% USD retention on export CAD receipts. The CAD payment summary always shows `usdRetained` (30% of FOB). Banks: CBE, Dashen, Awash, Abyssinia.
- **Petty cash rules**: Ceiling ETB 15,000; max per voucher ETB 2,000. Enforced server-side.

## Product

**10 fully functional pages:**
1. **Dashboard** — KPI cards (active shipments, LCs, customs at risk, revenue, on-time rate), trade volume area chart, cash flow bar chart, recent activity feed, finance snapshot
2. **LC Management** — credit facility utilisation, filter by status, full CRUD with EC number tracking
3. **Import Shipments** — card-based view with progress bars, vessel/forwarder/B/L tracking
4. **Import Inventory** — warehouse stock table + domestic sales tab, summary KPIs
5. **Export Lots** — commodity tabs (Coffee/Sesame/Lentils/Chickpeas/Flaxseed), MT stock summaries, phyto expiry tracking
6. **Export Shipments** — outbound shipment cards with freight cost tracking
7. **CAD Management** — payment register with NBE 30% retention display, CRUD
8. **Exchange Rates** — live rate comparison grid across CBE/Dashen/Awash/Abyssinia for USD & EUR
9. **Finance** — 3-tab layout: Overview (obligations, cash flow chart), Transactions ledger, Petty Cash voucher management
10. **Settings** — company profile placeholder

## User preferences

- Ethiopia-focused: ETB primary currency, USD for international trade
- Seeded data matches realistic Ethiopian trading company (coffee, sesame, lentils exports; industrial equipment imports)
- Professional dark sidebar navigation, light content area

## Gotchas

- OpenAPI spec MUST stay at version 3.0.3 — Orval fails on 3.1.
- `info.title` in the spec MUST stay `Api` — it controls generated filenames.
- Run `pnpm --filter @workspace/api-spec run codegen` after any spec changes.
- Run `pnpm --filter @workspace/db run push` after schema changes.
- Hook data is always `undefined` on first render (loading state) — always use `data ?? []` or `data ?? defaultValue`.
- `pnpm run typecheck` is canonical; do not trust editor LSP alone.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema entry: `lib/db/src/schema/index.ts`
