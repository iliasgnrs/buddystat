# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL — Read Before Any Action

**Always read [INCIDENTS.md](./INCIDENTS.md) before making production changes.** Seven incidents have occurred. Key rules:

- **NEVER** delete organization records from Postgres — kills all user data
- **NEVER** run `docker-compose down` or restart all services at once
- **NEVER** rebuild the client or docs containers on the VPS (OOM risk) — build locally and `scp`
- **ALWAYS** restart only the specific service: `docker-compose up -d --no-deps backend`
- **ALWAYS** use `docker-compose build --no-cache backend` for backend rebuilds
- **ALWAYS** prefix new database/internal port mappings with `127.0.0.1:` — Docker bypasses UFW
- **ALWAYS** set `baseURL` and `redirectURI` explicitly in `server/src/lib/auth.ts` — Better Auth auto-detects internal Docker hostname otherwise
- **ALWAYS** use `app.buddystat.com` for API callbacks and tracking scripts — `buddystat.com` routes to docs, not backend
- VPS uses **both** compose files: `docker-compose.cloud.yml` (redis, clickhouse, postgres, docs) and `docker-compose.yml` (backend, client, caddy). Use the correct one when restarting.
- After upstream merges, audit the docs homepage for leftover Rybbit branding, broken URLs, and upstream-specific UI components
- **NEVER** use `npm link` in the client or server Dockerfile — symlinks break across Docker layers; use atomic single-`RUN` copy into `node_modules/@rybbit/shared`
- **ALWAYS** ensure `shared/package.json` has a `"./dist/*"` wildcard in its `exports` field — required for TypeScript `NodeNext` subpath resolution
- Accent color is neon pink `#FF10F0` (`hsl(304,100%,53%)`): CSS custom properties in `client/src/app/globals.css`, `--color-fd-primary` + bulk Tailwind classes in `docs/src/`

## Commands

- Client: `cd client && npm run dev` (NextJS with Turbopack on port 3002)
- Server: `cd server && npm run dev` (TypeScript backend)
- Lint: `cd client && npm run lint` or `cd server && npm run build`
- TypeCheck: `cd client && tsc --noEmit` or `cd server && tsc`
- Database: `cd server && npm run db:push` (update DB schema)

## Code Conventions

- TypeScript with strict typing throughout both client and server
- Client: React functional components with minimal useEffect and inline functions
- Frontend: Next.js, Tailwind CSS, Shadcn UI, Tanstack Query, Zustand, Luxon, Nivo, react-hook-form
- Backend: Fastify, Drizzle ORM (Postgres), ClickHouse, Zod
- Error handling: Use try/catch blocks with specific error types
- Naming: camelCase for variables/functions, PascalCase for components/types
- Imports: Group by external, then internal (alphabetical within groups)
- File organization: Related functionality in same directory
- Dark mode is default theme
- Never run any database migration scripts
