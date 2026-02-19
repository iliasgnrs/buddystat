# Deployment Fix Milestone - February 19, 2026

## Overview
Major debugging and fix session resolving critical production issues after upstream merge that caused complete whitelabeling loss, data collection failure, and site creation limits.

## Issues Discovered and Fixed

### 1. Complete Whitelabeling Loss
**Problem:** After upstream merge, all "BuddyStat" branding reverted to "Rybbit" across the entire application (1000+ references).

**Solution:**
- Completed systematic 3-phase whitelabeling:
  - **Client:** 191 files (components, pages, UI text)
  - **Docs:** 117 content files + 8 component files
  - **Server:** Email templates, error messages, User-Agent strings
- Preserved critical runtime identifiers: `RybbitAPI`, `RybbitEvent`, `window.rybbit`
- **Commits:** 13 total whitelabeling commits pushed to master

**Status:** ✅ Complete

---

### 2. Data Collection Failure (No Events After Feb 15)
**Problem:** Analytics tracking completely stopped on Feb 15, 2026 16:08:29 UTC. No events recorded for any of the 15 sites.

**Root Cause:** Caddyfile routing configuration was sending analytics script requests (`/script.js`, `/script-full.js`, etc.) to the Next.js client instead of the backend server, causing 404 errors.

**Solution (Commit e4f48a65):**
Updated `Caddyfile` to explicitly route analytics scripts to backend:
```caddy
handle /script.js {
    reverse_proxy backend:3001
}
handle /script-full.js {
    reverse_proxy backend:3001
}
handle /web-vitals.iife.js {
    reverse_proxy backend:3001
}
handle /rrweb.min.js {
    reverse_proxy backend:3001
}
```

**Verification:**
```bash
curl -I https://app.buddystat.com/script.js
# Returns: HTTP/2 200, content-type: application/javascript
```

**Status:** ✅ Fixed - Data collection resumed

---

### 3. Site Creation Blocked - Missing CLOUD Environment Variable
**Problem:** Unable to add new sites despite having 15 existing sites. Site creation endpoint registration missing.

**Root Cause:** Backend container wasn't receiving the `CLOUD` environment variable, so subscription routes (including `/api/stripe/subscription`) weren't being registered.

**Diagnosis:**
```bash
docker exec backend node -e "console.log('IS_CLOUD:', process.env.CLOUD === 'true')"
# Output: IS_CLOUD: false ❌
```

**Solution (Commit 1deb31fb):**
Added missing environment variable to backend service in `docker-compose.yml`:
```yaml
backend:
  environment:
    - CLOUD=${CLOUD}
    # ... other vars
```

**VPS Configuration:**
Updated `/opt/buddystat/.env`:
```env
CLOUD=true
NEXT_PUBLIC_CLOUD=true
```

**Verification:**
```bash
docker exec backend node -e "console.log('IS_CLOUD:', process.env.CLOUD === 'true')"
# Output: IS_CLOUD: true ✅

curl https://app.buddystat.com/api/stripe/subscription?organizationId=XXX
# Returns: {"error":"Unauthorized"} (401) - Route exists! ✅
# Previously: {"message":"Route GET:/api/stripe/subscription..."} (404) ❌
```

**Status:** ✅ Fixed

---

### 4. Client Not Calling Subscription API
**Problem:** After fixing backend routes, client still showed "Free plan" and disabled "Add Site" button. No requests to subscription API in logs.

**Root Cause:** Next.js bakes `NEXT_PUBLIC_*` environment variables into the JavaScript bundle at **build time**. The client image was built without `NEXT_PUBLIC_CLOUD=true`, so `IS_CLOUD` was hardcoded to `false` in the compiled code.

**Diagnosis:**
```bash
# Local .env was missing the variable
grep NEXT_PUBLIC_CLOUD .env
# Output: (empty) ❌

# Client showed free plan despite planOverride in database
# Subscription API never called - hardcoded to skip when IS_CLOUD=false
```

**Solution:**
1. **Added to local `.env`:**
   ```env
   NEXT_PUBLIC_CLOUD=true
   CLOUD=true
   ```

2. **Rebuilt client with `--no-cache`** to force fresh build:
   ```bash
   docker build --no-cache \
     -f client/Dockerfile \
     --build-arg NEXT_PUBLIC_BACKEND_URL=https://app.buddystat.com \
     --build-arg NEXT_PUBLIC_CLOUD=true \
     -t iliasgnrs/buddystat-client:latest .
   ```

