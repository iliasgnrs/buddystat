# Authentication & Login Issues - Milestone Documentation

**Date:** February 14-15, 2026  
**Status:** ✅ RESOLVED  
**Priority:** CRITICAL

---

## Executive Summary

This document details a series of critical authentication and login issues encountered during production deployment. These issues prevented users from logging in, caused empty dashboards, and created infinite refresh loops on mobile devices. All issues have been resolved and documented here to prevent similar problems in the future.

---

## Issues Timeline

### Issue 1: Inactive Login Button (Cloudflare Turnstile)
**Symptoms:**
- Login button completely inactive/unclickable
- No visual feedback when clicking login
- Issue persisted across desktop and mobile

**Root Cause:**
Environment variable misconfiguration in `docker-compose.cloud.yml`. The Turnstile site key was being passed as `TURNSTILE_SITE_KEY` but Next.js requires the `NEXT_PUBLIC_` prefix for client-side access.

**Solution:**
- Fixed `docker-compose.cloud.yml` lines 152-164
- Changed `TURNSTILE_SITE_KEY` → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Added `NEXT_PUBLIC_MAPBOX_TOKEN` for consistency
- Rebuilt client container

**Files Modified:**
- `docker-compose.cloud.yml`
- Commit: `9a5c9871`

**Prevention:**
- ✅ All client-side environment variables MUST use `NEXT_PUBLIC_` prefix
- ✅ Build-time variables need ARG declarations in Dockerfile
- ✅ Test login flow after any environment variable changes

---

### Issue 2: Console Errors from Turnstile Component
**Symptoms:**
- Console flooded with `console.error` and `console.warn` messages
- "NEXT_PUBLIC_TURNSTILE_SITE_KEY is not defined" errors
- Degraded developer experience

**Root Cause:**
The Turnstile component was logging errors when the site key was missing, which is expected in self-hosted environments. These were noisy and unnecessary.

**Solution:**
1. Created centralized constants in `client/src/lib/const.ts`:
   ```typescript
   export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
   export const TURNSTILE_ENABLED = IS_CLOUD && !!TURNSTILE_SITE_KEY
   ```

2. Updated `client/src/components/auth/Turnstile.tsx`:
   - Removed `console.error` and `console.warn` statements
   - Changed to silent `return null` when site key missing
   - Imported TURNSTILE_SITE_KEY constant

3. Updated login/signup pages:
   - Used `TURNSTILE_ENABLED` constant instead of inline checks
   - Simplified conditional logic

**Files Modified:**
- `client/src/lib/const.ts`
- `client/src/components/auth/Turnstile.tsx`
- `client/src/app/login/page.tsx`
- `client/src/app/signup/page.tsx`
- Commit: `cf57c04a`

**Prevention:**
- ✅ Centralize configuration constants
- ✅ Avoid console logging for expected optional features
- ✅ Use clear feature flags (TURNSTILE_ENABLED)

---

### Issue 3: Empty Dashboard & 401/403 Errors
**Symptoms:**
- User successfully logged in but dashboard showed no data
- Console errors:
  ```
  401: /api/auth/organization/get-full-organization
  401: /api/user/organizations
  403: /api/auth/admin/has-permission
  403: /api/auth/organization/set-active
  ```
- Backend logs showed: "Invalid origin: https://buddystat.com"
- Data was intact in databases (verified: 15 sites, 8878 events)

**Root Cause:**
Better Auth CORS configuration issue. The backend's `trustedOrigins` array was missing production domains because:
1. `CORS_ORIGINS` environment variable not passed to backend container
2. `NEXT_PUBLIC_APP_URL` environment variable not passed to backend container
3. The auth.ts file had code to read these variables, but they weren't available at runtime

**Code Context:**
```typescript
// server/src/lib/auth.ts (lines 118-126)
trustedOrigins: [
  "http://localhost:3002",
  process.env.BASE_URL || "",
  process.env.NEXT_PUBLIC_APP_URL || "",
  ...(process.env.CORS_ORIGINS?.split(",").filter(Boolean) || []),
].filter(Boolean),
```

The environment had:
```bash
CORS_ORIGINS=https://buddystat.com,https://www.buddystat.com
NEXT_PUBLIC_APP_URL=https://app.buddystat.com
BASE_URL=https://app.buddystat.com
```

But these weren't being passed to the container!

**Solution:**
Added missing environment variables to backend service in `docker-compose.cloud.yml`:

```yaml
backend:
  environment:
    - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
    - BASE_URL=${BASE_URL}
    - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}  # ← ADDED
    - CORS_ORIGINS=${CORS_ORIGINS}                # ← ADDED
    - DISABLE_SIGNUP=${DISABLE_SIGNUP}
```

After restart, trustedOrigins properly included all domains.

**Files Modified:**
- `docker-compose.cloud.yml`
- Commit: `8df9a117`

