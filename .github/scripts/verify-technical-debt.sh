#!/bin/bash
set -e

# CI Script: Verify Technical Debt Claims
# 
# This script prevents false "missing method" claims by checking if methods
# actually exist in TypeScript ports/adapters before they're documented as technical debt.
#
# Usage: ./verify-technical-debt.sh [pr_files...]
# Exit codes:
#   0 - No issues found
#   1 - Found methods claimed as "missing" that actually exist

echo "🔍 Verifying technical debt claims in PR..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
FALSE_CLAIMS=0
VERIFIED_CLAIMS=0
WARNINGS=0

# Get list of changed files (or use provided args)
if [ $# -eq 0 ]; then
  # In GitHub Actions, get changed files
  if [ -n "$GITHUB_BASE_REF" ]; then
    CHANGED_FILES=$(git diff --name-only origin/$GITHUB_BASE_REF...HEAD)
  else
    # Local testing - get uncommitted changes
    CHANGED_FILES=$(git diff --name-only HEAD)
  fi
else
  CHANGED_FILES="$@"
fi

echo "📄 Analyzing changed files..."

# Pattern 1: Check for "TECHNICAL DEBT" comments with method names
echo ""
echo "Pattern 1: Checking for false 'TECHNICAL DEBT' claims in code..."

for file in $CHANGED_FILES; do
  if [[ ! -f "$file" ]]; then
    continue
  fi
  
  # Only check TypeScript files
  if [[ "$file" =~ \.(ts|tsx)$ ]]; then
    # Search for TECHNICAL DEBT comments with "Missing" claims
    while IFS= read -r line; do
      if [[ -n "$line" ]]; then
        LINE_NUM=$(echo "$line" | cut -d: -f1)
        CONTENT=$(echo "$line" | cut -d: -f2-)
        
        # Extract method names from patterns like "Missing: methodName()" or "Missing Go backend methods: methodName"
        if [[ "$CONTENT" =~ [Mm]issing.*(method|endpoint|port|adapter) ]]; then
          # Extract potential method names (words followed by () or in context)
          METHODS=$(echo "$CONTENT" | grep -oE '\b[a-zA-Z_][a-zA-Z0-9_]*\(' | sed 's/(//')
          
          for method in $METHODS; do
            if [[ -n "$method" && "$method" != "method" && "$method" != "endpoint" ]]; then
              echo ""
              echo "🔎 Found 'missing' claim in $file:$LINE_NUM for method: $method"
              
              # Check TypeScript ports
              PORT_MATCH=$(grep -r "readonly $method" packages/application/src/ports/ 2>/dev/null || true)
              if [[ -n "$PORT_MATCH" ]]; then
                echo -e "${RED}❌ FALSE CLAIM:${NC} Method '$method' EXISTS in TypeScript port!"
                echo "   Found: $PORT_MATCH"
                ((FALSE_CLAIMS++))
              fi
              
              # Check TypeScript adapters
              ADAPTER_MATCH=$(grep -r "$method:" packages/infrastructure/src/adapters/go-backend/ 2>/dev/null || true)
              if [[ -n "$ADAPTER_MATCH" ]]; then
                echo -e "${RED}❌ FALSE CLAIM:${NC} Method '$method' EXISTS in TypeScript adapter!"
                echo "   Found: $ADAPTER_MATCH"
                ((FALSE_CLAIMS++))
              fi
              
              if [[ -z "$PORT_MATCH" && -z "$ADAPTER_MATCH" ]]; then
                echo -e "${GREEN}✅ VERIFIED:${NC} Method '$method' not found in ports/adapters"
                ((VERIFIED_CLAIMS++))
              fi
            fi
          done
        fi
      fi
    done < <(grep -n "TECHNICAL DEBT" "$file" 2>/dev/null || true)
  fi
done

# Pattern 2: Check documentation files for "missing method" claims
echo ""
echo "Pattern 2: Checking documentation for false 'missing method' claims..."

for file in $CHANGED_FILES; do
  if [[ ! -f "$file" ]]; then
    continue
  fi
  
  # Only check markdown files in docs/
  if [[ "$file" =~ ^docs/.*\.md$ ]]; then
    # Search for "missing" or "does not exist" claims about methods
    while IFS= read -r line; do
      if [[ -n "$line" ]]; then
        LINE_NUM=$(echo "$line" | cut -d: -f1)
        CONTENT=$(echo "$line" | cut -d: -f2-)
        
        # Extract method names from claims
        METHODS=$(echo "$CONTENT" | grep -oE '\b[a-zA-Z_][a-zA-Z0-9_]*\(' | sed 's/(//')
        
        for method in $METHODS; do
          if [[ -n "$method" ]]; then
            echo ""
            echo "🔎 Found 'missing' claim in $file:$LINE_NUM for method: $method"
            
            # Check TypeScript ports
            PORT_MATCH=$(grep -r "readonly $method" packages/application/src/ports/ 2>/dev/null || true)
            if [[ -n "$PORT_MATCH" ]]; then
              echo -e "${RED}❌ FALSE CLAIM:${NC} Method '$method' EXISTS in TypeScript port!"
              echo "   Found in: $(echo "$PORT_MATCH" | head -1 | cut -d: -f1)"
              ((FALSE_CLAIMS++))
            fi
            
            # Check TypeScript adapters
            ADAPTER_MATCH=$(grep -r "$method:" packages/infrastructure/src/adapters/go-backend/ 2>/dev/null || true)
            if [[ -n "$ADAPTER_MATCH" ]]; then
              echo -e "${RED}❌ FALSE CLAIM:${NC} Method '$method' EXISTS in TypeScript adapter!"
              echo "   Found in: $(echo "$ADAPTER_MATCH" | head -1 | cut -d: -f1)"
              ((FALSE_CLAIMS++))
            fi
            
            if [[ -z "$PORT_MATCH" && -z "$ADAPTER_MATCH" ]]; then
              echo -e "${GREEN}✅ VERIFIED:${NC} Method '$method' not found in ports/adapters"
              ((VERIFIED_CLAIMS++))
            fi
          fi
        done
      fi
    done < <(grep -niE "(missing|does not exist|not implemented).*method" "$file" 2>/dev/null || true)
  fi
done

# Pattern 3: Check for simplified implementations without verification
echo ""
echo "Pattern 3: Checking for simplified implementations..."

for file in $CHANGED_FILES; do
  if [[ ! -f "$file" ]]; then
    continue
  fi
  
  # Only check TypeScript use case files
  if [[ "$file" =~ use-cases/.*\.(ts|tsx)$ && ! "$file" =~ __tests__ ]]; then
    # Check for simplified implementations
    SIMPLIFIED=$(grep -n "Simplified implementation\|simplified:" "$file" 2>/dev/null || true)
    if [[ -n "$SIMPLIFIED" ]]; then
      echo ""
      echo -e "${YELLOW}⚠️  WARNING:${NC} Found 'simplified implementation' in $file"
      echo "$SIMPLIFIED"
      echo "   → Did you verify the full implementation doesn't already exist?"
      echo "   → Run: docs/VERIFICATION_QUICK_REFERENCE.md checklist"
      ((WARNINGS++))
    fi
  fi
done

# Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo "📊 Verification Summary"
echo "═══════════════════════════════════════════════════════"
echo -e "${RED}❌ False claims found: $FALSE_CLAIMS${NC}"
echo -e "${GREEN}✅ Verified claims: $VERIFIED_CLAIMS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

# Exit with error if false claims found
if [ $FALSE_CLAIMS -gt 0 ]; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ VERIFICATION FAILED!${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Found $FALSE_CLAIMS method(s) claimed as 'missing' that actually exist!"
  echo ""
  echo "Action required:"
  echo "1. Remove the false 'TECHNICAL DEBT' comments"
  echo "2. Use the existing port/adapter methods instead of placeholders"
  echo "3. Re-run: ./github/scripts/verify-technical-debt.sh"
  echo ""
  echo "Reference: docs/PRE_IMPLEMENTATION_CHECKLIST.md"
  echo ""
  exit 1
fi

if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $WARNINGS warning(s) - please review${NC}"
  echo ""
  echo "Simplified implementations detected. Before merging:"
  echo "1. Run the 4 verification commands from docs/VERIFICATION_QUICK_REFERENCE.md"
  echo "2. Confirm the full implementation doesn't already exist"
  echo "3. Update the PR description with verification results"
  echo ""
  echo "Continuing (warnings don't block PR)..."
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Verification passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

exit 0
