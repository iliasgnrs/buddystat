#!/bin/bash

# Setup SSH Key Authentication on Hetzner VPS
# This script configures passwordless SSH access to your Hetzner server

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}BuddyStat - Hetzner SSH Key Setup${NC}"
echo "====================================="
echo ""

# Check if SSH key exists
if [ ! -f ~/.ssh/id_ed25519.pub ]; then
    echo -e "${RED}Error: SSH key not found at ~/.ssh/id_ed25519.pub${NC}"
    echo "Generate a key first with: ssh-keygen -t ed25519 -C 'info@buddystat.com'"
    exit 1
fi

# Get VPS IP or hostname
read -p "Enter your Hetzner VPS IP or hostname: " VPS_HOST
if [ -z "$VPS_HOST" ]; then
    echo -e "${RED}Error: VPS host is required${NC}"
    exit 1
fi

# Get username (default: root)
read -p "Enter SSH username [root]: " VPS_USER
VPS_USER=${VPS_USER:-root}

# Get SSH port (default: 22)
read -p "Enter SSH port [22]: " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "VPS Host: $VPS_HOST"
echo "User: $VPS_USER"
echo "Port: $SSH_PORT"
echo ""

read -p "Continue with this configuration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 1: Copying SSH key to server...${NC}"
echo "You will be prompted for your password one last time."
echo ""

# Copy SSH key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p $SSH_PORT $VPS_USER@$VPS_HOST

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSH key copied successfully${NC}"
else
    echo -e "${RED}✗ Failed to copy SSH key${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Testing passwordless connection...${NC}"
if ssh -p $SSH_PORT -o BatchMode=yes -o ConnectTimeout=5 $VPS_USER@$VPS_HOST "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓ Passwordless SSH is working!${NC}"
else
    echo -e "${RED}✗ Connection test failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Creating SSH config entry...${NC}"

# Backup existing config if it exists
if [ -f ~/.ssh/config ]; then
    cp ~/.ssh/config ~/.ssh/config.backup.$(date +%Y%m%d_%H%M%S)
    echo "Backed up existing SSH config"
fi

# Check if entry already exists
if grep -q "Host buddystat-hetzner" ~/.ssh/config 2>/dev/null; then
    echo -e "${YELLOW}SSH config entry already exists. Updating...${NC}"
    # Remove old entry
    sed -i '/^Host buddystat-hetzner$/,/^$/d' ~/.ssh/config
fi

# Add new entry
cat >> ~/.ssh/config << EOF

# BuddyStat Hetzner VPS
Host buddystat-hetzner
    HostName $VPS_HOST
    User $VPS_USER
    Port $SSH_PORT
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
    Compression yes

# Shorthand alias
Host buddystat
    HostName $VPS_HOST
    User $VPS_USER
    Port $SSH_PORT
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
    Compression yes
EOF

chmod 600 ~/.ssh/config
echo -e "${GREEN}✓ SSH config created${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SSH Key Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "You can now connect to your server without a password using:"
echo -e "${YELLOW}  ssh buddystat${NC}"
echo "or"
echo -e "${YELLOW}  ssh buddystat-hetzner${NC}"
echo ""
echo "The following files were modified:"
echo "  - ~/.ssh/authorized_keys (on remote server)"
echo "  - ~/.ssh/config (on local machine)"
echo ""
echo "Your public key:"
cat ~/.ssh/id_ed25519.pub
echo ""
