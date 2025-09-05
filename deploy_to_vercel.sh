#!/bin/bash

# 🚀 Deploy Lance Next.js App to Vercel
# This script helps deploy your Next.js application to Vercel

set -e  # Exit on any error

echo "🚀 Starting deployment to Vercel..."
echo "📅 $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the main directory of your Next.js app${NC}"
    echo "Current directory: $(pwd)"
    echo "Expected to find: package.json"
    exit 1
fi

echo -e "${BLUE}📋 Deployment Plan:${NC}"
echo "1. ✅ Navigate to main directory"
echo "2. 🔍 Check Vercel CLI installation"
echo "3. 🚀 Deploy to Vercel"
echo "4. 🔧 Configure environment variables"
echo "5. ✅ Verify deployment"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command_exists vercel; then
    echo -e "${RED}❌ Vercel CLI not found. Please install it first:${NC}"
    echo "npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"

# Check if user is logged in to Vercel
echo -e "${YELLOW}🔐 Checking Vercel authentication...${NC}"
if ! vercel whoami >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please log in:${NC}"
    vercel login
fi

echo -e "${GREEN}✅ Vercel authentication verified${NC}"
echo ""

# Deploy to Vercel
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
echo "This will deploy your Next.js application to Vercel"
echo ""

# Run vercel deploy
vercel --prod

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT INITIATED! 🎉${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. 🔧 Add environment variables in Vercel dashboard:"
echo "   - NEXT_PUBLIC_SUPABASE_URL=https://kdvonfeevlfhwpnvyntm.supabase.co"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>"
echo "   - SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>"
echo ""
echo "2. 🌐 Your app will be available at the URL provided by Vercel"
echo ""
echo "3. 🔄 If you need to redeploy after adding env vars:"
echo "   vercel --prod"
echo ""
echo -e "${YELLOW}💡 Pro Tip:${NC} Keep your local development environment running"
echo "until you've verified the production deployment works perfectly!"
echo ""
echo -e "${GREEN}✅ Your Lance application is being deployed to Vercel!${NC}"
