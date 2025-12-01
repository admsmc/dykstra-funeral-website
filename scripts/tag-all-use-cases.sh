#!/bin/bash
# tag-all-use-cases.sh
# Auto-tag all use cases with JSDoc headers based on domain and patterns

set -euo pipefail

ROOT="packages/application/src/use-cases"
TAGGED=0
SKIPPED=0

# Helper function to detect policy type and status
detect_policy_type() {
  local domain="$1"
  local name="$2"
  local file="$3"
  
  # Extract first few lines of the file to check for hardcoded values
  local has_hardcoded=$(head -100 "$file" | grep -cE "(const|=)\s+[0-9]{1,3}|hardcoded|// typically|// usually" || true)
  
  # Type detection by domain
  case "$domain" in
    scheduling)
      echo "Type B,IN PROGRESS,ShiftPolicy,N/A"  # Most scheduling is local config + Go execution
      ;;
    payroll)
      echo "Type B,HARDCODED,N/A,N/A"  # Complex payroll rules
      ;;
    financial)
      if [[ "$name" =~ "process-case-payment|refund|batch-payment" ]]; then
        echo "Type A,HARDCODED,N/A,N/A"
      else
        echo "Type B,HARDCODED,N/A,N/A"
      fi
      ;;
    inventory)
      echo "Type B,HARDCODED,N/A,N/A"
      ;;
    procurement)
      echo "Type B,HARDCODED,N/A,N/A"
      ;;
    contacts|leads|interactions|notes|invitations|campaigns)
      echo "Type A,HARDCODED,N/A,N/A"  # CRM operations, local only
      ;;
    pre-planning|prep-room)
      echo "Type B,HARDCODED,N/A,N/A"  # Could have Go integration
      ;;
    contracts|contract)
      echo "Type C,HARDCODED,N/A,N/A"  # Go-owned
      ;;
    *)
      echo "N/A,HARDCODED,N/A,N/A"
      ;;
  esac
}

# Generate JSDoc header
generate_jsdoc() {
  local policy_type="$1"
  local status="$2"
  local entity="$3"
  local backend="$4"
  local domain="$5"
  local name="$6"
  
  # Determine Backend YES/NO
  local go_backend="NO"
  if [[ "$policy_type" == "Type B" ]] || [[ "$policy_type" == "Type C" ]]; then
    go_backend="YES"
  fi
  
  # Determine Per-Funeral-Home (most funeral home operations are per-home)
  local per_home="YES"
  if [[ "$domain" =~ "email|calendar|user|staff" ]]; then
    per_home="NO"  # These are not per-funeral-home
  fi
  
  # Count existing tests
  local test_count=$(grep -c "it(" "${file/__tests__/__.ts}" 2>/dev/null || echo "0")
  if [ "$test_count" -eq 0 ]; then
    test_count="0 tests"
  else
    test_count="$test_count tests"
  fi
  
  cat <<EOF
/**
 * $(echo "$name" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
 *
 * Policy Type: $policy_type
 * Refactoring Status: 🔴 $status
 * Policy Entity: $entity
 * Persisted In: $backend
 * Go Backend: $go_backend
 * Per-Funeral-Home: $per_home
 * Test Coverage: $test_count
 * Last Updated: N/A
 */
EOF
}

# Process each use case file
while IFS= read -r file; do
  # Skip if already has JSDoc header with our fields
  if grep -q "Policy Type:" "$file"; then
    echo "⏭️  Already tagged: $(basename "$file")"
    SKIPPED=$((SKIPPED+1))
    continue
  fi
  
  filename=$(basename "$file" .ts)
  domain=$(echo "$file" | sed 's|.*use-cases/\([^/]*\).*|\1|')
  
  # Read the existing first line(s) to understand current structure
  first_line=$(head -1 "$file")
  
  # If file starts with export, we need to insert before it
  if [[ "$first_line" =~ ^export ]]; then
    policy_info=$(detect_policy_type "$domain" "$filename" "$file")
    IFS=',' read -r policy_type status entity backend <<< "$policy_info"
    
    # Generate header
    header=$(generate_jsdoc "$policy_type" "$status" "$entity" "$backend" "$domain" "$filename")
    
    # Create temp file with header + original content
    {
      echo "$header"
      echo
      cat "$file"
    } > "$file.tmp"
    
    mv "$file.tmp" "$file"
    echo "✅ Tagged: $(basename "$file") [$policy_type, $status]"
    TAGGED=$((TAGGED+1))
  else
    echo "⚠️  Skipped (unknown structure): $(basename "$file")"
    SKIPPED=$((SKIPPED+1))
  fi
  
done < <(find "$ROOT" -type f -name "*.ts" ! -path "*/__tests__/*" ! -path "*/index.ts" | sort)

echo
echo "---"
echo "✅ Tagged: $TAGGED"
echo "⏭️  Skipped: $SKIPPED"
echo "Total: $((TAGGED + SKIPPED))"
