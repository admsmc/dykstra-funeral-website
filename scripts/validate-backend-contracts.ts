#!/usr/bin/env tsx
/**
 * Backend Contract Validation
 * 
 * Validates that TypeScript ports/adapters correctly map to Go backend API endpoints.
 * 
 * This script:
 * 1. Analyzes TypeScript port interfaces to extract expected HTTP endpoints
 * 2. Validates adapters implement all port methods
 * 3. (Future) Compares against OpenAPI spec when available
 * 4. Reports any discrepancies
 * 
 * Usage:
 *   npx tsx scripts/validate-backend-contracts.ts
 *   pnpm validate:contracts
 */

import fs from 'fs';
import path from 'path';

interface PortMethod {
  name: string;
  portFile: string;
  portInterface: string;
  expectedEndpoint?: string;
  httpMethod?: string;
  hasAdapter: boolean;
  adapterFile?: string;
}

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalPorts: number;
    totalMethods: number;
    methodsWithAdapters: number;
    methodsWithoutAdapters: number;
    expectedEndpoints: number;
  };
  portMethods: PortMethod[]; // Expose for OpenAPI comparison
}

const ROOT_DIR = path.resolve(__dirname, '..');
const PORTS_DIR = path.join(ROOT_DIR, 'packages/application/src/ports');
const ADAPTERS_DIR = path.join(ROOT_DIR, 'packages/infrastructure/src/adapters/go-backend');

/**
 * Extract port interface methods from TypeScript files
 */
function extractPortMethods(portFile: string): PortMethod[] {
  const content = fs.readFileSync(portFile, 'utf-8');
  const methods: PortMethod[] = [];
  
  // Match interface definitions
  const interfaceRegex = /export interface (\w+PortService) \{([^}]+)\}/gs;
  const matches = content.matchAll(interfaceRegex);
  
  for (const match of matches) {
    const interfaceName = match[1];
    const interfaceBody = match[2];
    
    // Extract method signatures
    const methodRegex = /readonly (\w+):\s*\([^)]*\)\s*=>/g;
    const methodMatches = interfaceBody.matchAll(methodRegex);
    
    for (const methodMatch of methodMatches) {
      const methodName = methodMatch[1];
      methods.push({
        name: methodName,
        portFile: path.basename(portFile),
        portInterface: interfaceName,
        hasAdapter: false,
      });
    }
  }
  
  return methods;
}

/**
 * Check if adapter implements the port method
 */
function checkAdapterImplementation(methodName: string, adapterFile: string): boolean {
  const content = fs.readFileSync(adapterFile, 'utf-8');
  
  // Look for method implementation in adapter object
  const methodRegex = new RegExp(`${methodName}:\\s*\\([^)]*\\)\\s*=>`, 'g');
  return methodRegex.test(content);
}

/**
 * Extract expected HTTP endpoints from adapter implementation
 */
function extractEndpointFromAdapter(methodName: string, adapterFile: string): { endpoint?: string; method?: string } {
  const content = fs.readFileSync(adapterFile, 'utf-8');
  
  // Find method implementation
  const methodRegex = new RegExp(`${methodName}:\\s*\\([^)]*\\)\\s*=>\\s*Effect\\.tryPromise\\(\\{[^}]+try:\\s*async\\s*\\(\\)\\s*=>\\s*\\{([^}]+)`, 'gs');
  const match = methodRegex.exec(content);
  
  if (!match) return {};
  
  const methodBody = match[1];
  
  // Extract HTTP method and endpoint
  const httpCallRegex = /goClient\.(GET|POST|PATCH|PUT|DELETE)\('([^']+)'/;
  const httpMatch = httpCallRegex.exec(methodBody);
  
  if (httpMatch) {
    return {
      method: httpMatch[1],
      endpoint: httpMatch[2],
    };
  }
  
  return {};
}

/**
 * Find corresponding adapter file for a port
 */
function findAdapterFile(portFile: string): string | null {
  const portName = path.basename(portFile, '.ts');
  
  // Common mapping patterns
  const adapterPatterns = [
    `${portName.replace('-port', '-adapter')}.ts`,
    `go-${portName.replace('go-', '').replace('-port', '-adapter')}.ts`,
    // Check consolidated adapter files
    'go-medium-priority-adapters.ts',
    'go-low-priority-adapters.ts',
  ];
  
  for (const pattern of adapterPatterns) {
    const adapterPath = path.join(ADAPTERS_DIR, pattern);
    if (fs.existsSync(adapterPath)) {
      return adapterPath;
    }
  }
  
  return null;
}