3. **Deployed to VPS:**
   ```bash
   docker save iliasgnrs/buddystat-client:latest | gzip > /tmp/client-image.tar.gz
   scp /tmp/client-image.tar.gz root@46.62.223.77:/tmp/
   ssh root@46.62.223.77 "docker load < /tmp/client-image.tar.gz"
   ssh root@46.62.223.77 "cd /opt/buddystat && docker-compose up -d client"
   ```

**Why `--no-cache` was critical:**
The first rebuild (with cache) reused old layers from before the env var existed, so `IS_CLOUD` remained `false` in the bundle. Clean rebuild forced all layers to rebuild with correct environment variables.

**Status:** ✅ Fixed

---

### 5. Invalid Plan Override Name
**Problem:** Even after client could call subscription API, it returned "Free plan" status, blocking site creation with error: "You need to be on an active subscription to add websites."

**Root Cause:** `planOverride='pro'` didn't match any actual plan name in the system's plan list. The backend couldn't find plan details, so it defaulted to free tier.

**Valid Plan Names:** Plans follow specific naming conventions:
- Standard tiers: `standard100k`, `standard250k`, `standard500k`, `standard1m`, `standard2m`, `standard5m`, `standard10m`
- Pro tiers: `pro100k`, `pro250k`, `pro500k`, `pro1m`, `pro2m`, `pro5m`, `pro10m`, `pro20m`
- AppSumo tiers: `appsumo-1` through `appsumo-6`

**Solution:**
```sql
UPDATE organization 
SET "planOverride" = 'pro10m' 
WHERE id = 'BjPGnZIwiwn29xWKQ38MObBlekT9uamZ';
```

**Results:**
- **Plan:** Pro 10M
- **Event limit:** 10,000,000 / month
- **Session replays:** 1,000,000 / month
- **Site limit:** Unlimited
- **Status:** Active

**Status:** ✅ Fixed

---

## Critical Script Configuration Error Fixed

### Problem: Script Domain Incorrect
User reported script verification failing with "Script not detected" error.

**Incorrect script URL:**
```html
<!-- ❌ WRONG -->
<script src="https://buddystat.com/api/script.js" data-site-id="b009c5130aee" defer></script>
```

**Correct script URL:**
```html
<!-- ✅ CORRECT -->
<script src="https://app.buddystat.com/api/script.js" data-site-id="b009c5130aee" defer></script>
```

**Verification:**
```bash
curl -I https://buddystat.com/api/script.js
# Returns: HTTP/2 404 ❌

curl -I https://app.buddystat.com/api/script.js
# Returns: HTTP/2 200, content-type: application/javascript ✅
```

**Status:** ✅ Fixed (user updated WordPress code)

---

## Deployment Architecture Lessons

### Environment Variable Flow
1. **Build-time variables** (`NEXT_PUBLIC_*`):
   - Must be in `.env` file during `docker build`
   - Baked into JavaScript bundle
   - Cannot be changed at runtime
   - **Requires rebuild** if changed

2. **Runtime variables** (backend):
   - Can be changed in `docker-compose.yml` environment section
   - Takes effect on container restart
   - No rebuild needed

### Build Cache Pitfalls
- Docker layer caching can preserve old environment variable values
- Use `--no-cache` flag when changing build-time env vars
- Verify correct values in bundle after deployment

### Transfer Method (Avoid VPS OOM)
```bash
# Local: Build and save
docker build --no-cache -f client/Dockerfile -t image:latest .
docker save image:latest | gzip > image.tar.gz

# Transfer
scp image.tar.gz root@VPS:/tmp/

# VPS: Load and deploy
docker load < /tmp/image.tar.gz
docker-compose up -d service_name
```

---

## Git Commits Summary

| Commit | Description |
|--------|-------------|
| c3ebe9a6 | Add CLOUD and other env vars to client service |
| e4f48a65 | Fix: Route analytics scripts to backend instead of client |
| 1deb31fb | Add CLOUD environment variable to backend service |
| 4fe871e2 | Update docker-compose to use BuddyStat image names |
| 20eb7f27 | Whitelabel uptime monitor User-Agent and reengagement emails |
| 7fe9661c | Fix server Dockerfile: npm install instead of npm ci |
| (13 total) | Complete whitelabeling restoration commits |

---

## Verification Checklist

### Backend Health
- [x] `CLOUD=true` in backend container
- [x] Subscription routes registered (`/api/stripe/subscription` returns 401, not 404)
- [x] Analytics script routes to backend (200 OK, JavaScript content-type)
- [x] Database `planOverride='pro10m'` set