**Prevention:**
- ✅ ALWAYS pass environment variables explicitly in docker-compose
- ✅ Don't assume .env variables are automatically available in containers
- ✅ Verify auth configuration logs on backend startup
- ✅ Test from all domains (buddystat.com, app.buddystat.com, www.buddystat.com)

---

### Issue 4: Mobile White Screen & Refresh Loop
**Symptoms:**
- Desktop: Login worked perfectly
- Mobile (incognito): Started loading dashboard, then refreshed to white screen
- Created infinite refresh loop on mobile browsers

**Root Cause:**
The `AuthenticationGuard` component was using Next.js `redirect()` function inside a `useEffect`. On mobile browsers, this causes a hard server-side redirect that triggers a full page reload, which then runs the guard again, creating a loop.

**Code Analysis:**
```typescript
// OLD CODE (BROKEN)
import { redirect, usePathname } from "next/navigation";

export function AuthenticationGuard() {
  const { user, isPending } = userStore();
  
  useEffect(() => {
    if (!isPending && !user && !isPublicRoute) {
      redirect("/login"); // ← WRONG: Server-side hard redirect in client component
    }
  }, [isPending, user, pathname]);
}
```

**Solution:**
Replaced `redirect()` with `router.push()` for proper client-side navigation and added redirect prevention:

```typescript
// NEW CODE (FIXED)
import { useRouter, usePathname } from "next/navigation";

export function AuthenticationGuard() {
  const { user, isPending } = userStore();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Reset redirect flag when pathname changes
    hasRedirectedRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (
      !isPending &&
      !user &&
      !isPublicRoute &&
      !hasRedirectedRef.current  // ← Prevent multiple redirects
    ) {
      hasRedirectedRef.current = true;
      router.push("/login");  // ← Proper client-side navigation
    }
  }, [isPending, user, pathname, router]);
}
```

**Files Modified:**
- `client/src/components/AuthenticationGuard.tsx`
- Commit: `d312e05b`

**Prevention:**
- ✅ NEVER use `redirect()` in client components
- ✅ Always use `router.push()` for client-side navigation
- ✅ Add redirect guards (useRef) to prevent loops
- ✅ Test authentication flows on mobile devices
- ✅ Test in mobile incognito/private mode

---

## Critical Lessons Learned

### 1. Environment Variables in Docker
**Problem Pattern:**
- Having variables in `.env` file doesn't mean containers can access them
- Docker Compose requires explicit mapping in `environment:` section

**Best Practice:**
```yaml
# ❌ BAD - Variable exists in .env but not passed to container
backend:
  environment:
    - BASE_URL=${BASE_URL}

# ✅ GOOD - All needed variables explicitly listed
backend:
  environment:
    - BASE_URL=${BASE_URL}
    - CORS_ORIGINS=${CORS_ORIGINS}
    - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
```

### 2. Next.js Environment Variables
**Rules:**
- Client-side variables MUST start with `NEXT_PUBLIC_`
- Server-side variables don't need prefix
- Build-time variables need ARG declarations in Dockerfile
- Runtime changes require container rebuild

**Checklist:**
- [ ] Does client need this variable? → `NEXT_PUBLIC_` prefix
- [ ] Is it in Dockerfile as ARG?
- [ ] Is it in docker-compose build.args?
- [ ] Is it in docker-compose environment?

### 3. Docker Layer Caching
**Problem:**
- Code changes don't always trigger rebuilds due to layer caching
- Auth configuration changes were in code but not in running container

**Solution:**
```bash
# ❌ BAD - May use cached layers
docker-compose up -d --build backend

# ✅ GOOD - Force complete rebuild
docker-compose build --no-cache backend
docker-compose up -d backend
```

### 4. Client-Side Navigation in React
**Never use in client components:**
- ❌ `redirect()` from `next/navigation` (server-side only)
- ❌ `window.location.href = "/path"` (causes full reload)

**Always use:**
- ✅ `router.push()` from `useRouter()` hook
- ✅ `<Link>` component for navigation

### 5. Better Auth Configuration
**Critical Configuration:**
```typescript
{
  trustedOrigins: [
    "http://localhost:3002",              // Development
    process.env.BASE_URL,                 // App domain
    process.env.NEXT_PUBLIC_APP_URL,      // Same, but client-accessible
    ...process.env.CORS_ORIGINS.split(",") // All allowed origins
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    },
  },
}
```

**Must include:**
- All domains users will access from
- Main app domain
- Marketing site domain if it makes auth requests
- Any subdomains

---

## Testing Checklist

Use this checklist before deploying authentication changes:

### Desktop Testing
- [ ] Login from buddystat.com works
- [ ] Login from app.buddystat.com works
- [ ] Dashboard loads after login
- [ ] No console errors related to auth
- [ ] Session persists across page refreshes
- [ ] Logout works cleanly

