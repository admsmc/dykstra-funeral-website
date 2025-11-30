#!/usr/bin/env tsx
/**
 * Backend Contract Validation - Phase 2: OpenAPI Integration
 * 
 * Validates TypeScript ports/adapters against Go backend OpenAPI specification.
 * 
 * Features:
 * - Parses OpenAPI YAML spec (if available)
 * - Compares extracted endpoints against OpenAPI endpoints
 * - Validates HTTP methods and paths match
 * - Reports missing or mismatched endpoints
 * - Runs as standalone or as part of CI/CD
 * 
 * Usage:
 *   npx tsx scripts/validate-backend-contracts-openapi.ts
 *   npx tsx scripts/validate-backend-contracts-openapi.ts --openapi-url http://localhost:8080/openapi.yaml
 *   pnpm validate:contracts --with-openapi
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { validateBackendContracts, ValidationResult as BaseValidationResult } from './validate-backend-contracts';

interface OpenAPIEndpoint {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  tags?: string[];
}

interface OpenAPIValidationResult extends BaseValidationResult {
  openapi: {
    loaded: boolean;
    specPath?: string;
    totalEndpoints: number;
    matchedEndpoints: number;
    unmatchedEndpoints: OpenAPIEndpoint[];
    adapterEndpointsNotInSpec: Array<{
      method: string;
      endpoint: string;
      portMethod: string;
    }>;
  };
}

/**
 * Parse OpenAPI YAML specification
 */
function parseOpenAPISpec(specPath: string): OpenAPIEndpoint[] {
  try {
    const content = fs.readFileSync(specPath, 'utf-8');
    const spec = yaml.load(content) as any;
    
    const endpoints: OpenAPIEndpoint[] = [];
    
    if (!spec.paths) {
      console.warn('⚠️  No paths found in OpenAPI spec');
      return endpoints;
    }
    
    for (const [path, pathItem] of Object.entries(spec.paths as Record<string, any>)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            operationId: operation.operationId,
            summary: operation.summary,
            tags: operation.tags || [],
          });
        }
      }
    }
    
    return endpoints;
  } catch (error) {
    console.error(`❌ Failed to parse OpenAPI spec at ${specPath}:`, error);
    return [];
  }
}

/**
 * Normalize endpoint paths for comparison
 * Converts Go-style path params {id} to TypeScript-style :id or vice versa
 */
function normalizeEndpointPath(path: string): string {
  // Convert {id} to generic placeholder for comparison
  return path.replace(/\{[^}]+\}/g, '{param}');
}

/**
 * Compare adapter endpoints against OpenAPI spec
 */
function compareWithOpenAPI(
  baseResult: BaseValidationResult,
  openapiEndpoints: OpenAPIEndpoint[]
): OpenAPIValidationResult {
  const result: OpenAPIValidationResult = {
    ...baseResult,
    openapi: {
      loaded: openapiEndpoints.length > 0,
      totalEndpoints: openapiEndpoints.length,
      matchedEndpoints: 0,
      unmatchedEndpoints: [],
      adapterEndpointsNotInSpec: [],
    },
  };
  
  // Extract adapter endpoints from baseResult
  const adapterEndpoints = baseResult.portMethods
    .filter(m => m.hasAdapter && m.expectedEndpoint && m.httpMethod)
    .map(m => ({
      method: m.httpMethod!,
      endpoint: m.expectedEndpoint!,
      normalizedPath: normalizeEndpointPath(m.expectedEndpoint!),
      portMethod: `${m.portInterface}.${m.name}`,
    }));
  
  // Normalize OpenAPI endpoints for comparison
  const normalizedOpenAPIEndpoints = openapiEndpoints.map(e => ({
    ...e,
    normalizedPath: normalizeEndpointPath(e.path),
    signature: `${e.method} ${normalizeEndpointPath(e.path)}`,
  }));
  
  console.log('');
  console.log('🔗 Comparing with OpenAPI Specification...');
  console.log('');
  
  // Build a map of OpenAPI endpoints for quick lookup
  const openapiMap = new Map(
    normalizedOpenAPIEndpoints.map(e => [e.signature, e])
  );
  
  // Build a map of adapter endpoints for reverse lookup
  const adapterMap = new Map(
    adapterEndpoints.map(e => [`${e.method} ${e.normalizedPath}`, e])
  );
  
  // Check which OpenAPI endpoints are matched by adapters
  for (const openApiEndpoint of normalizedOpenAPIEndpoints) {
    const signature = `${openApiEndpoint.method} ${openApiEndpoint.normalizedPath}`;
    
    if (adapterMap.has(signature)) {
      result.openapi.matchedEndpoints++;
    } else {
      result.openapi.unmatchedEndpoints.push(openApiEndpoint);
    }
  }
  
  // Check which adapter endpoints are NOT in OpenAPI spec
  for (const adapterEndpoint of adapterEndpoints) {
    const signature = `${adapterEndpoint.method} ${adapterEndpoint.normalizedPath}`;
    
    if (!openapiMap.has(signature)) {
      result.openapi.adapterEndpointsNotInSpec.push(adapterEndpoint);
    }
  }
  
  return result;
}

/**
 * Print OpenAPI validation results
 */
