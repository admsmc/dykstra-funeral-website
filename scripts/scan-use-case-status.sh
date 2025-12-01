#!/bin/bash
# scan-use-case-status.sh
# Auto-generate use case refactoring status report from JSDoc headers
# Usage: ./scripts/scan-use-case-status.sh [> output.md]

set -euo pipefail

ROOT="packages/application/src/use-cases"
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# Verify root exists
if [ ! -d "$ROOT" ]; then
  echo "Error: $ROOT not found" >&2
  exit 1
fi

# Header
echo "# Use Case Refactoring Status"
echo
echo "Generated: $(date -u +%Y-%m-%d' at '%H:%M:%S' UTC')"
echo
echo "---"
echo

# Collect all use case metadata
{
  find "$ROOT" -type f -name "*.ts" ! -path "*/__tests__/*" ! -path "*/index.ts" | while read -r file; do
    # Extract JSDoc metadata (handle emojis and special characters by grepping for known values)
    policy_type=$(grep "Policy Type:" "$file" | head -1 | grep -oE 'Type [ABC]|N/A' | head -1)
    status=$(grep "Refactoring Status:" "$file" | head -1 | grep -oE 'HARDCODED|IN PROGRESS|CONFIGURABLE' | head -1)
    policy_entity=$(grep "Policy Entity:" "$file" | head -1 | sed 's/.*Policy Entity: \([^ ]*\).*/\1/' | xargs)
    persisted=$(grep "Persisted In:" "$file" | head -1 | sed 's/.*Persisted In: \(.*\)/\1/' | sed 's/ *$//' | xargs)
    backend=$(grep "Go Backend:" "$file" | head -1 | grep -oE 'YES|NO' | head -1)
    per_home=$(grep "Per-Funeral-Home:" "$file" | head -1 | grep -oE 'YES|NO' | head -1)
    tests=$(grep "Test Coverage:" "$file" | head -1 | sed 's/.*Test Coverage: \([^ ]*\).*/\1/' | xargs)
    updated=$(grep "Last Updated:" "$file" | head -1 | sed 's/.*Last Updated: \([^ ]*\).*/\1/' | xargs)
    
    # Default values if not found
    policy_type="${policy_type:-N/A}"
    status="${status:-UNKNOWN}"
    policy_entity="${policy_entity:-N/A}"
    persisted="${persisted:-N/A}"
    backend="${backend:-UNKNOWN}"
    per_home="${per_home:-UNKNOWN}"
    tests="${tests:-0}"
    updated="${updated:-N/A}"
    
    # Extract domain from path (e.g., use-cases/scheduling -> scheduling)
    domain=$(echo "$file" | sed 's|.*use-cases/\([^/]*\).*|\1|')
    
    # Use case name (filename without .ts)
    use_case=$(basename "$file" .ts)
    
    # Emoji status
    case "$status" in
      CONFIGURABLE) status_emoji="✅ CONFIGURABLE" ;;
      IN\ PROGRESS) status_emoji="🟡 IN PROGRESS" ;;
      HARDCODED) status_emoji="🔴 HARDCODED" ;;
      *) status_emoji="❓ UNKNOWN" ;;
    esac
    
    # Output tab-separated for easy sorting/grouping
    echo -e "$domain\t$use_case\t$policy_type\t$status\t$status_emoji\t$policy_entity\t$backend\t$per_home\t$tests\t$updated"
  done
} | sort > "$TEMP_FILE"

# Calculate summary stats
total=$(wc -l < "$TEMP_FILE")
configurable=$(grep -c "CONFIGURABLE" "$TEMP_FILE" || true)
in_progress=$(grep -c "IN PROGRESS" "$TEMP_FILE" || true)
hardcoded=$(grep -c "HARDCODED" "$TEMP_FILE" || true)
unknown=$(grep -c "UNKNOWN" "$TEMP_FILE" || true)

# Percentages
if [ "$total" -gt 0 ]; then
  pct_configurable=$((configurable * 100 / total))
  pct_in_progress=$((in_progress * 100 / total))
  pct_hardcoded=$((hardcoded * 100 / total))
else
  pct_configurable=0
  pct_in_progress=0
  pct_hardcoded=0
fi

# Summary section
echo "## Summary"
echo
echo "| Status | Count | Percentage |"
echo "|--------|-------|------------|"
echo "| ✅ CONFIGURABLE | $configurable | $pct_configurable% |"
echo "| 🟡 IN PROGRESS | $in_progress | $pct_in_progress% |"
echo "| 🔴 HARDCODED | $hardcoded | $pct_hardcoded% |"
echo "| ❓ UNKNOWN/UNTAGGED | $unknown | $((unknown * 100 / total))% |"
echo "| **TOTAL** | **$total** | **100%** |"
echo
echo "---"
echo

# By Domain
echo "## By Domain"
echo
current_domain=""

while IFS=$'\t' read -r domain use_case policy_type status status_emoji policy_entity backend per_home tests updated; do
  if [ "$domain" != "$current_domain" ]; then
    if [ -n "$current_domain" ]; then
      echo
    fi
    current_domain="$domain"
    
    # Count in this domain
    domain_total=$(grep "^$domain" "$TEMP_FILE" | wc -l)
    domain_config=$(grep "^$domain" "$TEMP_FILE" | grep -c "CONFIGURABLE" || true)
    domain_in_prog=$(grep "^$domain" "$TEMP_FILE" | grep -c "IN PROGRESS" || true)
    domain_hard=$(grep "^$domain" "$TEMP_FILE" | grep -c "HARDCODED" || true)
    
    if [ "$domain_total" -gt 0 ]; then
      domain_pct=$((domain_config * 100 / domain_total))
    else
      domain_pct=0
    fi
    
    echo "### $domain ($domain_total use cases - $domain_pct% complete)"
    echo
    echo "| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |"
    echo "|----------|------|--------|-------|---------------|---------|----------|---------|"
  fi
  
  # Extract test count (handle "28 tests" format)
  test_count=$(echo "$tests" | grep -oE '^[0-9]+' || echo "0")
  
  echo "| $use_case | $policy_type | $status_emoji | $test_count | $policy_entity | $backend | $per_home | $updated |"
done < "$TEMP_FILE"

echo
echo "---"
echo
echo "## Notes"
echo
echo "- Generated from JSDoc headers in use case files"
echo "- Run this script before each release to track progress"
echo "- Update JSDoc headers when refactoring status changes"
echo "- Use: \`./scripts/scan-use-case-status.sh > docs/USE_CASE_STATUS.md\` to save report"
echo
