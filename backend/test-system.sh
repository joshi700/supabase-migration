#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Real Estate Portal - System Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Check if backend .env file exists
echo "📝 Checking backend configuration..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅ Backend .env file found${NC}"
    
    # Check if required variables are set
    if grep -q "SUPABASE_URL=" backend/.env && grep -q "JWT_SECRET=" backend/.env; then
        echo -e "${GREEN}✅ Required environment variables present${NC}"
    else
        echo -e "${RED}❌ Missing required environment variables${NC}"
    fi
else
    echo -e "${RED}❌ Backend .env file not found${NC}"
fi
echo ""

# Test 2: Check if backend is running
echo "🚀 Checking backend server..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ Backend server is running on port 3001${NC}"
    
    # Get health details
    health=$(curl -s http://localhost:3001/health 2>/dev/null)
    echo "   $health"
else
    echo -e "${RED}❌ Backend server is not running${NC}"
    echo -e "${YELLOW}   Start it with: cd backend && npm start${NC}"
fi
echo ""

# Test 3: Check if frontend is running
echo "🌐 Checking frontend server..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$response" = "200" ] || [ "$response" = "304" ]; then
    echo -e "${GREEN}✅ Frontend server is running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend server is not running${NC}"
    echo -e "${YELLOW}   Start it with: cd frontend && npm start${NC}"
fi
echo ""

# Test 4: Check if we can login
echo "🔐 Testing authentication..."
login_response=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@realestate.com","password":"admin123"}' 2>/dev/null)

if echo "$login_response" | grep -q "token"; then
    echo -e "${GREEN}✅ Authentication working${NC}"
    echo "   Successfully logged in as admin@realestate.com"
else
    echo -e "${RED}❌ Authentication failed${NC}"
    echo -e "${YELLOW}   Run seed script: cd backend && npm run seed${NC}"
fi
echo ""

# Test 5: Check if leads exist
echo "📋 Checking leads in database..."
if echo "$login_response" | grep -q "token"; then
    token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    leads_response=$(curl -s -H "Authorization: Bearer $token" http://localhost:3001/api/leads 2>/dev/null)
    
    if echo "$leads_response" | grep -q "lead_id"; then
        lead_count=$(echo "$leads_response" | grep -o '"lead_id"' | wc -l)
        echo -e "${GREEN}✅ Found $lead_count leads in database${NC}"
    else
        echo -e "${YELLOW}⚠️  No leads found in database${NC}"
        echo -e "${YELLOW}   Run seed script: cd backend && npm run seed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot check leads (authentication required)${NC}"
fi
echo ""

# Test 6: Check iOS app configuration
echo "📱 Checking iOS app configuration..."
if [ -f "ios-app/RealEstateBroker/Utils/Configuration.swift" ]; then
    echo -e "${GREEN}✅ iOS Configuration.swift found${NC}"
    
    # Check if using localhost (only works in simulator)
    if grep -q "localhost:3001" ios-app/RealEstateBroker/Utils/Configuration.swift; then
        echo -e "${YELLOW}   ⚠️  Using localhost (simulator only)${NC}"
        echo "   For physical device, update to your IP address"
        echo "   Find your IP: ipconfig getifaddr en0"
    else
        echo -e "${GREEN}   ✅ Configured for network access${NC}"
    fi
else
    echo -e "${RED}❌ iOS Configuration.swift not found${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$response" = "200" ] && echo "$login_response" | grep -q "token"; then
    echo -e "${GREEN}✅ System is ready!${NC}"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Open web portal: http://localhost:3000"
    echo "   2. Login with: admin@realestate.com / admin123"
    echo "   3. Open iOS app in Xcode and run"
    echo "   4. Login with: broker1@realestate.com / broker123"
else
    echo -e "${YELLOW}⚠️  System needs setup${NC}"
    echo ""
    echo "🔧 Required actions:"
    
    if [ ! "$response" = "200" ]; then
        echo "   1. Start backend: cd backend && npm start"
    fi
    
    if ! echo "$login_response" | grep -q "token"; then
        echo "   2. Seed database: cd backend && npm run seed"
    fi
    
    if [ ! "$response" = "200" ] || [ ! "$response" = "304" ]; then
        echo "   3. Start frontend: cd frontend && npm start"
    fi
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"