### Mobile Testing
- [ ] Login works on mobile Chrome
- [ ] Login works on mobile Safari
- [ ] No white screen after successful login
- [ ] No infinite refresh loops
- [ ] Incognito/private mode works
- [ ] Dashboard loads all data on mobile

### Backend Verification
- [ ] No "Invalid origin" errors in backend logs
- [ ] Check `docker logs backend --tail=50` for auth errors
- [ ] Verify trustedOrigins includes all domains
- [ ] Session cookies being set correctly
- [ ] CORS headers present in responses

### Environment Variable Verification
```bash
# Check backend container has all auth variables
ssh buddystat "docker exec backend printenv | grep -E 'CORS|BASE_URL|APP_URL'"

# Should show:
# CORS_ORIGINS=https://buddystat.com,https://www.buddystat.com
# BASE_URL=https://app.buddystat.com
# NEXT_PUBLIC_APP_URL=https://app.buddystat.com
```

### After Deployment
- [ ] Clear browser cache and cookies
- [ ] Test login from incognito window
- [ ] Test from multiple devices
- [ ] Verify no 401/403 errors in browser console
- [ ] Check backend logs for any auth errors
- [ ] Monitor for 5-10 minutes for issues

---

## Quick Troubleshooting Guide

### "Invalid origin" errors in backend logs
**Check:**
1. Is origin in CORS_ORIGINS environment variable?
2. Is CORS_ORIGINS passed to backend container in docker-compose?
3. Did you rebuild backend after adding it?
4. Check: `docker exec backend printenv | grep CORS`

**Fix:**
```bash
# Add to docker-compose.cloud.yml backend environment
- CORS_ORIGINS=${CORS_ORIGINS}
- NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Rebuild
ssh buddystat "cd /opt/buddystat && docker-compose stop backend && docker-compose build --no-cache backend && docker-compose up -d backend"
```

### Login button not working
**Check:**
1. Console errors about Turnstile?
2. Is NEXT_PUBLIC_TURNSTILE_SITE_KEY set?
3. Is it in docker-compose as NEXT_PUBLIC_* not just TURNSTILE_*?

**Fix:**
```yaml
# In docker-compose.cloud.yml client service
args:
  - NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
environment:
  - NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
```

### Mobile white screen / refresh loop
**Check:**
1. Is AuthenticationGuard using `redirect()`?
2. Should be using `router.push()`

**Fix:**
Replace any `redirect()` in client components with:
```typescript
const router = useRouter();
router.push("/login");
```

### Dashboard empty but user logged in
**Check:**
1. 401/403 errors in console?
2. Backend logs showing "Invalid origin"?
3. Data exists? `docker exec postgres psql -U user -d database -c "SELECT COUNT(*) FROM sites;"`

**This is always an authentication/CORS issue, not data loss.**

---

## Related Commits

- `af95e13f` - Better Auth trustedOrigins fix, VersionCheck localStorage
- `9a5c9871` - Fixed Turnstile environment variables
- `cf57c04a` - Removed Turnstile console errors, centralized config
- `0b1aa10a` - Fixed MAPBOX_TOKEN environment variable
- `8df9a117` - Added CORS_ORIGINS and NEXT_PUBLIC_APP_URL to backend
- `d312e05b` - Fixed AuthenticationGuard mobile refresh loop

---

## Deployment Commands Reference

```bash
# Full clean rebuild (when auth changes made)
ssh buddystat "cd /opt/buddystat && git pull && \
  docker-compose stop backend client && \
  docker-compose build --no-cache backend client && \
  docker-compose up -d backend client"

# Check logs for errors
ssh buddystat "docker logs backend --tail=50"
ssh buddystat "docker logs client --tail=50"

# Verify environment variables
ssh buddystat "docker exec backend printenv | grep -E 'CORS|BASE_URL|APP_URL|AUTH'"

# Check all services healthy
ssh buddystat "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

---

## Future Prevention

### Code Review Checklist
When reviewing auth-related PRs, verify:
- [ ] No `redirect()` used in client components
- [ ] Environment variables properly prefixed with NEXT_PUBLIC_
- [ ] Docker Compose explicitly passes all needed env vars
- [ ] trustedOrigins includes all domains
- [ ] Changes tested on both desktop and mobile
- [ ] Changes tested in incognito mode

### Monitoring
Set up alerts for:
- "Invalid origin" errors in backend logs
- Spike in 401/403 responses
- High bounce rate on login page
- Mobile-specific error patterns

### Documentation
- Keep this document updated with any new auth issues
- Document any new authentication features
- Update test checklist as needed

---

## Summary

All critical authentication issues have been resolved:
1. ✅ Turnstile environment variables fixed
2. ✅ CORS origins properly configured  
3. ✅ Mobile navigation fixed (redirect → router.push)
4. ✅ Console errors cleaned up
5. ✅ All environment variables properly passed to containers

**Current Status:** Production authentication is stable on all devices and domains.

**Last Updated:** February 15, 2026  
**Next Review:** After any authentication-related changes
