# BuddyStat — Operations Guide

Your customized fork of [Rybbit](https://github.com/rybbit-io/rybbit) with white-labeling and deployment automation.

> **⚠️ Before making changes read [INCIDENTS.md](./INCIDENTS.md)** — it documents every production outage and the exact precautions to avoid repeating them.

---

## Quick Reference

| Item | Value |
|------|-------|
| VPS | `root@46.62.223.77` |
| App path | `/opt/buddystat` |
| App URL | `https://app.buddystat.com` |
| Docker compose | `docker-compose.yml` |
| Git repo | `github.com/iliasgnrs/buddystat` |
| Upstream | `github.com/rybbit-io/rybbit` |

---

## 1. Initial VPS Setup

```bash
ssh root@YOUR_VPS_IP
curl -fsSL https://raw.githubusercontent.com/iliasgnrs/buddystat/master/setup-vps.sh | bash
```

Then:
```bash
cd /opt/buddystat
git clone https://github.com/iliasgnrs/buddystat.git .
cp .env.example .env
nano .env
```

---

## 2. Environment Variables (`/opt/buddystat/.env`)

Minimum required configuration:

```env
# Cloud mode — REQUIRED for site creation, subscriptions, all features
CLOUD=true
NEXT_PUBLIC_CLOUD=true

# Domain
DOMAIN_NAME=buddystat.com
APP_DOMAIN=app.buddystat.com
BASE_URL=https://app.buddystat.com
NEXT_PUBLIC_APP_URL=https://app.buddystat.com
CORS_ORIGINS=https://buddystat.com,https://app.buddystat.com

# Auth
BETTER_AUTH_SECRET=<generate: openssl rand -base64 32>
DISABLE_SIGNUP=false

# Databases
CLICKHOUSE_DB=analytics
CLICKHOUSE_PASSWORD=your-secure-password
POSTGRES_DB=analytics
POSTGRES_USER=your-user
POSTGRES_PASSWORD=your-secure-password

# IPAPI — enables VPN, ASN, Company, Crawler, Datacenter tabs
IPAPI_KEY=4a266f011dab1bfba66f

# Email (choose one)
RESEND_API_KEY=re_xxxxxxxxxxxx
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your@gmail.com
# SMTP_PASS=your-app-password

# Optional integrations
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://app.buddystat.com/api/sites/:siteId/gsc/callback
MAPBOX_TOKEN=your-mapbox-token
```

### Environment Variable Rules

1. **`CLOUD=true`** — enables subscriptions, site limits, all paid features
2. **`NEXT_PUBLIC_*` prefix** — required for any variable accessed by the Next.js client
3. **Client variables are baked at build time** — changing them requires rebuilding the client image (do this locally, not on VPS)
4. **All backend vars must be listed explicitly** in the `environment:` section of `docker-compose.yml` — just having them in `.env` is not enough

---

## 3. Daily Workflow

### Make and deploy a backend change

```bash
# Local — make changes and push
git add .
git commit -m "feat: description"
git push origin master

# VPS — pull and rebuild backend only
ssh root@46.62.223.77 "cd /opt/buddystat && \
  git pull origin master && \
  docker-compose build --no-cache backend && \
  docker-compose up -d --no-deps backend"
```

### Rebuild client (do this LOCALLY — VPS has insufficient RAM)

```bash
# Local machine
docker build --no-cache \
  --build-arg NEXT_PUBLIC_BACKEND_URL=https://app.buddystat.com \
  --build-arg NEXT_PUBLIC_CLOUD=true \
  -f client/Dockerfile \
  -t iliasgnrs/buddystat-client:latest .

# Transfer to VPS
docker save iliasgnrs/buddystat-client:latest | gzip > /tmp/client.tar.gz
scp /tmp/client.tar.gz root@46.62.223.77:/tmp/
ssh root@46.62.223.77 "docker load < /tmp/client.tar.gz && \
  cd /opt/buddystat && docker-compose up -d --no-deps client"
```

---

## 4. Update from Upstream (Rybbit)

```bash
# Pull changes from upstream
./update-from-upstream.sh

# Test locally
docker-compose up --build

# After merging, ALWAYS verify these haven't been reverted:
# 1. Caddyfile routes /script.js to backend (not client)
# 2. docker-compose.yml has CLOUD, IPAPI_KEY, CORS_ORIGINS in backend env
# 3. server/src/db/geolocation/geolocation.ts has getLocationFromLocal() fallback

# Deploy
git push origin master
ssh root@46.62.223.77 "cd /opt/buddystat && git pull && \
  docker-compose build --no-cache backend && \
  docker-compose up -d --no-deps backend"
```

### What `.gitattributes` protects (always your version):
- All `.env*` files
- `deploy-to-hetzner.sh`, `update-from-upstream.sh`
- `client/public/logo.*`, `client/public/favicon.*`

---

## 5. Production Management

### Check all services

```bash
ssh root@46.62.223.77 "cd /opt/buddystat && docker-compose ps"
```

### View logs

```bash
ssh root@46.62.223.77 "docker-compose -f /opt/buddystat/docker-compose.yml logs --tail=50 backend"
ssh root@46.62.223.77 "docker-compose -f /opt/buddystat/docker-compose.yml logs --tail=50 client"
```

### Restart a single service (NEVER restart all at once)

```bash
ssh root@46.62.223.77 "cd /opt/buddystat && docker-compose up -d --no-deps backend"
```

### Verify environment inside container

```bash
ssh root@46.62.223.77 "docker exec backend printenv | grep -E 'CLOUD|IPAPI|CORS|BASE_URL'"
```

### Database backup (do before any risky operation)

```bash
ssh root@46.62.223.77 "docker exec postgres pg_dump -U frog analytics > /tmp/backup-$(date +%Y%m%d-%H%M).sql"
```

### Check organization plan

```bash
ssh root@46.62.223.77 "docker exec postgres psql -U frog -d analytics \
  -c \"SELECT id, name, \\\"planOverride\\\" FROM organization;\""
```

---

## 6. Feature Configuration

### IPAPI — VPN / ASN / Company / Crawler Tracking

Without `IPAPI_KEY`, only country/city/region/timezone tabs work (via GeoLite2). With it, all tabs work.

Add to `.env` then restart backend:
```bash
echo "IPAPI_KEY=4a266f011dab1bfba66f" >> /opt/buddystat/.env
docker-compose up -d --no-deps backend
```

Verify it is working (wait 2–3 min for new events):
```bash
docker exec clickhouse clickhouse-client --password frog -q \
  "SELECT count() total, countIf(country!='') geo, countIf(asn_org!='') asn
   FROM analytics.events WHERE timestamp >= now() - INTERVAL 5 MINUTE"
```

### Google Search Console

1. Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable Google Search Console API
3. Add redirect URI: `https://app.buddystat.com/api/sites/:siteId/gsc/callback`
4. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxx
   GOOGLE_REDIRECT_URI=https://app.buddystat.com/api/sites/:siteId/gsc/callback
   ```
5. Restart backend, then connect via Site Settings → Google Search Console

### Email Reports (Resend — recommended)

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
```

Reports send every Monday at midnight UTC. Enable per site in Site Settings.

### Mapbox (for map visualization)

```env
MAPBOX_TOKEN=your-token-from-mapbox.com
```

---

## 7. SSL Certificates

BuddyStat uses **Cloudflare Origin Certificates** (valid 15 years, issued Feb 13, 2026, expires Feb 9, 2041).

Files on VPS (NOT in git):
```
/opt/buddystat/buddystat.crt
/opt/buddystat/buddystat.key
```

These cover: `buddystat.com`, `*.buddystat.com`, `app.buddystat.com`

### Renewal (2041)
1. Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
2. Select hostnames, 15-year validity
3. Replace files on VPS, restart Caddy:
```bash
docker-compose up -d --no-deps caddy
curl -I https://buddystat.com
```

**Never commit cert files to git.**

---

## 8. Plan Overrides

Valid plan names for `UPDATE organization SET "planOverride" = '...'`:

```
pro100k  pro250k  pro500k  pro1m  pro2m  pro5m  pro10m  pro20m
standard100k  standard250k  standard500k  standard1m  standard2m  standard5m  standard10m
appsumo-1  through  appsumo-6
```

Current plan: `pro20m` (20M events/month, unlimited sites)

---

## 9. Troubleshooting

| Symptom | Check |
|---------|-------|
| Login button inactive | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` prefix in docker-compose build args |
| 401/403 on all API calls | `CORS_ORIGINS` and `BASE_URL` in backend container env |
| Dashboard shows "Free plan" | `NEXT_PUBLIC_CLOUD=true` baked into client image? Client needs rebuild |
| New sites can't be added | `CLOUD=true` in backend env — `docker exec backend printenv | grep CLOUD` |
| Country/city tabs empty | Backend on latest code? Run `docker-compose build --no-cache backend` |
| VPN/ASN/Company tabs empty | `IPAPI_KEY` in `.env` and passed to backend container |
| Analytics script 404 | Caddyfile must route `/script.js` to `backend:3001`, not client |
| Backend won't build | Check `shared/tsconfig.tsbuildinfo` excluded via `.dockerignore`, see `INCIDENTS.md` |
| Mobile white screen/loop | `AuthenticationGuard` must use `router.push()` not `redirect()` |

---

## 10. Tracking Script

Install on customer sites:
```html
<script src="https://app.buddystat.com/api/script.js" data-site-id="YOUR_SITE_ID" defer></script>
```

`buddystat.com/api/script.js` returns 404 — always use `app.buddystat.com`.
