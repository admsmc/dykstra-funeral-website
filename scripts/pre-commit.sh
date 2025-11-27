#!/bin/bash
# Pre-commit validation script
# Run this before committing to catch common issues

set -e

echo "🔍 Running pre-commit checks..."

# Environment variables
echo "🌍 Environment variable check..."
node scripts/check-env.js

# Prisma schema validation
echo "🗄️  Validating Prisma schema..."
# Note: Prisma 7 no longer requires url in datasource block (moved to prisma.config.ts)
# Skip 'prisma validate' as it's deprecated in Prisma 7
cd packages/infrastructure && prisma format --check
cd ../..

# TypeScript compilation
echo "📘 TypeScript compilation check..."
pnpm -r type-check

# ESLint
echo "🔧 ESLint check..."
pnpm lint

# Circular dependency check (infrastructure layer specifically)
echo "🔄 Checking for circular dependencies..."
npx madge --circular --extensions ts,tsx packages/infrastructure/src packages/application/src packages/api/src

# Effect Layer validation (custom check)
echo "🏗️  Validating Effect Layers..."
# Check for await import in Layer definitions
if grep -r "await import" packages/infrastructure/src packages/application/src | grep "Layer.succeed\|Layer.effect" | grep -v "//.*await import"; then
  echo "❌ Error: Found 'await import()' in Layer definitions!"
  echo "   This causes dependency injection failures at runtime."
  echo "   Use regular import statements instead."
  exit 1
fi

# Check for interface/tag naming conflicts (StoragePort pattern)
echo "🏷️  Checking for interface/tag naming conflicts..."
if grep -E "export (interface|type) (\w+Port)" packages/application/src/ports/*.ts | \
   awk '{print $3}' | \
   while read iface; do
     if grep -q "export const $iface = Context" packages/application/src/ports/*.ts; then
       echo "❌ Warning: Interface '$iface' has same name as Context tag"
       echo "   This can cause circular type references. Use 'Service' suffix for interface."
     fi
   done
then
  :
fi

# Dependency Injection validation
echo "💉 Validating dependency injection..."
npx tsx scripts/validate-di.ts

# Prisma Type Safety validation
echo "🔒 Validating Prisma type safety..."
npx tsx scripts/validate-prisma-types.ts

echo "✅ All pre-commit checks passed!"
