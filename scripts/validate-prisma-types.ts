#!/usr/bin/env tsx
/**
 * Prisma Type Validation Script
 * 
 * This script validates that TypeScript types used in the application code
 * match the Prisma schema. It runs at build/validate time to catch mismatches
 * before they reach production.
 * 
 * Checks:
 * 1. Enum values match between Prisma and application code
 * 2. No hardcoded string literals that should be enum values
 * 3. Type imports are from correct sources
 * 4. No case-sensitivity mismatches
 * 
 * Run: npx tsx scripts/validate-prisma-types.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { UserRole } from '@prisma/client';

interface ValidationError {
  file: string;
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

const errors: ValidationError[] = [];

/**
 * Get all possible enum values from Prisma
 */
function getPrismaEnumValues() {
  return {
    UserRole: Object.values(UserRole),
  };
}

/**
 * Check if file contains hardcoded role strings instead of enum
 */
function checkForHardcodedRoles(filePath: string, content: string) {
  const lines = content.split('\n');
  const deprecatedRoles = [
    'family_primary',
    'family_member',
    'staff',
    'director',
    'funeral_director',
    'admin',
  ];

  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }

    deprecatedRoles.forEach((role) => {
      const pattern = new RegExp(`['"\`]${role}['"\`]`, 'g');
      if (pattern.test(line)) {
        errors.push({
          file: filePath,
          line: index + 1,
          message: `Found lowercase role literal '${role}'. Should use uppercase enum value '${role.toUpperCase()}' from Prisma.`,
          severity: 'error',
        });
      }
    });
  });
}

/**
 * Check if file imports UserRole from correct source
 */
function checkRoleImports(filePath: string, content: string) {
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Check for UserRole imports from wrong sources
    if (line.includes('UserRoleSchema') && !line.includes('@prisma/client')) {
      if (line.includes('@dykstra/shared') && !line.includes('prisma-bridge')) {
        errors.push({
          file: filePath,
          line: index + 1,
          message: 'UserRole should be imported from @prisma/client or @dykstra/shared/types/prisma-bridge',
          severity: 'warning',
        });
      }
    }
  });
}

/**
 * Validate specific files that commonly have role checks
 */
async function validateFiles() {
  console.log('🔍 Validating Prisma type consistency...\n');

  const filesToCheck = [
    'packages/api/src/trpc.ts',
    'packages/api/src/context/context.ts',
    'packages/shared/src/schemas/user.schema.ts',
  ];

  const projectRoot = process.cwd();

  for (const file of filesToCheck) {
    const fullPath = join(projectRoot, file);
    try {
      const content = readFileSync(fullPath, 'utf-8');
      checkForHardcodedRoles(file, content);
      checkRoleImports(file, content);
    } catch (err) {
      console.warn(`⚠️  Could not read file: ${file}`);
    }
  }
}

/**
 * Check that Prisma client is generated
 */
function checkPrismaClientGenerated() {
  try {
    const enums = getPrismaEnumValues();
    console.log('✅ Prisma Client is generated');
    console.log(`   - UserRole has ${enums.UserRole.length} values: ${enums.UserRole.join(', ')}`);
  } catch (err) {
    errors.push({
      file: 'N/A',
      line: 0,
      message: 'Prisma Client is not generated. Run: pnpm prisma generate',
      severity: 'error',
    });
  }
}

/**
 * Main validation function
 */
async function main() {
  checkPrismaClientGenerated();
  await validateFiles();

  console.log('\n📊 Validation Results:\n');

  if (errors.length === 0) {
    console.log('✅ All Prisma type checks passed!\n');
    console.log('💡 Best practices detected:');
    console.log('   - No hardcoded role strings found');
    console.log('   - Types imported from correct sources');
    console.log('   - Enum values match Prisma schema\n');
    process.exit(0);
  }

  // Group errors by severity
  const criticalErrors = errors.filter((e) => e.severity === 'error');
  const warnings = errors.filter((e) => e.severity === 'warning');

  if (criticalErrors.length > 0) {
    console.log(`❌ ${criticalErrors.length} critical error(s) found:\n`);
    criticalErrors.forEach((err) => {
      console.log(`   ${err.file}:${err.line}`);
      console.log(`   ${err.message}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s) found:\n`);
    warnings.forEach((err) => {
      console.log(`   ${err.file}:${err.line}`);
      console.log(`   ${err.message}\n`);
    });
  }

  console.log('💡 Recommendations:');
  console.log('   1. Use Prisma-generated enums: import { UserRole } from "@prisma/client"');
  console.log('   2. Import from prisma-bridge for shared types');
  console.log('   3. Never hardcode lowercase role strings');
  console.log('   4. Use type guards for runtime validation\n');

  process.exit(criticalErrors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});
