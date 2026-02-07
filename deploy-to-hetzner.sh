#!/bin/bash

# Deploy to Hetzner VPS Script
# This script pushes your local changes to the VPS and rebuilds the containers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - Update these values
VPS_HOST="${VPS_HOST:-your-vps-ip}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/opt/buddystat}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.cloud.yml}"

echo -e "${YELLOW}BuddyStat Deployment to Hetzner VPS${NC}"
echo "=================================="
echo ""

# Check if VPS_HOST is default
if [ "$VPS_HOST" = "your-vps-ip" ]; then
    echo -e "${RED}Error: Please set VPS_HOST environment variable${NC}"
    echo "Usage: VPS_HOST=your-ip VPS_USER=your-user ./deploy-to-hetzner.sh"
    echo "Or edit this script and update the default values"
    exit 1
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
ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
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
echo "  ssh ${VPS_USER}@${VPS_HOST} 'cd ${VPS_PATH} && docker-compose -f ${COMPOSE_FILE} logs -f'"
