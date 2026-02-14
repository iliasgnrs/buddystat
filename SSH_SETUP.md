# SSH Setup for Hetzner VPS

This guide will help you set up passwordless SSH access to your Hetzner VPS for BuddyStat deployment.

## Quick Setup

Run the automated setup script:

```bash
./setup-ssh-hetzner.sh
```

This script will:
1. Copy your SSH public key to the Hetzner server
2. Test the passwordless connection
3. Create an SSH config entry for easy access

After completion, you can connect using:
```bash
ssh buddystat
```

## Manual Setup (Alternative)

If you prefer to set up SSH manually:

### 1. Generate SSH Key (if not exists)

```bash
ssh-keygen -t ed25519 -C "info@buddystat.com"
```

Press Enter to accept the default location (`~/.ssh/id_ed25519`).
You can leave the passphrase empty for truly passwordless access, or add one for extra security.

### 2. Copy SSH Key to Server

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@YOUR_SERVER_IP
```

You'll be prompted for your password one last time.

### 3. Create SSH Config

Create or edit `~/.ssh/config`:

```bash
nano ~/.ssh/config
```

Add this configuration:

```
# BuddyStat Hetzner VPS
Host buddystat-hetzner
    HostName YOUR_SERVER_IP
    User root
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
    Compression yes

# Shorthand alias
Host buddystat
    HostName YOUR_SERVER_IP
    User root
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
    Compression yes
```

Save and set proper permissions:

```bash
chmod 600 ~/.ssh/config
```

### 4. Test Connection

```bash
ssh buddystat
```

You should now connect without entering a password!

## SSH Config Explanation

- **HostName**: Your Hetzner VPS IP address or hostname
- **User**: SSH user (usually `root` for VPS)
- **Port**: SSH port (default: 22)
- **IdentityFile**: Path to your private SSH key
- **ServerAliveInterval**: Keeps connection alive every 60 seconds
- **ServerAliveCountMax**: Maximum failed keepalive attempts before disconnect
- **Compression**: Enables data compression for faster transfers

## Adding SSH Key via Hetzner Cloud Console

Alternatively, you can add your SSH key through the Hetzner Cloud Console:

1. Login to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Go to your project
3. Navigate to "Security" → "SSH Keys"
4. Click "Add SSH Key"
5. Paste your public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
6. Name it "buddystat-deploy" or similar
7. The key will be automatically added to any new servers you create

## Troubleshooting

### Permission Denied

If you still get "Permission denied", check:

```bash
# On your local machine
ls -la ~/.ssh/id_ed25519
# Should show: -rw-------

# On the server
ssh buddystat "ls -la ~/.ssh"
# authorized_keys should show: -rw-------
```

Fix permissions if needed:
```bash
# Local
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Remote (via SSH)
ssh buddystat "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

### Connection Timeout

If connection times out:
1. Check your VPS firewall allows port 22 (or your custom SSH port)
2. Verify the IP address is correct
3. Check if the server is running

### Key Not Being Used

If SSH still asks for password:
```bash
# Test with verbose output
ssh -v buddystat

# Look for lines like:
# debug1: Offering public key: /home/user/.ssh/id_ed25519
```

## Security Best Practices

1. **Disable Password Authentication** (after SSH key setup):
   ```bash
   ssh buddystat
   sudo nano /etc/ssh/sshd_config
   ```
   
   Set:
   ```
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```
   
   Restart SSH:
   ```bash
   sudo systemctl restart sshd
   ```

2. **Change Default SSH Port** (optional):
   ```bash
   # In /etc/ssh/sshd_config
   Port 2222
   ```
   
   Update your `~/.ssh/config` accordingly.

3. **Use SSH Key Passphrase**: Add an extra layer of security by using a passphrase for your SSH key. Use `ssh-agent` to avoid typing it repeatedly:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

4. **Disable Root Login** (after creating a non-root user):
   ```bash
   # In /etc/ssh/sshd_config
   PermitRootLogin no
   ```

## Using with Deployment Scripts

Once SSH is configured, update your deployment scripts to use the SSH alias:

```bash
# In deploy-to-hetzner.sh
VPS_HOST="buddystat"  # Instead of IP address
```

This makes deployments cleaner and more maintainable.

## Your Public Key

Your current public key (for reference):

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC7IMUvC4aC9ITwW/bA2Atp5RZ8XWgAY497FGRXCRXwr iliasgnrs@gmail.com
```

You can view it anytime with:
```bash
cat ~/.ssh/id_ed25519.pub
```

## Next Steps

After setting up SSH:

1. Run the VPS setup script:
   ```bash
   ssh buddystat < setup-vps.sh
   ```

2. Deploy your application:
   ```bash
   ./deploy-to-hetzner.sh
   ```

3. Consider setting up automated deployments via SSH

---

For more information, see:
- [Hetzner SSH Key Guide](https://docs.hetzner.com/cloud/servers/getting-started/connect-ssh/)
- [OpenSSH Config File](https://www.ssh.com/academy/ssh/config)
