# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**SFFSyC** — Sistema de la Subdirección de Fortalecimiento Familiar, Social y Comunitario del DIF Municipal de Chihuahua. Internal operational tool (not public software) for managing community centers, beneficiaries, classes, and events.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # prisma generate + next build — always run before pushing
npm run lint         # ESLint check
npm run db:studio    # Prisma Studio (visual DB browser)
npm run db:migrate   # Create and apply a migration (uses DIRECT_URL)
```

**Critical**: Run `npm run build` locally before every `git push`. Vercel will reject the deploy on TypeScript errors. ESLint is intentionally disabled in builds (`eslint.ignoreDuringBuilds: true` in `next.config.mjs`) so only TypeScript errors block deploys.

## Stack

- **Next.js 14** App Router (no Pages Router anywhere)
- **TypeScript** strict mode
- **Prisma 6** — ORM, schema at `prisma/schema.prisma`
- **Supabase PostgreSQL** — two connection strings required:
  - `DATABASE_URL` → pooler port **6543** with `?pgbouncer=true` (for app queries)
  - `DIRECT_URL` → direct port **5432** (for `prisma migrate`)
- **NextAuth v5** (`next-auth@5.0.0-beta.31`) — JWT strategy, Credentials provider, bcrypt passwords
- **shadcn/ui v2** + **Tailwind CSS v3**
- **Deployed on Vercel**

## Architecture

### Route structure

All authenticated pages live under `app/(app)/` (route group). The group layout at `app/(app)/layout.tsx` calls `requerirSesion()` and wraps everything in `<AppShell>`. Public routes are only `/login` and `/` (redirect).

```
app/
├── (app)/              # Authenticated — all guarded by layout
│   ├── layout.tsx      # Auth check + AppShell wrapper
│   ├── dashboard/      # Home screen with metrics
│   ├── centros/        # Community centers CRUD
│   ├── beneficiarios/  # Beneficiaries CRUD + inscriptions
│   ├── captura-mensual/ # Monthly attendance capture
│   ├── catalogos/      # Catalogs: classes, coordinadoras, profesores
│   ├── datos/          # Excel import/export
│   ├── eventos/        # Events (Verano DIFertido)
│   └── admin/          # System administration (users)
├── login/              # Public
├── global-error.tsx    # Root-level error boundary (plain HTML/inline styles)
└── (app)/error.tsx     # App-level error boundary (shadcn UI)
```

### Auth flow

`middleware.ts` → `auth.config.ts` (`authorized` callback) → page.

- `middleware.ts` imports `auth.config.ts` only — **no Prisma** — because it runs on the edge.
- `auth.ts` is the full NextAuth config with Prisma, used only server-side (login, session reading).
- JWT carries: `id`, `nombre`, `rol`, `zonaId`. No `areasPermitidas` in JWT.
- Session type is declared in `types/next-auth.d.ts`.
- To guard a page: `const session = await requerirSesion()` from `lib/session.ts`.

### Server Actions pattern

Every mutation uses a Server Action returning `ResultadoAccion` from `lib/acciones.ts`:

```typescript
// Always re-verify session inside the action, never trust the UI alone
await requerirSesion()
// Return typed result, never throw to the client
return exito("Guardado") | fallo("Mensaje de error")
```

The UI checks `r.ok` and calls `toast.success` / `toast.error`. Never `throw` from an action.

### Data layer

`lib/data/*.ts` files contain read-only DB queries (no mutations). Mutations live in `actions.ts` files colocated with their route. Schemas for validation are in `lib/schemas/*.ts` (Zod).

### Domain model (simplified)

```
Zona (4 fixed: Norte A, Norte B, Sur A, Sur B)
 └── Centro (community center)
      └── ClaseCentro (class instance at a center)
           └── Inscripcion ←→ Beneficiario
```

Coordinadoras are assigned to zonas and centros but are separate from system users (`UsuarioSistema`).

### User / access system

- All system users get `rol: "admin"` in the DB (the rol enum exists for business logic filtering — `coordinadora_zona` restricts dashboard metrics to one zone — but the UI does not expose role selection).
- **Area access** (`areasPermitidas: string[]`) is stored in the `areas_permitidas` column (TEXT[]) in `usuarios_sistema`. It is **not** in the JWT or session.
- `lib/areas.ts` is the single source of truth for area definitions. It must stay pure TypeScript (no React, no icons) to remain importable from the edge middleware.
- `normalizarAreas()`: if all or none selected → saves `[]` (= full access). Subset → saves the restriction. Empty array always means unrestricted.
- The sidebar shows all areas to all users (no client-side filtering on session).

### Navigation

`lib/navegacion.ts` defines sidebar appearance: icons and module links per area. Area IDs here must match area IDs in `lib/areas.ts`.

### UI conventions

- **Colors**: `gobierno` (#1A3A6B, dark blue), `agua` (#2E8B7A, teal), `superficie` (#F5F6FA, page background).
- **Primary actions** use `bg-agua hover:bg-agua-600`. Navigation/admin accents use `bg-gobierno`.
- All shadcn/ui `<FormLabel>`, `<FormControl>`, `<FormDescription>`, `<FormMessage>` **must** be inside a `<FormField>` render prop — using them outside crashes with `useFormField should be used within <FormField>`.
- Toasts via `sonner` (`toast.success` / `toast.error`). Page-level errors use the `error.tsx` boundary.

### Excel import/export

`lib/excel/` handles beneficiary data. `exceljs` is used. The export route is at `app/api/datos/exportar/route.ts`. Import is a Server Action in `app/(app)/datos/actions.ts`.

### Events module

`lib/eventos/verano.ts` is the single source of truth for Verano DIFertido 2026: dates, groups (Botzitos → Megatronix), age ranges, shirt sizes. The inscription form at `/eventos/verano-difertido/inscripcion` is public-facing (no auth required within the app shell).

## Key constraints (do not change without reason)

- `prisma/schema.prisma`: records are never deleted — all have an `estatus` field. Age is never stored — always calculated from `fechaNacimiento`.
- `auth.config.ts` must not import Prisma or any Node.js-only module (edge constraint).
- `lib/areas.ts` must not import React, Lucide, or any browser/Node-only module (edge constraint).
- Passwords are always hashed with bcrypt before storing. The `passwordHash` field is never selected in queries that return data to the UI.
- A user cannot deactivate their own account (`cambiarEstatusUsuario` checks session ID vs target ID).
