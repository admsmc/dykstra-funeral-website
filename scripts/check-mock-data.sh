#!/bin/bash
# Mock Data Detection Report
# Generates a summary of mock data usage across the codebase

set -e

echo "======================================"
echo "Mock Data Detection Report"
echo "======================================"
echo ""
echo "Generated: $(date)"
echo ""

# Check if ESLint is available
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm not found"
    exit 1
fi

echo "Running ESLint with mock data rules..."
echo ""

# Run ESLint and capture output
LINT_OUTPUT=$(pnpm lint --format json 2>/dev/null || true)

# Parse results for mock data rules
MOCK_IN_PAGES=$(echo "$LINT_OUTPUT" | jq '[.[] | .messages[] | select(.ruleId == "local/no-mock-data-in-pages")] | length' 2>/dev/null || echo "0")
MOCK_IN_ROUTERS=$(echo "$LINT_OUTPUT" | jq '[.[] | .messages[] | select(.ruleId == "local/no-mock-data-in-routers")] | length' 2>/dev/null || echo "0")
REQUIRE_API=$(echo "$LINT_OUTPUT" | jq '[.[] | .messages[] | select(.ruleId == "local/require-api-usage-in-pages")] | length' 2>/dev/null || echo "0")

# Total issues
TOTAL_ISSUES=$((MOCK_IN_PAGES + MOCK_IN_ROUTERS + REQUIRE_API))

echo "======================================"
echo "Summary"
echo "======================================"
echo ""
echo "📊 Total Issues: $TOTAL_ISSUES"
echo ""
echo "⛔ Page Mock Data Errors: $MOCK_IN_PAGES"
echo "   (Hardcoded arrays in pages/components)"
echo ""
echo "⚠️  Router Mock Data Warnings: $MOCK_IN_ROUTERS"
echo "   (Mock data in tRPC routers - acceptable during dev)"
echo ""
echo "⚠️  Missing API Usage Warnings: $REQUIRE_API"
echo "   (Pages with mock data but no API calls)"
echo ""

# Status indicator
if [ "$MOCK_IN_PAGES" -eq 0 ] && [ "$REQUIRE_API" -eq 0 ]; then
    echo "✅ Status: PRODUCTION READY"
    echo "   All pages properly use backend APIs"
else
    echo "⚠️  Status: NEEDS ATTENTION"
    echo "   Some pages still use hardcoded mock data"
fi

echo ""
echo "======================================"
echo "Detailed Results"
echo "======================================"
echo ""

# Show detailed results for page mock data (critical)
if [ "$MOCK_IN_PAGES" -gt 0 ]; then
    echo "❌ CRITICAL: Pages with Mock Data"
    echo ""
    echo "$LINT_OUTPUT" | jq -r '.[] | select(.messages[].ruleId == "local/no-mock-data-in-pages") | .filePath' 2>/dev/null | sort -u | while read -r file; do
        echo "  - $file"
    done
    echo ""
fi

# Show detailed results for missing API usage (warning)
if [ "$REQUIRE_API" -gt 0 ]; then
    echo "⚠️  WARNING: Pages Missing API Calls"
    echo ""
    echo "$LINT_OUTPUT" | jq -r '.[] | select(.messages[].ruleId == "local/require-api-usage-in-pages") | .filePath' 2>/dev/null | sort -u | while read -r file; do
        echo "  - $file"
    done
    echo ""
fi

# Show summary of router mock data (informational)
if [ "$MOCK_IN_ROUTERS" -gt 0 ]; then
    echo "ℹ️  INFO: Routers with Mock Data (development acceptable)"
    echo ""
    
    # Count by file
    ROUTER_FILES=$(echo "$LINT_OUTPUT" | jq -r '.[] | select(.messages[].ruleId == "local/no-mock-data-in-routers") | .filePath' 2>/dev/null | sort -u | wc -l)
    echo "  Total router files: $ROUTER_FILES"
    echo "  Total mock endpoints: $MOCK_IN_ROUTERS"
    echo ""
    
    # Top 5 routers with most mock data
    echo "  Top routers with mock data:"
    echo "$LINT_OUTPUT" | jq -r '.[] | select(.messages[].ruleId == "local/no-mock-data-in-routers") | .filePath' 2>/dev/null | sort | uniq -c | sort -rn | head -5 | while read -r count file; do
        filename=$(basename "$file")
        echo "    - $filename ($count endpoints)"
    done
    echo ""
fi

echo "======================================"
echo "Recommendations"
echo "======================================"
echo ""

if [ "$MOCK_IN_PAGES" -gt 0 ]; then
    echo "1. ❌ Fix page mock data IMMEDIATELY (blocks production)"
    echo "   Replace hardcoded arrays with tRPC API calls"
    echo ""
fi

if [ "$REQUIRE_API" -gt 0 ]; then
    echo "2. ⚠️  Wire pages to backend APIs"
    echo "   Add api.*.useQuery() calls to fetch real data"
    echo ""
fi

if [ "$MOCK_IN_ROUTERS" -gt 0 ]; then
    echo "3. ℹ️  Migrate router mock data (medium priority)"
    echo "   Replace // Mock comments with Prisma queries"
    echo "   This is acceptable during development"
    echo ""
fi

echo "======================================"
echo "Next Steps"
echo "======================================"
echo ""
echo "Run full lint:  pnpm lint"
echo "Fix auto-fix:   pnpm lint --fix"
echo "Check file:     pnpm lint <file-path>"
echo ""
echo "Documentation:  docs/ESLINT_MOCK_DATA_RULES.md"
echo ""

# Exit code based on critical issues only
if [ "$MOCK_IN_PAGES" -gt 0 ]; then
    exit 1
else
    exit 0
fi
