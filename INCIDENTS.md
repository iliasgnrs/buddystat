# BuddyStat — Incident Archive & Precautions

> **Read this before every major change.** Every incident in this file was real, cost hours to debug, and is documented so it never repeats.

---

## Table of Contents

1. [Incident 1 — Authentication & Login (Feb 14–15, 2026)](#incident-1--authentication--login-feb-1415-2026)
2. [Incident 2 — Whitelabeling / Deployment Break (Feb 19, 2026)](#incident-2--whitelabeling--deployment-break-feb-19-2026)
3. [Incident 3 — Account Deletion + Geolocation Failure (Feb–Mar 7, 2026)](#incident-3--account-deletion--geolocation-failure-febmar-7-2026)
4. [Incident 4 — BSI Security Report: Databases Publicly Exposed (Mar 7, 2026)](#incident-4--bsi-security-report-databases-publicly-exposed-mar-7-2026)
5. [Incident 5 — Google Search Console OAuth Setup (Mar 7, 2026)](#incident-5--google-search-console-oauth-setup-mar-7-2026)
6. [Incident 6 — Docs Homepage Cleanup & Rebranding (Mar 7, 2026)](#incident-6--docs-homepage-cleanup--rebranding-mar-7-2026)
7. [Incident 7 — Neon Pink Theming & Client Build Fixes (Mar 2026)](#incident-7--neon-pink-theming--client-build-fixes-mar-2026)
8. [🚨 MASTER PRECAUTIONS — Never Do This Again](#-master-precautions--never-do-this-again)

---

## Incident 1 — Authentication & Login (Feb 14–15, 2026)

**Status:** ✅ Resolved  
**Severity:** Critical — users could not log in at all

### What Broke

| # | Symptom | Root Cause |
|---|---------|------------|
| 1 | Login button completely inactive | `TURNSTILE_SITE_KEY` missing `NEXT_PUBLIC_` prefix in docker-compose |
| 2 | Console flooded with Turnstile errors | Component was `console.error`-ing when key missing |
| 3 | Dashboard blank, 401/403 on every API call | `CORS_ORIGINS` and `NEXT_PUBLIC_APP_URL` not passed to backend container |
| 4 | Mobile white screen + infinite refresh loop | `redirect()` from `next/navigation` used inside a client component `useEffect` |

### Fixes Applied

**Fix 1 — Turnstile env var prefix** (`docker-compose.cloud.yml`):
```yaml
# WRONG
args:
  - TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY}

# CORRECT
args:
  - NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
```

**Fix 2 — Suppress Turnstile errors** (`client/src/components/auth/Turnstile.tsx`):
- Removed `console.error` / `console.warn` — silent `return null` when key missing
- Created `TURNSTILE_ENABLED` flag in `client/src/lib/const.ts`

**Fix 3 — CORS origins for backend** (`docker-compose.cloud.yml`):
```yaml
backend:
  environment:
    - CORS_ORIGINS=${CORS_ORIGINS}           # ← was missing
    - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}  # ← was missing
```

**Fix 4 — Mobile redirect loop** (`client/src/components/AuthenticationGuard.tsx`):
```typescript
// WRONG — causes hard reload on mobile
import { redirect } from "next/navigation";
redirect("/login");

// CORRECT — client-side navigation with loop guard
const router = useRouter();
const hasRedirectedRef = useRef(false);
router.push("/login");
```

### Commits
`9a5c9871` · `cf57c04a` · `8df9a117` · `d312e05b`

---

## Incident 2 — Whitelabeling / Deployment Break (Feb 19, 2026)

**Status:** ✅ Resolved  
**Severity:** Critical — data collection stopped, site creation blocked, all branding reverted

### What Broke

| # | Symptom | Root Cause |
|---|---------|------------|
| 1 | All "BuddyStat" text reverted to "Rybbit" (1,000+ references) | Upstream merge overwrote whitelabeling |
| 2 | Zero events after Feb 15 16:08 UTC | Caddyfile routing `/script.js` to client (404) instead of backend |
| 3 | Cannot add new sites — route returns 404 | `CLOUD` env var not passed to backend container |
| 4 | Dashboard shows "Free plan", "Add Site" grayed out | `NEXT_PUBLIC_CLOUD=true` not baked into client image at build time |
| 5 | Plan override `'pro'` not working | Invalid plan name — correct names follow `pro10m`, `standard5m` pattern |

### Fixes Applied

**Fix 1 — Whitelabeling:** 13 commits across client (191 files), docs (117 files), server (email templates).  
Preserved runtime identifiers: `RybbitAPI`, `RybbitEvent`, `window.rybbit` (used by tracking script).

**Fix 2 — Caddyfile routing** (`Caddyfile`, commit `e4f48a65`):
```caddy
handle /script.js      { reverse_proxy backend:3001 }
handle /script-full.js { reverse_proxy backend:3001 }
handle /web-vitals.iife.js { reverse_proxy backend:3001 }
handle /rrweb.min.js   { reverse_proxy backend:3001 }
```

**Fix 3 — CLOUD env var** (`docker-compose.yml`, commit `1deb31fb`):
```yaml
backend:
  environment:
    - CLOUD=${CLOUD}
```

**Fix 4 — Client rebuild with correct build args:**
```bash
docker build --no-cache \
  -f client/Dockerfile \
  --build-arg NEXT_PUBLIC_BACKEND_URL=https://app.buddystat.com \
  --build-arg NEXT_PUBLIC_CLOUD=true \
  -t iliasgnrs/buddystat-client:latest .
# Transfer to VPS via scp — do NOT rebuild on VPS (OOM risk)
```

**Fix 5 — Plan override:**
```sql
UPDATE organization SET "planOverride" = 'pro20m' WHERE id = 'JU4lbIDL8kNydlzNeAd1yFHMDAoPzAr4';
```

### Valid Plan Names
```
pro100k  pro250k  pro500k  pro1m  pro2m  pro5m  pro10m  pro20m
standard100k  standard250k  standard500k  standard1m  standard2m  standard5m  standard10m
appsumo-1  appsumo-2  appsumo-3  appsumo-4  appsumo-5  appsumo-6
```

### Script URL
The tracking script URL is always:
```
https://app.buddystat.com/api/script.js   ✅
https://buddystat.com/api/script.js        ❌  (404)
```

---

## Incident 3 — Account Deletion + Geolocation Failure (Feb–Mar 7, 2026)

**Status:** ✅ Resolved  
**Severity:** Critical — all analytics tabs showing empty data for entire month of March

### Timeline

| Date | Event |
|------|-------|
| Feb 19, 2026 | Backend deployed at commit `89d0d9e8` |
| Feb 20, 2026 | Commit `fc3fbb06` added GeoLite2 fallback when `IPAPI_KEY` not set — **never deployed to VPS** |
| ~Feb 2026 | AI session accidentally deleted the main GNRS.gr organization account from the DB |
| ~Feb 2026 | Account recreated by hand — new org ID `JU4lbIDL8kNydlzNeAd1yFHMDAoPzAr4`, `planOverride='pro20m'` |
| Mar 1–7, 2026 | All 6,208 March events had zero country/timezone/region/city data |
| Mar 7, 2026 | Root cause identified and fixed |

### What Broke

**Primary:** VPS backend was running 17-day-old code missing the geolocation fallback. Without `IPAPI_KEY` set AND without the fallback, every event recorded as empty strings for all location fields.

**Secondary:** After pulling the fix, `docker-compose build --no-cache backend` failed with 3 TypeScript errors.

### Root Cause 1: Missing Geolocation Fallback

`server/src/db/geolocation/geolocation.ts` — the function `getLocationFromIPAPI()` returned `{}` when `IPAPI_KEY` was falsy instead of calling `getLocationFromLocal()`:

```typescript
// BEFORE (broken — deployed since Feb 19)
async function getLocationFromIPAPI(ips) {
  if (!apiKey) {
    logger.warn("IPAPI_KEY not configured...");
    return {};  // ← dropped all location data
  }
  ...
}

// AFTER (fixed — commit fc3fbb06, Feb 20)
async function getLocationFromIPAPI(ips) {
  if (!apiKey) {
    logger.warn("IPAPI_KEY not configured, falling back to local GeoLite2");
    return getLocationFromLocal(ips);  // ← use local DB
  }
  ...
}
```

### Root Cause 2: Docker Build Failures

Three separate issues prevented the backend from rebuilding:

**Error A — `tsconfig.tsbuildinfo` stale cache:**  
The `shared/` directory had a `tsconfig.tsbuildinfo` file committed. When copied into Docker, TypeScript's incremental build (`composite: true`) saw it and **skipped output entirely** — producing no `dist/` folder.
```
cp: can't stat '/app/shared/dist': No such file or directory
```
Fix: Added `**/*.tsbuildinfo` to `.dockerignore` and `rm -f tsconfig.tsbuildinfo` in Dockerfile RUN step.

**Error B — `npm link ../shared` broken in Docker:**  
The Dockerfile used `npm link` to resolve `@rybbit/shared` but npm link creates a symlink in the global npm directory, which doesn't persist across Docker layers correctly. Replaced with explicit copy:
```dockerfile
# WRONG
RUN npm link ../shared

# CORRECT — atomic single RUN
RUN cd /app/shared && rm -f tsconfig.tsbuildinfo && npm install && npm run build && \
    cd /app/server && npm install --legacy-peer-deps && \
    rm -rf node_modules/@rybbit/shared && \
    mkdir -p node_modules/@rybbit/shared && \
    cp /app/shared/package.json node_modules/@rybbit/shared/ && \
    cp -r /app/shared/dist node_modules/@rybbit/shared/
```

**Error C — Missing `exports` field in `shared/package.json`:**  
TypeScript's `"moduleResolution": "NodeNext"` requires an `exports` field to resolve the package. Added:
```json
"exports": {
  ".": {
    "require": "./dist/index.js",
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts"
  }
}
```

**Error D — TypeScript errors in new files:**
- `sendSiteReport.ts`: `site.organizationId` is `string | null` — fixed with `?? ''`
- `pdfReportService.ts`: `getTimeStatement()` missing `past_minutes_start/end` fields — added `undefined` values

### Fix 4: IPAPI_KEY Added to VPS

Added `IPAPI_KEY=4a266f011dab1bfba66f` to `/opt/buddystat/.env` on VPS. After backend restart, all VPN/Crawler/Datacenter/Company/ASN tabs immediately started populating.

### Verification

```bash
# After fix — new events have 100% geolocation coverage
docker exec clickhouse clickhouse-client --password frog -q \
  "SELECT count() total, countIf(country!='') country, countIf(asn_org!='') asn
   FROM analytics.events WHERE site_id=6 AND timestamp >= '2026-03-07 10:35:00'"
# Result: 4   4   3  ✅
```

### Commits
`f6f759c5` · `187f3fb0` · `42c40d13` · `8353e2b4`

---

## Incident 4 — BSI Security Report: Databases Publicly Exposed (Mar 7, 2026)

**Status:** ✅ Resolved  
**Severity:** Critical — four database ports accessible from the public internet  
**Reported by:** Hetzner / BSI (German Federal Office for Information Security)

### What Broke

| Port | Service | Exposure |
|------|---------|----------|
| 5432 | PostgreSQL | `0.0.0.0:5432` — world-accessible |
| 8123 | ClickHouse HTTP API | `0.0.0.0:8123` — world-accessible |
| 9000 | ClickHouse native TCP | `0.0.0.0:9000` — world-accessible |
| 6379 | Redis | `0.0.0.0:6379` — world-accessible |

All database ports were bound to `0.0.0.0` (all interfaces) instead of `127.0.0.1` (localhost only). Docker's port publishing bypasses the host firewall (UFW), so these ports were directly reachable from the internet even if UFW rules existed.

The Redis entry in `docker-compose.cloud.yml` even had the comment:  
`"6379:6379" # Exposed to internet for remote connections` — clearly intentional at setup time but a major security mistake.

### Root Cause

Two compose files were in use on the VPS simultaneously:
- `docker-compose.cloud.yml` — managed clickhouse, postgres, redis, docs (original setup file)
- `docker-compose.yml` — managed backend, client (migrated services)

The `docker-compose.cloud.yml` file had all database ports bound to `0.0.0.0` without any `127.0.0.1:` prefix. Port 9000 for ClickHouse native protocol was also exposed (not present in the newer `docker-compose.yml`).

**Key lesson:** Docker port publishing (`ports:`) bypasses UFW/iptables. Only binding to `127.0.0.1` prevents external access.

### Fixes Applied

**`docker-compose.yml`** (postgres, clickhouse 8123):
```yaml
# BEFORE (insecure)
- "8123:8123"
- "5432:5432"

# AFTER (secure)
- "127.0.0.1:8123:8123"
- "127.0.0.1:5432:5432"
```

**`docker-compose.cloud.yml`** (all services):
```yaml
# ALL database and internal ports changed to 127.0.0.1:
- "127.0.0.1:8123:8123"
- "127.0.0.1:9000:9000"
- "127.0.0.1:5432:5432"
- "127.0.0.1:6379:6379"
- "127.0.0.1:3001:3001"  # backend
- "127.0.0.1:3002:3002"  # client
```

Individual services restarted (no `docker-compose down`):
```bash
docker-compose -f docker-compose.cloud.yml up -d --no-deps redis
docker-compose -f docker-compose.cloud.yml up -d --no-deps clickhouse
docker-compose -f docker-compose.cloud.yml up -d --no-deps postgres
```

### Verification

```bash
ss -tlnp | grep -E '5432|8123|9000|6379'
# LISTEN 0  127.0.0.1:5432  ✅
# LISTEN 0  127.0.0.1:8123  ✅
# LISTEN 0  127.0.0.1:9000  ✅
# LISTEN 0  127.0.0.1:6379  ✅
```

Backend remained healthy — inter-container communication uses Docker DNS (`postgres`, `clickhouse`, `redis` hostnames) which is not affected by host port binding.

### Commits
`3c58468c` · `998ac526`

---

## Incident 5 — Google Search Console OAuth Setup (Mar 7, 2026)

**Status:** ✅ Resolved  
**Severity:** Medium — GSC feature not working, multiple OAuth errors during setup

### What Broke (in sequence)

| # | Error | Root Cause |
|---|-------|------------|
| 1 | Site creation returns 500 | PostgreSQL `sites` sequence reset to 1 after container recreation |
| 2 | GSC callback returns 404 | Redirect URI pointed to `buddystat.com` (docs site) instead of `app.buddystat.com` |
| 3 | `redirect_uri_mismatch` on second site connect | Better Auth auto-detected internal Docker hostname for callback URI |

### Issue 1 — PostgreSQL Sequence Out of Sync

After the `docker-compose.cloud.yml` service restarts (Incident 4 fix), the Postgres sequence for `sites.site_id` was reset, while existing rows already had IDs up to 16. New inserts failed with:
```
PostgresError: duplicate key value violates unique constraint "sites_pkey"
detail: Key (site_id)=(1) already exists.
```

**Fix:**
```bash
docker exec postgres psql -U frog -d analytics -c \
  "SELECT setval(pg_get_serial_sequence('sites', 'site_id'), (SELECT MAX(site_id) FROM sites));"
```

**Key lesson:** After restarting Postgres containers, always verify sequences are in sync if inserts fail with duplicate key errors.

### Issue 2 — GSC Callback 404 (Wrong Domain)

The registered Google redirect URI was `https://buddystat.com/api/gsc/callback`. But the Caddyfile routes all traffic on `buddystat.com` to the **docs service** (port 3003). Only `app.buddystat.com` routes `/api/*` to the backend.

**Fix:** Updated Google Cloud Console redirect URIs to use `app.buddystat.com`. Updated `GOOGLE_REDIRECT_URI` in `.env`:
```bash
sed -i 's|GOOGLE_REDIRECT_URI=https://buddystat.com/api/gsc/callback|GOOGLE_REDIRECT_URI=https://app.buddystat.com/api/gsc/callback|' /opt/buddystat/.env
```

**Correct registered URIs in Google Cloud Console (both required):**
```
https://app.buddystat.com/api/gsc/callback          ← GSC connection flow
https://app.buddystat.com/api/auth/callback/google  ← Sign in with Google login
```

### Issue 3 — Better Auth `redirect_uri_mismatch`

Better Auth's Google social provider was auto-detecting the base URL from the incoming request. Inside Docker, requests arrive from the internal network, so it built the callback URI as `http://backend:3001/api/auth/callback/google` — which Google rejects as unregistered.

**Fix** (`server/src/lib/auth.ts`):
```typescript
// BEFORE
export const auth = betterAuth({
  basePath: "/api/auth",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

// AFTER
export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.BASE_URL,          // ← added
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BASE_URL}/api/auth/callback/google`,  // ← added
    },
  },
});
```

**Key lesson:** Always set `baseURL` explicitly in Better Auth when running behind a reverse proxy or in Docker. Never rely on auto-detection.

### GSC Architecture

Two separate OAuth flows, one shared Google Cloud OAuth client:

| Flow | Path | Purpose |
|------|------|---------|
| GSC connection | `/api/gsc/callback` | Stores GSC tokens in `gsc_connections` table per site |
| Google login | `/api/auth/callback/google` | Better Auth handles sign-in-with-Google |

Tokens are refreshed automatically via `refreshGSCToken()` in `server/src/api/gsc/utils.ts`. GSC data is fetched per-site via the Search Console API with `webmasters.readonly` scope.

### Google Cloud App Status

- **Testing mode** — up to 100 test user emails can be added under OAuth consent screen
- **Verification submitted** — once approved, any Google account can connect
- During testing: only explicitly added test users can complete the OAuth flow

### Required Env Vars

```env
```env\nGOOGLE_CLIENT_ID=<see VPS .env>
GOOGLE_CLIENT_SECRET=<see VPS .env>
GOOGLE_REDIRECT_URI=https://app.buddystat.com/api/gsc/callback
```

All three must be passed through `docker-compose.yml` backend environment section.

### Commits
`8ac64a1c` · `e1d2d266`

---

## Incident 6 — Docs Homepage Cleanup & Rebranding (Mar 7, 2026)

**Status:** ✅ Resolved  
**Severity:** Low — broken URLs, leftover Rybbit branding, tracking script 404 on docs homepage

### What Was Wrong

| # | Issue | Root Cause |
|---|-------|------------|
| 1 | Analytics iframe showed login page | iframe src pointed to `buddystat.com/81/main` (old Rybbit demo URL) |
| 2 | Hero and CTA demo buttons linked to `buddystat.com/81` | Never updated during whitelabel migration |
| 3 | FAQ contained "Rybbit" branding throughout | Text not updated during whitelabel |
| 4 | "Star us on GitHub" button visible, linking to `rybbit-io/rybbit` | `<GitHubStarButton />` left in from upstream |
| 5 | Testimonials section rendered tweet embeds causing SVG errors | Tweets from Rybbit users; react-tweet failing silently |
| 6 | Product Hunt badge and social links in footer | Rybbit-specific, not relevant for BuddyStat |
| 7 | `script.js` in docs `layout.tsx` 404ing | Both analytics `<script>` tags pointed to `buddystat.com/api/script.js` (docs), not `app.buddystat.com` |

### Fixes Applied (5 commits)

**`403ce61a`** — Iframe src:
```
before: buddystat.com/81/main
after:  app.buddystat.com/6/main
```

**`550edb70`** — Multiple fixes:
- Hero demo button: `buddystat.com/81` → `app.buddystat.com/6`
- Testimonials section: hidden with `{false && <section ...>}`
- FAQ: all "Rybbit" → "BuddyStat" throughout
- Footer: Product Hunt badge removed, social links hidden

**`193c43b4`** — More fixes:
- FAQ demo link: `buddystat.com/1` → `app.buddystat.com/6`
- "Can I self-host?" FAQ item: hidden temporarily
- "Is it open source?" answer: trimmed to single relevant sentence
- Bottom CTA demo button: `buddystat.com/81` → `app.buddystat.com/6`

**`255831f9`** — Component cleanup:
- `GitHubStarButton.tsx`: removed `Star` lucide icon, removed `useGithubStarCount` hook and star count display
- `docs/src/app/layout.tsx`: both `<script>` tags fixed to `app.buddystat.com/api/script.js`

**`4a6f51b0`** — Final removal:
- `<GitHubStarButton />` and its import fully removed from `page.tsx`

### Files Modified

| File | Change |
|------|--------|
| `docs/src/app/(home)/page.tsx` | iframe URL, testimonials hidden, `GitHubStarButton` removed |
| `docs/src/app/layout.tsx` | analytics script tags fixed to `app.buddystat.com` |
| `docs/src/components/FAQAccordion.tsx` | full rebrand, URLs fixed, self-host item hidden |
| `docs/src/components/Footer.tsx` | Product Hunt badge removed, social links hidden |
| `docs/src/components/CTASection.tsx` | demo button URL fixed |
| `docs/src/components/GitHubStarButton.tsx` | star icon + count removed |

### Docs Deploy Pattern

Docs have baked-in env vars and must be built locally then transferred (same reason as client — OOM risk on VPS):

```bash
# Build locally
docker build --no-cache -f docs/Dockerfile -t iliasgnrs/buddystat-docs:latest .

# Transfer and deploy
docker save iliasgnrs/buddystat-docs:latest | gzip > /tmp/docs.tar.gz
scp /tmp/docs.tar.gz root@46.62.223.77:/tmp/
ssh root@46.62.223.77 'docker load < /tmp/docs.tar.gz && \
  cd /opt/buddystat && \
  docker-compose -f docker-compose.cloud.yml up -d --no-deps docs && \
  rm /tmp/docs.tar.gz'
rm /tmp/docs.tar.gz
```

### Key Lesson

After any upstream merge or whitelabel pass, audit the **docs homepage** separately:
- Check every URL on `buddystat.com` — especially iframe src, demo buttons, FAQ links
- Search for any remaining upstream brand names: `grep -r 'Rybbit\|rybbit' docs/src/`
- Check `docs/src/app/layout.tsx` analytics script tags point to `app.buddystat.com`
- Remove or hide any upstream-specific UI (GitHub star, Product Hunt, testimonials)

### Commits
`403ce61a` · `550edb70` · `193c43b4` · `255831f9` · `4a6f51b0`

---

## Incident 7 — Neon Pink Theming & Client Build Fixes (Mar 2026)

**Status:** ✅ Resolved  
**Severity:** Low (theming) + Medium (build failures)  
**Scope:** Full accent color overhaul from emerald/blue to neon pink `#FF10F0`, plus multiple Docker build failures discovered during rebuild

### Part A — Color Theming

Changed all green/blue accents to neon pink `#FF10F0` = `hsl(304, 100%, 53%)` ≈ Tailwind `fuchsia`.

**Client — `client/src/app/globals.css`** (`6325feae`):
- Replaced entire `emerald` color scale with a custom `neonpink` scale anchored at `hsl(304, 100%, 53%)`
- Changed `--dataviz` and `--dataviz-2` light/dark tokens to use the neon pink hue (304°)
- All accent aliases (`--accent-*`, `--ring`, `--primary`) now reference `var(--neonpink-*)`

```css
--neonpink-500: 304 100% 53%;  /* #FF10F0 — base accent */
```

**Docs — `docs/src/app/global.css`** (`16165d3b`):
- `--color-fd-primary` changed from `rgb(16 185 129)` (emerald-500) to `rgb(255 16 240)` in both `:root` and `.dark`
- Controls all Fumadocs UI primary accents (links, nav highlights, buttons)

**Docs — bulk Tailwind class replace** (`74d36272`):
- ~60 files had hardcoded `emerald-*` Tailwind classes (CTASection, FAQAccordion, pricing, tools pages, etc.)
- Bulk replaced with: `find docs/src -name '*.tsx' -o -name '*.ts' -o -name '*.css' | xargs sed -i 's/emerald/fuchsia/g'`
- Verified: `grep -r 'emerald' docs/src/` → 0 results

**Weekly trends heatmap — `client/src/app/[site]/main/components/sections/Weekdays.tsx`** (`38560657`):
- `getColorIntensity()`: all 10 opacity steps `bg-emerald-500/{10..100}` → `bg-fuchsia-500/{10..100}`
- Hover ring: `hover:ring-emerald-300` → `hover:ring-fuchsia-300`

### Part B — Client Build Failures (4 build cycles)

Rebuilding the client to apply theme changes revealed several pre-existing bugs:

**Error 1 — `@rybbit/shared/dist/filters` subpath import not resolving**  
Root cause: The client Dockerfile used `npm link ../shared`, which creates symlinks. Symlinks don't survive Docker's layer copy mechanism — the target directory vanishes in the next layer.

**Fix** (`client/Dockerfile`, commit `841d3794`): Replaced `npm link` with an atomic copy in a single `RUN`:
```dockerfile
# WRONG
RUN npm link ../shared

# CORRECT — atomic single RUN
RUN cd /app/shared && rm -f tsconfig.tsbuildinfo && npm install && npm run build && \
    cd /app/client && \
    rm -rf node_modules/@rybbit/shared && \
    mkdir -p node_modules/@rybbit/shared && \
    cp /app/shared/package.json node_modules/@rybbit/shared/ && \
    cp -r /app/shared/dist node_modules/@rybbit/shared/
```

**Error 2 — `@rybbit/shared/dist/filters` still not resolving after fix 1**  
Root cause: TypeScript's `"moduleResolution": "NodeNext"` requires an explicit `exports` field in `package.json` to resolve deep subpath imports. `shared/package.json` only exported `.` (the root).

**Fix** (`shared/package.json`, commit `841d3794`): Added wildcard subpath exports:
```json
"exports": {
  ".": {
    "require": "./dist/index.js",
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "./dist/*": {
    "require": "./dist/*.js",
    "import": "./dist/*.js",
    "types": "./dist/*.d.ts"
  }
}
```

**Error 3 — TypeScript: `organizationId` does not exist on session type**  
In `client/src/app/settings/account/components/AccountInner.tsx`, the code referenced `session?.session?.organizationId` — but Better Auth's session type uses `activeOrganizationId`.

**Fix** (`841d3794`): `organizationId` → `activeOrganizationId`

**Error 4 — Prerender crash: `sendAutoEmailReports` accessed on undefined**  
During Next.js static prerender, `session.data` is `null`. Two places in `AccountInner.tsx` accessed `.sendAutoEmailReports` directly without optional chaining.

**Fix** (`841d3794`): Added `?.` optional chaining on both usages.

### Files Modified

| File | Change | Commit |
|------|--------|--------|
| `client/src/app/globals.css` | Neonpink scale, dataviz colors, accent aliases | `6325feae` |
| `docs/src/app/global.css` | `--color-fd-primary` → neon pink | `16165d3b` |
| `docs/src/**` (~60 files) | Bulk `emerald` → `fuchsia` replacement | `74d36272` |
| `client/src/app/[site]/main/components/sections/Weekdays.tsx` | Heatmap emerald → fuchsia | `38560657` |
| `client/Dockerfile` | Atomic shared copy, no npm link | `841d3794` |
| `shared/package.json` | Added `"./dist/*"` wildcard subpath exports | `841d3794` |
| `client/src/app/settings/account/components/AccountInner.tsx` | Session type fix + optional chaining | `841d3794` |

### Key Lessons

- **`npm link` in Docker is broken by design.** Symlinks don't survive layer boundaries. Always use atomic copy in a single `RUN`.
- **TypeScript `NodeNext` resolution requires `exports` field** for any subpath imports (`package/dist/file`). Add a `"./dist/*"` wildcard export to `shared/package.json`.
- **Better Auth session field is `activeOrganizationId`**, not `organizationId`.
- **Next.js prerendering runs with `session.data = null`** — always use optional chaining on session-derived values.
- **Docs Tailwind classes are hardcoded**, not driven by CSS custom properties. A bulk `sed` is required whenever the accent color changes.

### Commits
`6325feae` · `841d3794` · `16165d3b` · `74d36272` · `38560657`

---

## 🚨 MASTER PRECAUTIONS — Never Do This Again

### 🔴 NEVER — Database & Account Safety

```
❌ NEVER run DELETE, DROP, or TRUNCATE on any production table without a backup
❌ NEVER delete organization records from Postgres — this kills ALL associated data
❌ NEVER run docker-compose down without stopping individual services
❌ NEVER touch postgres/clickhouse volumes — treat them as sacred
❌ NEVER rebuild the CLIENT container on VPS (OOM risk — VPS only has 2GB RAM)
❌ NEVER run database migrations manually (use only: npm run db:push)
```

If you must delete something from the DB, first:
```bash
# Always backup before ANY destructive operation
docker exec postgres pg_dump -U frog analytics > /tmp/backup-$(date +%Y%m%d-%H%M).sql
```

### 🔴 NEVER — Service Restarts

```
❌ NEVER docker-compose restart / docker-compose down for multi-service restarts
   This restarts postgres, clickhouse, and all services — risking data corruption
```

Always restart ONLY the specific service:
```bash
docker-compose up -d --no-deps backend   ✅
docker-compose up -d --no-deps client    ✅
```

**VPS compose file ownership:**
- `docker-compose.cloud.yml` → redis, clickhouse, postgres, docs
- `docker-compose.yml` → backend, client, caddy

Use the correct file when restarting:
```bash
docker-compose -f docker-compose.cloud.yml up -d --no-deps postgres  ✅
docker-compose up -d --no-deps backend                                ✅
```

### 🔴 NEVER — Expose Database Ports to the Internet

Docker's `ports:` directive **bypasses UFW/iptables**. Any published port is accessible from the internet regardless of firewall rules.

```
❌ NEVER use "6379:6379" style — binds to 0.0.0.0 (internet-accessible)
✅ ALWAYS use "127.0.0.1:6379:6379" — localhost only
```

This applies to ALL internal services: PostgreSQL (5432), ClickHouse (8123, 9000), Redis (6379), backend (3001), client (3002). Only Caddy (80, 443) should be on `0.0.0.0`.

Verify with:
```bash
ss -tlnp | grep -E '5432|8123|9000|6379|3001|3002'
# All should show 127.0.0.1:PORT, never 0.0.0.0:PORT
```

### 🔴 NEVER — Trust Better Auth's Auto-Detected Base URL

When running behind a reverse proxy or Docker, Better Auth auto-detects the base URL from the incoming request. Inside Docker, requests arrive from the internal network and Better Auth picks up `http://backend:3001` as the base URL, causing `redirect_uri_mismatch` errors with Google OAuth.

```
❌ NEVER omit baseURL from betterAuth() config
✅ ALWAYS set baseURL: process.env.BASE_URL explicitly
✅ ALWAYS set redirectURI explicitly in socialProviders.google
```

```typescript
// server/src/lib/auth.ts — must always look like this:
export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.BASE_URL,          // ← mandatory
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BASE_URL}/api/auth/callback/google`,  // ← mandatory
    },
  },
});
```

### 🔴 NEVER — Use buddystat.com for API Callbacks

Caddy routes ALL traffic on `buddystat.com` to the **docs** service (port 3003). Only `app.buddystat.com` routes `/api/*` to the backend.

```
❌ https://buddystat.com/api/gsc/callback    → 404 (hits docs)
✅ https://app.buddystat.com/api/gsc/callback → correct
```

All OAuth redirect URIs, tracking scripts, and API calls must use `app.buddystat.com`.

### 🔴 NEVER — Client Rebuild

The client image has `NEXT_PUBLIC_*` env vars **baked in at build time**. Once built correctly, don't rebuild it.

If rebuild is required, do it **locally** and transfer:
```bash
# Local machine
docker build --no-cache \
  --build-arg NEXT_PUBLIC_BACKEND_URL=https://app.buddystat.com \
  --build-arg NEXT_PUBLIC_CLOUD=true \
  -f client/Dockerfile -t iliasgnrs/buddystat-client:latest .
docker save iliasgnrs/buddystat-client:latest | gzip > /tmp/client.tar.gz
scp /tmp/client.tar.gz root@46.62.223.77:/tmp/
ssh root@46.62.223.77 "docker load < /tmp/client.tar.gz && cd /opt/buddystat && docker-compose up -d --no-deps client"
```

### 🟡 ALWAYS — After Git Pull on VPS

```bash
# Check what commits you pulled BEFORE rebuilding
git log --oneline -10

# Verify no TypeScript errors locally before pushing
cd server && tsc --noEmit
```

### 🟡 ALWAYS — After Any Backend Change

```bash
# Rebuild with no cache (stale layers break builds)
docker-compose build --no-cache backend
docker-compose up -d --no-deps backend
sleep 5
docker-compose logs --tail=30 backend
```

Check the logs for:
- `GeoIP database loaded successfully` ✅
- `Server is listening on http://0.0.0.0:3001` ✅
- NO `IPAPI_KEY not configured` warning (means IPAPI_KEY is set correctly)

### 🟡 ALWAYS — Verify Geolocation After Backend Update

```bash
# Wait a few minutes for new events, then check
docker exec clickhouse clickhouse-client --password frog -q \
  "SELECT count() total, countIf(country!='') geo, countIf(asn_org!='') asn
   FROM analytics.events WHERE timestamp >= now() - INTERVAL 10 MINUTE"
# All 3 numbers should be equal (or close)
```

### 🟡 ALWAYS — Environment Variable Checklist

Before any deployment verify `/opt/buddystat/.env` has:

```env
CLOUD=true
NEXT_PUBLIC_CLOUD=true
IPAPI_KEY=4a266f011dab1bfba66f          # ipapi.is — VPN/ASN/Company/Crawler
BETTER_AUTH_SECRET=<secret>
BASE_URL=https://app.buddystat.com
CORS_ORIGINS=https://buddystat.com,https://app.buddystat.com
RESEND_API_KEY=<key>                   # email reports
GOOGLE_CLIENT_ID=<id>                  # Google OAuth (login + GSC)
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_REDIRECT_URI=https://app.buddystat.com/api/gsc/callback
```

And verify the backend receives them:
```bash
docker exec backend printenv | grep -E 'CLOUD|IPAPI|CORS|BASE_URL'
```

### 🟡 ALWAYS — Organization Safety Check

The main organization (GNRS.gr) must always have:
```
ID:           JU4lbIDL8kNydlzNeAd1yFHMDAoPzAr4
planOverride: pro20m
```

Verify after any auth or DB work:
```bash
docker exec postgres psql -U frog -d analytics \
  -c "SELECT id, name, \"planOverride\" FROM organization LIMIT 5;"
```

### 🟡 ALWAYS — Docker Build Precautions

The `shared/` package uses TypeScript's `composite: true` which generates a `tsconfig.tsbuildinfo` file. **This file must never enter the Docker build context.** It's now excluded via `.dockerignore` (`**/*.tsbuildinfo`).

If the build ever fails with `can't stat '/app/shared/dist'`:
1. Check `.dockerignore` includes `**/*.tsbuildinfo`
2. The Dockerfile's RUN step must `rm -f tsconfig.tsbuildinfo` before `npm run build`
3. Build + copy of shared MUST be in a single `RUN` command (no layer gap)