function printOpenAPIResults(result: OpenAPIValidationResult): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔗 OpenAPI Specification Comparison');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  if (!result.openapi.loaded) {
    console.log('⚠️  No OpenAPI specification loaded');
    console.log('   Run with --openapi-path to enable spec comparison');
    console.log('');
    return;
  }
  
  console.log(`  OpenAPI Endpoints:             ${result.openapi.totalEndpoints}`);
  console.log(`  Matched in Adapters:           ${result.openapi.matchedEndpoints} ✅`);
  console.log(`  Missing from Adapters:         ${result.openapi.unmatchedEndpoints.length} ${result.openapi.unmatchedEndpoints.length > 0 ? '❌' : '✅'}`);
  console.log(`  Adapter-only (not in spec):    ${result.openapi.adapterEndpointsNotInSpec.length} ${result.openapi.adapterEndpointsNotInSpec.length > 0 ? '⚠️' : '✅'}`);
  console.log('');
  
  if (result.openapi.unmatchedEndpoints.length > 0) {
    console.log('❌ OpenAPI Endpoints Missing from Adapters:');
    result.openapi.unmatchedEndpoints.slice(0, 10).forEach(endpoint => {
      console.log(`  ${endpoint.method} ${endpoint.path}`);
      if (endpoint.summary) {
        console.log(`    Summary: ${endpoint.summary}`);
      }
    });
    if (result.openapi.unmatchedEndpoints.length > 10) {
      console.log(`  ... and ${result.openapi.unmatchedEndpoints.length - 10} more`);
    }
    console.log('');
  }
  
  if (result.openapi.adapterEndpointsNotInSpec.length > 0) {
    console.log('⚠️  Adapter Endpoints Not Found in OpenAPI Spec:');
    result.openapi.adapterEndpointsNotInSpec.slice(0, 10).forEach(endpoint => {
      console.log(`  ${endpoint.method} ${endpoint.endpoint} (${endpoint.portMethod})`);
    });
    if (result.openapi.adapterEndpointsNotInSpec.length > 10) {
      console.log(`  ... and ${result.openapi.adapterEndpointsNotInSpec.length - 10} more`);
    }
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (result.openapi.unmatchedEndpoints.length > 0) {
    console.log('⚠️  OpenAPI validation warnings detected');
    console.log('   Some OpenAPI endpoints are not implemented in TypeScript adapters');
    console.log('');
    console.log('💡 To fix:');
    console.log('   1. Add missing port methods for unmapped endpoints');
    console.log('   2. Implement adapters for those methods');
    console.log('   3. Or verify endpoints are intentionally not implemented (e.g., admin-only)');
  } else {
    console.log('✅ All OpenAPI endpoints are covered by TypeScript adapters!');
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const openapiPathArg = args.find(arg => arg.startsWith('--openapi-path='));
  const openapiUrlArg = args.find(arg => arg.startsWith('--openapi-url='));
  
  console.log('🚀 Starting Backend Contract Validation (OpenAPI Integration)...');
  console.log('');
  
  // Run base validation first
  const baseResult = validateBackendContracts();
  
  // Load OpenAPI spec if provided
  let openapiEndpoints: OpenAPIEndpoint[] = [];
  let specPath: string | undefined;
  
  if (openapiPathArg) {
    specPath = openapiPathArg.split('=')[1];
    console.log(`📖 Loading OpenAPI spec from: ${specPath}`);
    openapiEndpoints = parseOpenAPISpec(specPath);
  } else if (openapiUrlArg) {
    const url = openapiUrlArg.split('=')[1];
    console.log(`📖 OpenAPI URL provided: ${url}`);
    console.log('⚠️  Remote URL fetching not yet implemented - use --openapi-path with local file');
    console.log('   Download the spec first: curl -o openapi.yaml ' + url);
  } else {
    // Check for common OpenAPI spec locations
    const commonPaths = [
      'docs/openapi.yaml',
      'docs/openapi/openapi.yaml',
      'openapi.yaml',
      '../go-erp/docs/openapi.yaml', // Sibling repo pattern
    ];
    
    for (const commonPath of commonPaths) {
      const fullPath = path.resolve(process.cwd(), commonPath);
      if (fs.existsSync(fullPath)) {
        specPath = fullPath;
        console.log(`📖 Found OpenAPI spec at: ${specPath}`);
        openapiEndpoints = parseOpenAPISpec(specPath);
        break;
      }
    }
    
    if (!specPath) {
      console.log('ℹ️  No OpenAPI spec found (checked common locations)');
      console.log('   Run with --openapi-path=path/to/openapi.yaml to enable spec validation');
    }
  }
  
  // Compare with OpenAPI if loaded
  const result = openapiEndpoints.length > 0
    ? compareWithOpenAPI(baseResult, openapiEndpoints)
    : { ...baseResult, openapi: { loaded: false, totalEndpoints: 0, matchedEndpoints: 0, unmatchedEndpoints: [], adapterEndpointsNotInSpec: [] } };
  
  if (specPath) {
    result.openapi.specPath = specPath;
  }
  
  // Print results
  printOpenAPIResults(result);
  
  // Exit with error if base validation failed
  if (!baseResult.passed) {
    process.exit(1);
  }
  
  // Exit with warning if OpenAPI comparison found issues
  if (result.openapi.loaded && result.openapi.unmatchedEndpoints.length > 5) {
    console.log('⚠️  Exiting with warning: significant OpenAPI mismatches detected');
    // Don't fail the build for this yet - it's informational
    // process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { parseOpenAPISpec, compareWithOpenAPI, OpenAPIValidationResult };
