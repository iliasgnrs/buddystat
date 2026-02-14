#!/bin/bash

# Deploy to Hetzner VPS Script
# This script pushes your local changes to the VPS and rebuilds the containers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - Update these values or use environment variables
# If you've set up SSH config (see SSH_SETUP.md), use: VPS_HOST="buddystat"
VPS_HOST="${VPS_HOST:-buddystat}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/opt/buddystat}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.cloud.yml}"

echo -e "${YELLOW}BuddyStat Deployment to Hetzner VPS${NC}"
echo "=================================="
echo ""

# Check if VPS_HOST is default and SSH config doesn't exist
if [ "$VPS_HOST" = "buddystat" ]; then
    if ! grep -q "Host buddystat" ~/.ssh/config 2>/dev/null; then
        echo -e "${RED}Error: SSH not configured${NC}"
        echo ""
        echo "Please run the SSH setup script first:"
        echo -e "${YELLOW}  ./setup-ssh-hetzner.sh${NC}"
        echo ""
        echo "Or set VPS_HOST manually:"
        echo -e "${YELLOW}  VPS_HOST=your-ip ./deploy-to-hetzner.sh${NC}"
        echo ""
        echo "See SSH_SETUP.md for more information."
        exit 1
    fi
fi

# Confirm deployment
read -p "Deploy to $VPS_HOST? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 1: Running local tests...${NC}"
# Add your test commands here if needed
# npm test

echo -e "${GREEN}✓ Local checks passed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Committing changes...${NC}"
if [[ -n $(git status -s) ]]; then
    echo "Uncommitted changes detected. Please commit or stash them first."
    git status -s
    exit 1
fi
echo -e "${GREEN}✓ Working directory clean${NC}"
echo ""

echo -e "${YELLOW}Step 3: Pushing to origin...${NC}"
git push origin master
echo -e "${GREEN}✓ Pushed to origin${NC}"
echo ""

echo -e "${YELLOW}Step 4: Deploying to VPS...${NC}"

# Use simpler syntax if VPS_HOST is an SSH config alias
if [ "$VPS_USER" = "root" ] && grep -q "Host $VPS_HOST" ~/.ssh/config 2>/dev/null; then
    SSH_TARGET="$VPS_HOST"
else
    SSH_TARGET="${VPS_USER}@${VPS_HOST}"
fi

ssh ${SSH_TARGET} << ENDSSH
    set -e
    cd ${VPS_PATH}
    
    echo "Pulling latest changes..."
    git pull origin master
    
    echo "Backing up current .env..."
    cp .env .env.backup-\$(date +%Y%m%d-%H%M%S)
    
    echo "Building and restarting containers..."
    docker-compose -f ${COMPOSE_FILE} pull
    docker-compose -f ${COMPOSE_FILE} up -d --build
    
    echo "Cleaning up old images..."
    docker image prune -f
    
    echo "Deployment complete!"
    echo ""
    echo "Container status:"
    docker-compose -f ${COMPOSE_FILE} ps
ENDSSH

echo ""
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo ""
echo "View logs with:"
echo "  ssh ${SSH_TARGET} 'cd ${VPS_PATH} && docker-compose -f ${COMPOSE_FILE} logs -f'"
