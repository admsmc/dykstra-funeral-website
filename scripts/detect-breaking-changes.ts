#!/usr/bin/env tsx
/**
 * Breaking Change Detection
 * 
 * Tracks API contract changes over time and detects breaking changes.
 * 
 * Features:
 * - Stores baseline snapshots of port/adapter contracts
 * - Compares current state against baseline
 * - Detects removed methods, changed signatures, removed endpoints
 * - Warns on breaking changes
 * - Allows baseline updates after review
 * 
 * Usage:
 *   npx tsx scripts/detect-breaking-changes.ts                    # Check for changes
 *   npx tsx scripts/detect-breaking-changes.ts --update-baseline  # Update baseline
 *   pnpm validate:breaking-changes
 */

import fs from 'fs';
import path from 'path';
import { validateBackendContracts, ValidationResult, PortMethod } from './validate-backend-contracts';

const ROOT_DIR = path.resolve(__dirname, '..');
const BASELINE_FILE = path.join(ROOT_DIR, '.baseline', 'backend-contracts.json');

interface ContractBaseline {
  version: string;
  timestamp: string;
  contracts: {
    [portName: string]: {
      methods: string[];
      endpoints: {
        [methodName: string]: {
          httpMethod: string;
          path: string;
        };
      };
    };
  };
}

interface BreakingChange {
  type: 'removed_method' | 'removed_endpoint' | 'changed_endpoint' | 'added_method';
  severity: 'breaking' | 'non-breaking';
  portName: string;
  methodName: string;
  details: string;
  baseline?: any;
  current?: any;
}

/**
 * Convert validation result to baseline format
 */
function createBaseline(result: ValidationResult): ContractBaseline {
  const contracts: ContractBaseline['contracts'] = {};
  
  // Group methods by port
  const portGroups = result.portMethods.reduce((acc, method) => {
    const portName = method.portFile.replace('.ts', '');
    if (!acc[portName]) {
      acc[portName] = [];
    }
    acc[portName].push(method);
    return acc;
  }, {} as Record<string, PortMethod[]>);
  
  // Build baseline structure
  for (const [portName, methods] of Object.entries(portGroups)) {
    contracts[portName] = {
      methods: methods.map(m => m.name),
      endpoints: {},
    };
    
    for (const method of methods) {
      if (method.httpMethod && method.expectedEndpoint) {
        contracts[portName].endpoints[method.name] = {
          httpMethod: method.httpMethod,
          path: method.expectedEndpoint,
        };
      }
    }
  }
  
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    contracts,
  };
}

/**
 * Load baseline from disk
 */
function loadBaseline(): ContractBaseline | null {
  try {
    if (!fs.existsSync(BASELINE_FILE)) {
      return null;
    }
    
    const content = fs.readFileSync(BASELINE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('⚠️  Failed to load baseline:', error);
    return null;
  }
}

/**
 * Save baseline to disk
 */
function saveBaseline(baseline: ContractBaseline): void {
  const dir = path.dirname(BASELINE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2), 'utf-8');
  console.log(`✅ Baseline saved to ${path.relative(ROOT_DIR, BASELINE_FILE)}`);
}

/**
 * Compare current state against baseline and detect breaking changes
 */
function detectBreakingChanges(
  baseline: ContractBaseline,
  current: ContractBaseline
): BreakingChange[] {
  const changes: BreakingChange[] = [];
  
  // Check each port in baseline
  for (const [portName, baselineContract] of Object.entries(baseline.contracts)) {
    const currentContract = current.contracts[portName];
    
    if (!currentContract) {
      // Entire port removed (very breaking!)
      changes.push({
        type: 'removed_method',
        severity: 'breaking',
        portName,
        methodName: '*',
        details: `Entire port ${portName} was removed`,
      });
      continue;
    }
    
    // Check for removed methods
    for (const methodName of baselineContract.methods) {
      if (!currentContract.methods.includes(methodName)) {
        changes.push({
          type: 'removed_method',
          severity: 'breaking',
          portName,
          methodName,
          details: `Method ${methodName} was removed from ${portName}`,
        });
      }
    }
    
    // Check for endpoint changes
    for (const [methodName, baselineEndpoint] of Object.entries(baselineContract.endpoints)) {
      const currentEndpoint = currentContract.endpoints[methodName];
      
      if (!currentEndpoint) {
        changes.push({
          type: 'removed_endpoint',
          severity: 'breaking',
          portName,
          methodName,
          details: `Endpoint for ${methodName} was removed`,
          baseline: baselineEndpoint,
        });
      } else if (
        baselineEndpoint.httpMethod !== currentEndpoint.httpMethod ||
        baselineEndpoint.path !== currentEndpoint.path
      ) {
        changes.push({
          type: 'changed_endpoint',
          severity: 'breaking',
          portName,
          methodName,
          details: `Endpoint for ${methodName} changed`,
          baseline: baselineEndpoint,
          current: currentEndpoint,
        });
      }
    }
    
    // Check for added methods (non-breaking, but worth noting)
    for (const methodName of currentContract.methods) {
      if (!baselineContract.methods.includes(methodName)) {
        changes.push({
          type: 'added_method',
          severity: 'non-breaking',
          portName,
          methodName,
          details: `Method ${methodName} was added to ${portName}`,
        });
      }
    }
  }
  
  // Check for entirely new ports (non-breaking)
  for (const portName of Object.keys(current.contracts)) {
    if (!baseline.contracts[portName]) {
      changes.push({
        type: 'added_method',
        severity: 'non-breaking',
        portName,
        methodName: '*',
        details: `New port ${portName} was added`,
      });
    }
  }
  
  return changes;
}