/**
 * Main validation function
 */
function validateBackendContracts(): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
    summary: {
      totalPorts: 0,
      totalMethods: 0,
      methodsWithAdapters: 0,
      methodsWithoutAdapters: 0,
      expectedEndpoints: 0,
    },
    portMethods: [], // Collect all methods for OpenAPI comparison
  };
  
  // Get all port files
  const portFiles = fs.readdirSync(PORTS_DIR)
    .filter(file => file.startsWith('go-') && file.endsWith('-port.ts'))
    .map(file => path.join(PORTS_DIR, file));
  
  result.summary.totalPorts = portFiles.length;
  
  console.log(`📋 Analyzing ${portFiles.length} Go backend port files...`);
  console.log('');
  
  for (const portFile of portFiles) {
    const portName = path.basename(portFile, '.ts');
    const methods = extractPortMethods(portFile);
    
    if (methods.length === 0) {
      result.warnings.push(`⚠️  No methods found in ${portName}`);
      continue;
    }
    
    result.summary.totalMethods += methods.length;
    
    // Find corresponding adapter
    const adapterFile = findAdapterFile(portFile);
    
    if (!adapterFile) {
      result.errors.push(`❌ No adapter found for ${portName}`);
      result.passed = false;
      continue;
    }
    
    console.log(`🔍 ${portName} (${methods.length} methods)`);
    
    // Check each method
    for (const method of methods) {
      const hasImplementation = checkAdapterImplementation(method.name, adapterFile);
      
      if (hasImplementation) {
        method.hasAdapter = true;
        method.adapterFile = path.basename(adapterFile);
        result.summary.methodsWithAdapters++;
        
        // Extract endpoint info
        const { endpoint, method: httpMethod } = extractEndpointFromAdapter(method.name, adapterFile);
        if (endpoint) {
          method.expectedEndpoint = endpoint;
          method.httpMethod = httpMethod;
          result.summary.expectedEndpoints++;
          console.log(`  ✅ ${method.name}: ${httpMethod} ${endpoint}`);
        } else {
          console.log(`  ✅ ${method.name}: (endpoint not extracted)`);
        }
      } else {
        method.hasAdapter = false;
        result.summary.methodsWithoutAdapters++;
        result.errors.push(`❌ ${portName}.${method.name} missing adapter implementation in ${path.basename(adapterFile)}`);
        result.passed = false;
        console.log(`  ❌ ${method.name}: NOT IMPLEMENTED`);
      }
      
      // Add to collected methods for OpenAPI comparison
      result.portMethods.push(method);
    }
    
    console.log('');
  }
  
  return result;
}

/**
 * Print validation results
 */
function printResults(result: ValidationResult): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 Backend Contract Validation Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Total Ports Analyzed:          ${result.summary.totalPorts}`);
  console.log(`  Total Port Methods:            ${result.summary.totalMethods}`);
  console.log(`  Methods with Adapters:         ${result.summary.methodsWithAdapters} ✅`);
  console.log(`  Methods without Adapters:      ${result.summary.methodsWithoutAdapters} ${result.summary.methodsWithoutAdapters > 0 ? '❌' : '✅'}`);
  console.log(`  Endpoints Extracted:           ${result.summary.expectedEndpoints}`);
  console.log('');
  
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  ${warning}`));
    console.log('');
  }
  
  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(error => console.log(`  ${error}`));
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (result.passed) {
    console.log('✅ All backend contracts validated successfully!');
    console.log('   All port methods have corresponding adapter implementations.');
  } else {
    console.log('❌ Backend contract validation FAILED!');
    console.log(`   ${result.errors.length} error(s) found.`);
    console.log('');
    console.log('💡 To fix:');
    console.log('   1. Implement missing adapter methods in the appropriate adapter file');
    console.log('   2. Ensure method names match between port and adapter');
    console.log('   3. Verify adapter objects implement the full port interface');
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting Backend Contract Validation...');
  console.log('');
  
  try {
    const result = validateBackendContracts();
    printResults(result);
    
    if (!result.passed) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Validation script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { validateBackendContracts, ValidationResult, PortMethod };
