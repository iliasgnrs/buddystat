#!/bin/bash
# Quick deployment script to apply turnstile fixes to VPS

set -e

echo "🚀 Deploying turnstile fixes to VPS..."
echo ""

# SSH into VPS and run deployment commands
ssh root@46.62.223.77 << 'ENDSSH'
    set -e
    cd /opt/buddystat
    
    echo "📥 Pulling latest changes..."
    git pull origin master
    
    echo "🔨 Rebuilding client container..."
    docker-compose up -d --build client
    
    echo "🧹 Cleaning up old images..."
    docker image prune -f
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📊 Container status:"
    docker-compose ps
    
    echo ""
    echo "📝 You can view logs with:"
    echo "   docker-compose logs -f client"
ENDSSH

echo ""
echo "✅ All done! The turnstile fixes are now live on your VPS."
echo ""
echo "What was fixed:"
echo "  ✓ AppSumo callback now checks NODE_ENV for production"
echo "  ✓ Invitation signup turnstile moved before button"
echo "  ✓ Added missing turnstile to invitation login"
echo "  ✓ All forms now consistently check IS_CLOUD && NODE_ENV === 'production'"
