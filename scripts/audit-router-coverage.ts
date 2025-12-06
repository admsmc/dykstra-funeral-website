#!/usr/bin/env tsx
/**
 * Audit Router Coverage
 * 
 * Checks which tRPC router endpoints are used in the frontend UI
 * and identifies any gaps.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface RouterEndpoint {
  router: string;
  endpoint: string;
  type: 'query' | 'mutation';
}

interface AuditResult {
  router: string;
  totalEndpoints: number;
  usedEndpoints: string[];
  unusedEndpoints: string[];
  usageLocations: Map<string, string[]>;
}

// Get all router files
const ROUTERS_DIR = 'packages/api/src/routers';
const UI_DIR = 'src/app/staff';

async function extractRouterEndpoints(routerPath: string): Promise<RouterEndpoint[]> {
  const content = fs.readFileSync(routerPath, 'utf-8');
  const routerName = path.basename(routerPath, '.router.ts').replace('.ts', '');
  const endpoints: RouterEndpoint[] = [];

  // Match endpoint definitions: endpointName: procedure.query( or .mutation(
  // Look for patterns like: create: staffProcedure.mutation(
  const endpointPattern = /(\w+):\s+\w+Procedure(?:\.input\([^)]+\))?\s*\.(query|mutation)\(/g;
  
  let match;
  while ((match = endpointPattern.exec(content)) !== null) {
    endpoints.push({ 
      router: routerName, 
      endpoint: match[1], 
      type: match[2] as 'query' | 'mutation' 
    });
  }

  return endpoints;
}

async function findEndpointUsages(router: string, endpoint: string): Promise<string[]> {
  const pattern = `api\\.${router}\\.${endpoint}`;
  const files = await glob(`${UI_DIR}/**/*.{ts,tsx}`, { absolute: true });
  const locations: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const regex = new RegExp(`api\\.${router}\\.${endpoint}`, 'g');
    
    if (regex.test(content)) {
      const relativePath = path.relative(process.cwd(), file);
      locations.push(relativePath);
    }
  }

  return locations;
}

async function auditRouter(routerPath: string): Promise<AuditResult> {
  const endpoints = await extractRouterEndpoints(routerPath);
  const routerName = path.basename(routerPath, '.router.ts').replace('.ts', '');
  
  const usageLocations = new Map<string, string[]>();
  const usedEndpoints: string[] = [];
  const unusedEndpoints: string[] = [];

  console.log(`\nAuditing ${routerName} router (${endpoints.length} endpoints)...`);

  for (const { endpoint } of endpoints) {
    const locations = await findEndpointUsages(routerName, endpoint);
    
    if (locations.length > 0) {
      usedEndpoints.push(endpoint);
      usageLocations.set(endpoint, locations);
    } else {
      unusedEndpoints.push(endpoint);
    }
  }

  return {
    router: routerName,
    totalEndpoints: endpoints.length,
    usedEndpoints,
    unusedEndpoints,
    usageLocations,
  };
}

async function main() {
  console.log('🔍 Starting Router Coverage Audit...\n');
  console.log('='.repeat(80));

  const routerFiles = await glob(`${ROUTERS_DIR}/*.router.ts`, { absolute: true });
  const results: AuditResult[] = [];

  for (const routerFile of routerFiles) {
    const result = await auditRouter(routerFile);
    results.push(result);
  }

  // Generate report
  console.log('\n\n📊 AUDIT RESULTS');
  console.log('='.repeat(80));

  let totalEndpoints = 0;
  let totalUsed = 0;
  let totalUnused = 0;

  for (const result of results) {
    totalEndpoints += result.totalEndpoints;
    totalUsed += result.usedEndpoints.length;
    totalUnused += result.unusedEndpoints.length;

    const coverage = result.totalEndpoints > 0
      ? ((result.usedEndpoints.length / result.totalEndpoints) * 100).toFixed(1)
      : '0.0';

    console.log(`\n${result.router.toUpperCase()}`);
    console.log(`  Total Endpoints: ${result.totalEndpoints}`);
    console.log(`  Used: ${result.usedEndpoints.length} (${coverage}%)`);
    console.log(`  Unused: ${result.unusedEndpoints.length}`);

    if (result.unusedEndpoints.length > 0) {
      console.log(`  ⚠️  Unused endpoints:`);
      for (const endpoint of result.unusedEndpoints) {
        console.log(`     - ${endpoint}`);
      }
    }
  }

  // Summary
  console.log('\n\n📈 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Endpoints: ${totalEndpoints}`);
  console.log(`Used in UI: ${totalUsed} (${((totalUsed / totalEndpoints) * 100).toFixed(1)}%)`);
  console.log(`Unused: ${totalUnused} (${((totalUnused / totalEndpoints) * 100).toFixed(1)}%)`);

  // Write detailed report to file
  const reportPath = 'docs/ROUTER_COVERAGE_AUDIT.md';
  let markdown = '# Router Coverage Audit\n\n';
  markdown += `**Date**: ${new Date().toISOString().split('T')[0]}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Endpoints**: ${totalEndpoints}\n`;
  markdown += `- **Used in UI**: ${totalUsed} (${((totalUsed / totalEndpoints) * 100).toFixed(1)}%)\n`;
  markdown += `- **Unused**: ${totalUnused} (${((totalUnused / totalEndpoints) * 100).toFixed(1)}%)\n\n`;

  markdown += `## Routers\n\n`;

  for (const result of results.sort((a, b) => b.unusedEndpoints.length - a.unusedEndpoints.length)) {
    const coverage = result.totalEndpoints > 0
      ? ((result.usedEndpoints.length / result.totalEndpoints) * 100).toFixed(1)
      : '0.0';

    markdown += `### ${result.router}\n\n`;
    markdown += `**Coverage**: ${result.usedEndpoints.length}/${result.totalEndpoints} (${coverage}%)\n\n`;

    if (result.unusedEndpoints.length > 0) {
      markdown += `#### ⚠️ Unused Endpoints (${result.unusedEndpoints.length})\n\n`;
      for (const endpoint of result.unusedEndpoints) {
        markdown += `- \`${endpoint}\`\n`;
      }
      markdown += '\n';
    }

    if (result.usedEndpoints.length > 0) {
      markdown += `#### ✅ Used Endpoints (${result.usedEndpoints.length})\n\n`;
      for (const endpoint of result.usedEndpoints) {
        const locations = result.usageLocations.get(endpoint) || [];
        markdown += `- \`${endpoint}\` (${locations.length} location${locations.length > 1 ? 's' : ''})\n`;
      }
      markdown += '\n';
    }
  }

  fs.writeFileSync(reportPath, markdown);
  console.log(`\n✅ Detailed report written to: ${reportPath}`);
}

main().catch(console.error);
