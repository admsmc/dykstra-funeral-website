#!/bin/bash

# Go Backend Integration Test Script
# Tests the Phase 1-4 endpoints to verify integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GO_BACKEND_URL="${GO_BACKEND_URL:-http://localhost:8080}"
NEXTJS_URL="${NEXTJS_URL:-http://localhost:3000}"

echo "================================================"
echo "Go Backend Integration Test"
echo "================================================"
echo ""

# Function to check if a service is running
check_service() {
    local url=$1
    local name=$2
    
    if curl -s -f -o /dev/null "$url/health" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $name is running at $url"
        return 0
    else
        echo -e "${RED}✗${NC} $name is NOT running at $url"
        return 1
    fi
}

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local path=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}Testing:${NC} $description"
    echo "  $method $path"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$GO_BACKEND_URL$path" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$GO_BACKEND_URL$path" 2>/dev/null || echo "000")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "  ${GREEN}✓${NC} Success (HTTP $http_code)"
        echo "  Response: $(echo "$body" | head -c 100)..."
        return 0
    else
        echo -e "  ${RED}✗${NC} Failed (HTTP $http_code)"
        echo "  Response: $body"
        return 1
    fi
}

# Check services
echo "Step 1: Checking services..."
echo "------------------------------"

go_backend_running=false
if check_service "$GO_BACKEND_URL" "Go Backend"; then
    go_backend_running=true
fi

nextjs_running=false
if check_service "$NEXTJS_URL" "Next.js"; then
    nextjs_running=true
fi

if [ "$go_backend_running" = false ]; then
    echo ""
    echo -e "${RED}ERROR:${NC} Go backend is not running!"
    echo "Start it with:"
    echo "  cd /Users/andrewmathers/tigerbeetle-trial-app-1"
    echo "  go run cmd/api/main.go"
    exit 1
fi

# Test Phase 1: Financial Endpoints
echo ""
echo "Step 2: Testing Phase 1 - Financial Endpoints"
echo "----------------------------------------------"

test_endpoint "GET" "/v1/gl/trial-balance?book=MAIN&period=2025-11&currency=USD" "" \
    "Trial Balance"

test_endpoint "GET" "/v1/gl/statements/balance-sheet?book=MAIN&entity_id=ENTITY1&period=2025-11&currency=USD" "" \
    "Balance Sheet"

test_endpoint "GET" "/v1/gl/statements/cash-flow?book=MAIN&entity_id=ENTITY1&period_from=2025-11&period_to=2025-11&currency=USD" "" \
    "Cash Flow Statement"

test_endpoint "POST" "/accounts/balances" \
    '{"accounts":["test_account_1","test_account_2"]}' \
    "Account Balances"

test_endpoint "POST" "/ap/payment-runs" \
    '{"tenant":"T1","legal_entity":"LE1","currency":"USD"}' \
    "Create AP Payment Run"

# Test Phase 2: Timesheet Workflow
echo ""
echo "Step 3: Testing Phase 2 - Timesheet Workflow"
echo "---------------------------------------------"

TIMESHEET_ID="TS_TEST_$(date +%s)"

test_endpoint "POST" "/ps/timesheets/submit" \
    "{\"tenant\":\"T1\",\"timesheet_id\":\"$TIMESHEET_ID\",\"worker_id\":\"WORKER001\",\"period_start\":\"2025-11-01T00:00:00Z\",\"period_end\":\"2025-11-07T23:59:59Z\",\"entries\":[\"e1\",\"e2\"]}" \
    "Submit Timesheet"

test_endpoint "GET" "/ps/timesheets?tenant=T1&limit=10" "" \
    "List Timesheets"

# Summary
echo ""
echo "================================================"
echo "Integration Test Summary"
echo "================================================"
echo ""
echo -e "${GREEN}✓${NC} Phase 1: Financial endpoints tested"
echo -e "${GREEN}✓${NC} Phase 2: Timesheet workflow tested"
echo ""
echo "Next steps:"
echo "1. Check that all tests passed"
echo "2. Run integration test suite:"
echo "   cd packages/infrastructure"
echo "   npm test"
echo "3. Review the integration guide:"
echo "   docs/GO_BACKEND_INTEGRATION_GUIDE.md"
echo ""
