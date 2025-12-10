#!/bin/bash

# Setup script for integration test environment
# Ensures all required services are running before tests execute

set -e

echo "🧪 Setting up integration test environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Start DynamoDB Local if not already running
if ! docker ps | grep -q dynamodb-local; then
    echo -e "${YELLOW}Starting DynamoDB Local...${NC}"
    npm run dynamodb:start
    sleep 3
else
    echo -e "${GREEN}✓ DynamoDB Local is already running${NC}"
fi

# Setup DynamoDB tables
echo -e "${YELLOW}Setting up DynamoDB tables...${NC}"
npm run dynamodb:setup
echo -e "${GREEN}✓ DynamoDB tables created${NC}"

# Check if backend is running
if ! curl -s http://localhost:3000/api/config > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend is not running. Please start it with: npm run dev:backend${NC}"
    echo -e "${YELLOW}   Or run in a separate terminal before running tests.${NC}"
else
    echo -e "${GREEN}✓ Backend is running${NC}"
fi

# Check if frontend is running
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend is not running. Please start it with: npm run dev:frontend${NC}"
    echo -e "${YELLOW}   Or run in a separate terminal before running tests.${NC}"
else
    echo -e "${GREEN}✓ Frontend is running${NC}"
fi

echo ""
echo -e "${GREEN}✅ Test environment setup complete!${NC}"
echo ""
echo "To run integration tests:"
echo "  npm run test:integration"
echo ""
echo "To run tests with UI:"
echo "  npm run test:integration:ui"
echo ""
