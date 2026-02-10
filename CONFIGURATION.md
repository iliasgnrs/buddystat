# BuddyStat Configuration Guide

## Environment Variables Setup

### On Your VPS (46.62.223.77)

Create or edit your `.env` file in `/opt/buddystat/`:

```bash
ssh root@46.62.223.77
cd /opt/buddystat
nano .env
```

## 1. IPAPI Key Configuration

Your IPAPI key enables VPN, Crawler, ASN, and Company tracking.

Add this line to your `.env` file:

```bash
IPAPI_KEY=3071C4EAB61AAE678A1FDFF0512679EC
```

**What this enables:**
- ✓ VPN Detection (NordVPN, ExpressVPN, ProtonVPN, etc.)
- ✓ Crawler Detection (Googlebot, Bingbot, etc.)
- ✓ Datacenter Traffic Detection
- ✓ ASN (Autonomous System Number) tracking
- ✓ Company identification from IP addresses

**Testing:**
After deployment, go to your analytics dashboard → Add Filter → You should see VPN, Crawler, ASN options available.

---

## 2. Google Search Console Integration

Google Search Console allows you to view search performance data including top keywords and pages directly in BuddyStat.

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Search Console API**:
   - Navigate to **APIs & Services** → **Library**
   - Search for "Google Search Console API"
   - Click **Enable**

4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `BuddyStat`
   - **Authorized redirect URIs**: Add your callback URL:
     ```
     https://your-domain.com/api/sites/:siteId/gsc/callback
     ```
     Replace `your-domain.com` with your actual domain (e.g., `analytics.example.com`)

5. Copy your credentials:
   - **Client ID** (looks like: `1234567890-abcdefg.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-xxxxxxxxxxxx`)

### Step 2: Add Credentials to .env

Add these lines to your `.env` file:

```bash
# Google Search Console OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
GOOGLE_REDIRECT_URI=https://your-domain.com/api/sites/:siteId/gsc/callback
```

**Important:** Replace `your-domain.com` with your actual BuddyStat domain!

### Step 3: Deploy Changes

```bash
# Still on VPS
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d
```

### Step 4: Connect Google Search Console

1. Go to your BuddyStat site → **Site Settings**
2. Look for **"Google Search Console"** section
3. Click **"Connect Google Search Console"**
4. Authorize with your Google account
5. Select the property you want to connect
6. Done! Search data will appear in your Main dashboard

**Where to find GSC data:**
- Main dashboard → **Search Console** section
- Shows top keywords, pages, impressions, clicks, CTR, and position

---

## 3. Email Reports Configuration

Weekly analytics email reports require SMTP configuration.

### Using Gmail SMTP (Recommended for testing):

Add to your `.env`:

```bash
# Email Configuration
RESEND_API_KEY=your-resend-api-key
# OR use SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

**Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use that password in SMTP_PASS

### Using Resend (Recommended for production):

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

### Enable Email Reports:

After configuring SMTP/Resend:
1. Settings → Account
2. Toggle **"Send Weekly Email Reports"**
3. Reports sent every Monday at midnight UTC

---

## Complete .env File Example

Here's a minimal working configuration:

```bash
# Domain and URLs
DOMAIN_NAME=analytics.yourdomain.com
BASE_URL=https://analytics.yourdomain.com

# Authentication
BETTER_AUTH_SECRET=your-long-random-secret-here
DISABLE_SIGNUP=false

# Databases
CLICKHOUSE_DB=analytics
CLICKHOUSE_PASSWORD=your-secure-password
POSTGRES_DB=analytics
POSTGRES_USER=buddystat
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_PASSWORD=your-redis-password

# IPAPI for VPN/ASN/Company tracking
IPAPI_KEY=3071C4EAB61AAE678A1FDFF0512679EC

# Google Search Console
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_REDIRECT_URI=https://analytics.yourdomain.com/api/sites/:siteId/gsc/callback

# Email Reports (choose one)
RESEND_API_KEY=re_xxxxxxxxxxxx
# OR
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Mapbox for maps
MAPBOX_TOKEN=your-mapbox-token

# Cloud features (set to true to enable all features)
CLOUD=true
```

---

## Deployment Workflow

After making changes to `.env`:

```bash
# 1. On VPS - restart services
ssh root@46.62.223.77
cd /opt/buddystat
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d

# 2. Verify logs
docker-compose -f docker-compose.cloud.yml logs -f backend

# 3. Check it worked
# - IPAPI: Try adding VPN/ASN filters
# - GSC: Check Site Settings for "Connect Google Search Console" button
# - Email: Toggle email reports in Account Settings
```

---

## Troubleshooting

### IPAPI not working:
- Check logs: `docker-compose logs backend | grep IPAPI`
- Verify key is correct in `.env`
- Check your IPAPI account quota at [ipapi.com/account](https://app.ipapi.com/)

### Google Search Console not appearing:
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check redirect URI matches exactly (including https://)
- Verify Google Search Console API is enabled in Google Cloud Console
- Check logs: `docker-compose logs backend | grep gsc`

### Email Reports not sending:
- Check SMTP credentials are correct
- For Gmail: ensure app password (not regular password)
- Test with: `docker-compose logs backend | grep email`
- Verify cron is running: `docker-compose exec backend ps aux | grep cron`

---

## Security Notes

- Never commit `.env` file to Git (it's in .gitignore)
- Keep your secrets secure
- Use strong passwords (generate with: `openssl rand -base64 32`)
- Regularly rotate credentials
- For production, use proper secret management

---

## Need Help?

- Documentation: [Your local /docs route]
- Configuration issues: Check `docker-compose logs`
- IPAPI issues: support@ipapi.com
- GSC issues: Check Google Cloud Console logs