### Client Health
- [x] `NEXT_PUBLIC_CLOUD=true` baked into bundle
- [x] Subscription API called on page load
- [x] Dashboard shows "Pro 10M plan" (not "Free plan")
- [x] "Add Site" button enabled (not grayed out)
- [x] Site creation successful

### Data Collection
- [x] Script loads from `https://app.buddystat.com/script.js`
- [x] Script returns JavaScript (not HTML 404)
- [x] Events recording in ClickHouse database
- [x] Analytics data appears in dashboard

### Service Status
```bash
docker-compose ps
# All services: Running/Healthy
# - backend: Up, healthy
# - client: Up
# - caddy: Up
# - postgres: Up, healthy
# - clickhouse: Up, healthy
```

---

## Final Configuration

### VPS Environment (`/opt/buddystat/.env`)
```env
CLOUD=true
NEXT_PUBLIC_CLOUD=true
BASE_URL=https://app.buddystat.com
POSTGRES_USER=buddystat_admin
POSTGRES_PASSWORD=[REDACTED]
POSTGRES_DB=buddystat
BETTER_AUTH_SECRET=[REDACTED]
# ... other vars
```

### Database Configuration
```sql
-- Organization: GNRS.gr
-- ID: BjPGnZIwiwn29xWKQ38MObBlekT9uamZ
-- planOverride: pro10m (10M events/month, unlimited sites)
-- Total sites: 15
```

### Docker Images Deployed
- **Client:** `iliasgnrs/buddystat-client:latest` (f12902dc9023, 2026-02-19 19:22:13 UTC)
- **Backend:** `iliasgnrs/buddystat-server:latest` (026851214294, 2026-02-19 17:46:38 UTC)
- **Docs:** `iliasgnrs/buddystat-docs:latest` (2ab0682202f2, 2026-02-15 17:20:22 UTC)

---

## Future Deployment Guidelines

### Before Building Client
1. **Ensure `.env` has all `NEXT_PUBLIC_*` variables:**
   ```bash
   grep NEXT_PUBLIC .env
   ```

2. **Build with explicit args:**
   ```bash
   docker build --no-cache \
     --build-arg NEXT_PUBLIC_BACKEND_URL=https://app.buddystat.com \
     --build-arg NEXT_PUBLIC_CLOUD=true \
     -f client/Dockerfile \
     -t image:latest .
   ```

3. **Verify env vars in built image:**
   ```bash
   docker run --rm image:latest sh -c "echo \$NEXT_PUBLIC_CLOUD"
   ```

### Before Deploying Backend
1. **Check `docker-compose.yml` environment section includes:**
   - `CLOUD=${CLOUD}`
   - All required runtime env vars

2. **Verify VPS `.env` file has values**

3. **After restart, verify:**
   ```bash
   docker exec backend node -e "console.log(process.env.CLOUD)"
   ```

### Setting Plan Overrides
Use valid plan names only:
```sql
-- Correct examples:
UPDATE organization SET "planOverride" = 'pro10m' WHERE ...;  ✅
UPDATE organization SET "planOverride" = 'standard5m' WHERE ...;  ✅
UPDATE organization SET "planOverride" = 'appsumo-3' WHERE ...;  ✅

-- Incorrect:
UPDATE organization SET "planOverride" = 'pro' WHERE ...;  ❌
UPDATE organization SET "planOverride" = 'unlimited' WHERE ...;  ❌
```

---

## Outcome

All issues resolved:
- ✅ Whitelabeling restored across all services
- ✅ Data collection active (events flowing to ClickHouse)
- ✅ Site creation working (unlimited sites with Pro plan)
- ✅ Subscription API functional (CLOUD mode enabled)
- ✅ Correct script URLs documented
- ✅ All services healthy and operational

**System Status:** Fully operational with Pro 10M plan (10M events/month, unlimited sites)

---

## Timeline

- **18:17 UTC:** Rebuilt client with CLOUD=true (cached build - insufficient)
- **18:18 UTC:** Restarted backend with CLOUD env var
- **18:24 UTC:** Added CLOUD to docker-compose.yml (commit 1deb31fb)
- **19:22 UTC:** Clean rebuild client with --no-cache (final fix)
- **19:23 UTC:** Deployed clean-built client to VPS
- **19:24 UTC:** Updated planOverride to 'pro10m'
- **19:25 UTC:** System fully operational

**Total debug time:** ~1 hour
**Issues fixed:** 6 major issues
**Commits:** 14 total (13 whitelabeling + 1 docker-compose fix)
