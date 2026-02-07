#!/bin/bash

# Initial Hetzner VPS Setup Script
# Run this script on your Hetzner VPS to prepare for BuddyStat deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}BuddyStat Hetzner VPS Initial Setup${NC}"
echo "===================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
apt-get update
apt-get upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing required packages...${NC}"
apt-get install -y \
    git \
    curl \
    wget \
    ca-certificates \
    gnupg \
    lsb-release
echo -e "${GREEN}✓ Packages installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Installing Docker...${NC}"
if command -v docker &> /dev/null; then
    echo "Docker already installed"
else
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
fi
echo -e "${GREEN}✓ Docker installed${NC}"
echo ""

echo -e "${YELLOW}Step 4: Installing Docker Compose...${NC}"
if command -v docker-compose &> /dev/null; then
    echo "Docker Compose already installed"
else
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi
docker-compose --version
echo -e "${GREEN}✓ Docker Compose installed${NC}"
echo ""

echo -e "${YELLOW}Step 5: Setting up firewall (UFW)...${NC}"
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw status
    echo -e "${GREEN}✓ Firewall configured${NC}"
else
    apt-get install -y ufw
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo -e "${GREEN}✓ Firewall installed and configured${NC}"
fi
echo ""

echo -e "${YELLOW}Step 6: Creating application directory...${NC}"
mkdir -p /opt/buddystat
chown -R $SUDO_USER:$SUDO_USER /opt/buddystat
echo -e "${GREEN}✓ Directory created: /opt/buddystat${NC}"
echo ""

echo -e "${YELLOW}Step 7: Setting up automatic updates...${NC}"
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
echo -e "${GREEN}✓ Automatic security updates enabled${NC}"
echo ""

echo -e "${GREEN}=====================================\n Setup Complete! ✓\n=====================================\n${NC}"

echo "Next steps:"
echo ""
echo "1. Clone your repository:"
echo "   cd /opt/buddystat"
echo "   git clone https://github.com/iliasgnrs/buddystat.git ."
echo ""
echo "2. Configure your environment:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "3. Start the application:"
echo "   docker-compose -f docker-compose.cloud.yml up -d"
echo ""
echo "4. Configure your domain DNS to point to this server's IP"
echo ""
echo "5. Monitor logs:"
echo "   docker-compose -f docker-compose.cloud.yml logs -f"
echo ""
echo -e "${YELLOW}For more details, see DEPLOYMENT.md${NC}"
