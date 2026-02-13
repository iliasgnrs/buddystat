# SSL Certificate Configuration

This project uses **Cloudflare Origin Certificates** to enable SSL/TLS encryption while keeping Cloudflare proxy enabled (orange cloud).

## Certificate Files

The following files must exist in the project root directory on the VPS:

- `buddystat.crt` - Cloudflare Origin Certificate
- `buddystat.key` - Private key for the certificate

**⚠️ IMPORTANT: These files contain sensitive information and are NOT committed to git. They are in `.gitignore`.**

## How Cloudflare Origin Certificates Work

1. **Client → Cloudflare**: Full SSL encryption
2. **Cloudflare → Origin (VPS)**: SSL encryption using Origin Certificate
3. Cloudflare proxy can stay enabled (orange cloud)
4. Certificates are valid for 15 years
5. Only Cloudflare can connect to origin using these certificates

## Current Certificate Details

- **Issued**: February 13, 2026
- **Expires**: February 9, 2041 (15 years)
- **Domains covered**:
  - `buddystat.com`
  - `*.buddystat.com`
  - `app.buddystat.com`

## Certificate Renewal (2041)

When the current certificate expires, generate a new one:

### Step 1: Generate New Certificate

1. Log in to Cloudflare Dashboard
2. Navigate to your domain → SSL/TLS → Origin Server
3. Click "Create Certificate"
4. Select these options:
   - **Generate private key and CSR with Cloudflare**
   - **Hostnames**: `buddystat.com`, `*.buddystat.com`, `app.buddystat.com`
   - **Validity**: 15 years
5. Click "Create"
6. Copy both the certificate and private key

### Step 2: Update VPS

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Navigate to project directory
cd /opt/buddystat

# Backup old certificates
cp buddystat.crt buddystat.crt.backup
cp buddystat.key buddystat.key.backup

# Create new certificate file
cat > buddystat.crt << 'EOF'
-----BEGIN CERTIFICATE-----
[Paste certificate here]
-----END CERTIFICATE-----
EOF

# Create new private key file
cat > buddystat.key << 'EOF'
-----BEGIN PRIVATE KEY-----
[Paste private key here]
-----END PRIVATE KEY-----
EOF

# Restart Caddy to apply new certificates
docker-compose -f docker-compose.cloud.yml restart caddy

# Verify SSL is working
curl -I https://buddystat.com
curl -I https://app.buddystat.com
```

### Step 3: Verify

Test both domains in a browser:
- https://buddystat.com
- https://app.buddystat.com

Check for:
- ✅ Green padlock
- ✅ Valid certificate
- ✅ No browser warnings

## Troubleshooting

### "Certificate not found" errors

```bash
# Verify files exist and are readable
ls -lh buddystat.crt buddystat.key

# Check they're mounted in Caddy container
docker exec caddy ls -lh /opt/buddystat/

# If not mounted, recreate container
docker-compose -f docker-compose.cloud.yml up -d --force-recreate caddy
```

### "OCSP stapling" warnings

These warnings are **normal** for Cloudflare Origin Certificates:
```
no OCSP stapling for [cloudflare origin certificate...]: no URL to issuing certificate
```

Origin certificates don't support OCSP stapling, but the connection is still secure.

### SSL handshake failures

1. **Cloudflare proxy must be enabled** (orange cloud)
2. SSL/TLS encryption mode must be **Full** or **Full (strict)** in Cloudflare
3. Certificate files must be mounted in Caddy container
4. Caddyfile must reference correct paths

## Security Notes

- **Never commit** `buddystat.crt` or `buddystat.key` to git
- Only Cloudflare can use these certificates to connect to your origin
- Direct connections to VPS IP will fail SSL validation (by design)
- Keep backup copies of certificates in secure location
- Origin certificates are specific to Cloudflare - don't use elsewhere

## See Also

- [Cloudflare Origin CA Documentation](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)
- [Caddyfile Configuration](./Caddyfile)
- [Docker Compose Configuration](./docker-compose.cloud.yml)