### 🟡 ALWAYS — Upstream Merges

After pulling from upstream (`rybbit-io/rybbit`):
1. Verify the Caddyfile still routes analytics scripts to backend (not client)
2. Verify `docker-compose.yml` still has `CLOUD`, `IPAPI_KEY`, `CORS_ORIGINS` in backend environment
3. Check `server/src/db/geolocation/geolocation.ts` still has the GeoLite2 fallback
4. Do a full `docker-compose build --no-cache backend` and watch for TypeScript errors

### 🔵 CURRENT PRODUCTION STATE (Mar 7, 2026)

| Item | Value |
|------|-------|
| VPS IP | 46.62.223.77 |
| App path | /opt/buddystat |
| Docker compose file | `docker-compose.yml` (backend/client/caddy) + `docker-compose.cloud.yml` (dbs/docs) |
| Backend image | built on VPS via `docker-compose build --no-cache backend` |
| Client image | built locally, transferred via scp — do NOT rebuild on VPS |
| Docs image | built locally, transferred via scp — do NOT rebuild on VPS |
| Organization ID | `JU4lbIDL8kNydlzNeAd1yFHMDAoPzAr4` (GNRS.gr) |
| Plan override | `pro20m` (20M events/month, unlimited sites) |
| ClickHouse password | `frog` |
| Postgres user/db | `frog` / `analytics` |
| IPAPI key | `4a266f011dab1bfba66f` |
| Active git commit | `38560657` |
| Backend last built | Mar 7, 2026 |
| Client last built | Mar 2026 (pink theme) |
| Docs last built | Mar 2026 (pink theme) |
| Google OAuth | ✅ GSC + Google login both working |
| GSC | ✅ Users can connect their own properties per-site |
| Docs homepage | ✅ Fully rebranded — all BuddyStat URLs, GitHub star removed, Rybbit references cleaned |
| Accent color | ✅ Neon pink `#FF10F0` — client + docs + heatmap all updated |

```bash
# Quick health check
ssh root@46.62.223.77 "cd /opt/buddystat && docker-compose ps"
# All containers should show: Up / healthy
```