/**
 * Print breaking changes report
 */
function printBreakingChanges(changes: BreakingChange[]): void {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 Breaking Change Detection');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  if (changes.length === 0) {
    console.log('✅ No changes detected since baseline');
    console.log('');
    return;
  }
  
  const breakingChanges = changes.filter(c => c.severity === 'breaking');
  const nonBreakingChanges = changes.filter(c => c.severity === 'non-breaking');
  
  console.log(`  Breaking Changes:     ${breakingChanges.length} ${breakingChanges.length > 0 ? '❌' : '✅'}`);
  console.log(`  Non-Breaking Changes: ${nonBreakingChanges.length} ${nonBreakingChanges.length > 0 ? '⚠️' : '✅'}`);
  console.log('');
  
  if (breakingChanges.length > 0) {
    console.log('❌ Breaking Changes Detected:');
    console.log('');
    
    for (const change of breakingChanges) {
      console.log(`  ${change.type.toUpperCase()}: ${change.portName}.${change.methodName}`);
      console.log(`    ${change.details}`);
      
      if (change.baseline && change.current) {
        console.log(`    Before: ${change.baseline.httpMethod} ${change.baseline.path}`);
        console.log(`    After:  ${change.current.httpMethod} ${change.current.path}`);
      } else if (change.baseline) {
        console.log(`    Was: ${change.baseline.httpMethod} ${change.baseline.path}`);
      }
      
      console.log('');
    }
  }
  
  if (nonBreakingChanges.length > 0) {
    console.log('ℹ️  Non-Breaking Changes:');
    console.log('');
    
    for (const change of nonBreakingChanges.slice(0, 10)) {
      console.log(`  ${change.type.toUpperCase()}: ${change.portName}.${change.methodName}`);
      console.log(`    ${change.details}`);
      console.log('');
    }
    
    if (nonBreakingChanges.length > 10) {
      console.log(`  ... and ${nonBreakingChanges.length - 10} more`);
      console.log('');
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (breakingChanges.length > 0) {
    console.log('❌ BREAKING CHANGES DETECTED!');
    console.log('');
    console.log('💡 Actions:');
    console.log('   1. Review changes carefully - breaking changes may affect consumers');
    console.log('   2. Coordinate with Go backend team to verify changes are intentional');
    console.log('   3. Update adapters to match new backend contracts');
    console.log('   4. After review, update baseline: pnpm validate:breaking-changes --update-baseline');
    console.log('');
    console.log('⚠️  Do NOT update baseline until breaking changes are resolved!');
  } else if (nonBreakingChanges.length > 0) {
    console.log('✅ Only non-breaking changes detected');
    console.log('   Consider updating baseline: pnpm validate:breaking-changes --update-baseline');
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const updateBaseline = args.includes('--update-baseline');
  const quiet = args.includes('--quiet');
  
  if (!quiet) {
    console.log('🚀 Running Backend Contract Validation...');
    console.log('');
  }
  
  // Validate current contracts (suppress output if --quiet flag is set)
  const originalLog = console.log;
  if (quiet) {
    console.log = () => {}; // Suppress console.log
  }
  const validationResult = validateBackendContracts();
  if (quiet) {
    console.log = originalLog; // Restore console.log
  }
  
  if (!validationResult.passed) {
    console.error('');
    console.error('❌ Contract validation failed - fix adapter issues before checking for breaking changes');
    process.exit(1);
  }
  
  // Create current baseline
  const currentBaseline = createBaseline(validationResult);
  
  if (updateBaseline) {
    saveBaseline(currentBaseline);
    console.log('');
    console.log('✅ Baseline updated successfully');
    console.log(`   ${Object.keys(currentBaseline.contracts).length} ports tracked`);
    console.log(`   ${validationResult.summary.totalMethods} methods tracked`);
    console.log(`   ${validationResult.summary.expectedEndpoints} endpoints tracked`);
    return;
  }
  
  // Load previous baseline
  const baseline = loadBaseline();
  
  if (!baseline) {
    console.log('');
    console.log('ℹ️  No baseline found - creating initial baseline');
    saveBaseline(currentBaseline);
    console.log('');
    console.log('✅ Initial baseline created');
    console.log('   Future runs will compare against this baseline');
    return;
  }
  
  console.log('');
  console.log(`📋 Comparing against baseline from ${new Date(baseline.timestamp).toLocaleString()}`);
  
  // Detect changes
  const changes = detectBreakingChanges(baseline, currentBaseline);
  
  // Print report
  printBreakingChanges(changes);
  
  // Exit with error if breaking changes detected
  const breakingChanges = changes.filter(c => c.severity === 'breaking');
  if (breakingChanges.length > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { detectBreakingChanges };
export type { BreakingChange, ContractBaseline };
