#!/usr/bin/env tsx
/**
 * Go Backend Ports, Methods, and Adapters Audit
 * 
 * This script audits the Go backend integration to ensure:
 * - All ports have matching adapters
 * - All port methods are implemented in adapters
 * - HTTP endpoints are documented
 * - Method counts match between ports and adapters
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PORTS_DIR = join(process.cwd(), 'packages/application/src/ports');
const ADAPTERS_DIR = join(process.cwd(), 'packages/infrastructure/src/adapters/go-backend');

interface MethodInfo {
  name: string;
  signature: string;
}

interface PortInfo {
  name: string;
  fileName: string;
  methods: MethodInfo[];
  hasAdapter: boolean;
  adapterFileName?: string;
  adapterMethods?: MethodInfo[];
  endpoints?: string[];
}

function extractMethods(fileContent: string, isPort: boolean): MethodInfo[] {
  const methods: MethodInfo[] = [];
  
  if (isPort) {
    // Extract methods from port interface
    // Find the service interface boundaries
    const startMatch = fileContent.match(/export interface \w+Service\s*{/);
    if (!startMatch) return methods;
    
    // Find matching closing brace
    let braceCount = 1;
    let startIndex = startMatch.index! + startMatch[0].length;
    let endIndex = startIndex;
    
    while (braceCount > 0 && endIndex < fileContent.length) {
      if (fileContent[endIndex] === '{') braceCount++;
      if (fileContent[endIndex] === '}') braceCount--;
      endIndex++;
    }
    
    const interfaceBody = fileContent.slice(startIndex, endIndex - 1);
    
    // Match method names - look for pattern: readonly methodName:
    const methodPattern = /readonly\s+(\w+):\s*\([^)]*\)\s*=>/g;
    let match;
    
    while ((match = methodPattern.exec(interfaceBody)) !== null) {
      methods.push({
        name: match[1],
        signature: match[0].trim()
      });
    }
  } else {
    // Extract methods from adapter object
    // Pattern: methodName: (...args) => ...
    // Find the adapter object boundaries
    const startMatch = fileContent.match(/export const \w+Adapter[^=]*=\s*{/);
    if (!startMatch) return methods;
    
    // Find matching closing brace
    let braceCount = 1;
    let startIndex = startMatch.index! + startMatch[0].length;
    let endIndex = startIndex;
    
    while (braceCount > 0 && endIndex < fileContent.length) {
      if (fileContent[endIndex] === '{') braceCount++;
      if (fileContent[endIndex] === '}') braceCount--;
      endIndex++;
    }
    
    const adapterBody = fileContent.slice(startIndex, endIndex - 1);
    
    // Match method names - look for pattern: methodName: (params) =>
    // This handles multi-line definitions
    const methodPattern = /(\w+):\s*\([^)]*\)\s*=>/g;
    let match;
    
    while ((match = methodPattern.exec(adapterBody)) !== null) {
      // Filter out false positives (like 'try', 'catch' in Effect.tryPromise)
      const methodName = match[1];
      if (methodName !== 'try' && methodName !== 'catch') {
        methods.push({
          name: methodName,
          signature: match[0].trim()
        });
      }
    }
  }
  
  return methods;
}

function extractEndpoints(fileContent: string): string[] {
  const endpoints: string[] = [];
  
  // Pattern: goClient.METHOD('/v1/path', ...)
  const endpointPattern = /goClient\.(GET|POST|PUT|PATCH|DELETE)\(['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = endpointPattern.exec(fileContent)) !== null) {
    endpoints.push(`${match[1]} ${match[2]}`);
  }
  
  return [...new Set(endpoints)]; // Remove duplicates
}

function getPortName(fileName: string): string {
  return fileName.replace('go-', '').replace('-port.ts', '');
}

function getAdapterFileName(portFileName: string): string {
  return portFileName.replace('-port.ts', '-adapter.ts');
}

function auditPorts(): PortInfo[] {
  const portFiles = readdirSync(PORTS_DIR)
    .filter(f => f.startsWith('go-') && f.endsWith('-port.ts'))
    .sort();
  
  const adapterFiles = readdirSync(ADAPTERS_DIR)
    .filter(f => f.startsWith('go-') && f.endsWith('-adapter.ts'))
    .sort();
  
  const ports: PortInfo[] = [];
  
  for (const portFile of portFiles) {
    const portPath = join(PORTS_DIR, portFile);
    const portContent = readFileSync(portPath, 'utf-8');
    const methods = extractMethods(portContent, true);
    
    const expectedAdapterFile = getAdapterFileName(portFile);
    const hasAdapter = adapterFiles.includes(expectedAdapterFile);
    
    const portInfo: PortInfo = {
      name: getPortName(portFile),
      fileName: portFile,
      methods,
      hasAdapter,
    };
    
    if (hasAdapter) {
      const adapterPath = join(ADAPTERS_DIR, expectedAdapterFile);
      const adapterContent = readFileSync(adapterPath, 'utf-8');
      portInfo.adapterFileName = expectedAdapterFile;
      portInfo.adapterMethods = extractMethods(adapterContent, false);
      portInfo.endpoints = extractEndpoints(adapterContent);
    }
    
    ports.push(portInfo);
  }
  
  return ports;
}

function generateReport(ports: PortInfo[]): void {
  console.log('='.repeat(80));
  console.log('GO BACKEND PORTS, METHODS & ADAPTERS AUDIT');
  console.log('='.repeat(80));
  console.log();
  
  // Summary statistics
  const totalPorts = ports.length;
  const portsWithAdapters = ports.filter(p => p.hasAdapter).length;
  const totalPortMethods = ports.reduce((sum, p) => sum + p.methods.length, 0);
  const totalAdapterMethods = ports.reduce((sum, p) => sum + (p.adapterMethods?.length || 0), 0);
  const totalEndpoints = ports.reduce((sum, p) => sum + (p.endpoints?.length || 0), 0);
  
  console.log('📊 SUMMARY STATISTICS');
  console.log('-'.repeat(80));
  console.log(`Total Ports:           ${totalPorts}`);
  console.log(`Ports with Adapters:   ${portsWithAdapters} / ${totalPorts}`);
  console.log(`Total Port Methods:    ${totalPortMethods}`);
  console.log(`Total Adapter Methods: ${totalAdapterMethods}`);
  console.log(`Total HTTP Endpoints:  ${totalEndpoints}`);
  console.log(`Coverage:              ${((portsWithAdapters / totalPorts) * 100).toFixed(1)}%`);
  console.log();
  
  // Detailed port analysis
  console.log('📋 DETAILED PORT ANALYSIS');
  console.log('-'.repeat(80));
  console.log();
  
  for (const port of ports) {
    console.log(`🔹 ${port.name.toUpperCase()}`);
    console.log(`   Port File:      ${port.fileName}`);
    console.log(`   Port Methods:   ${port.methods.length}`);
    
    if (port.hasAdapter) {
      console.log(`   ✅ Adapter:     ${port.adapterFileName}`);
      console.log(`   Adapter Methods: ${port.adapterMethods?.length || 0}`);
      console.log(`   HTTP Endpoints:  ${port.endpoints?.length || 0}`);
      
      // Check if method counts match
      if (port.methods.length !== port.adapterMethods?.length) {
        console.log(`   ⚠️  Method count mismatch!`);
        
        // Find missing methods
        const portMethodNames = port.methods.map(m => m.name);
        const adapterMethodNames = port.adapterMethods?.map(m => m.name) || [];
        
        const missingInAdapter = portMethodNames.filter(m => !adapterMethodNames.includes(m));
        const extraInAdapter = adapterMethodNames.filter(m => !portMethodNames.includes(m));
        
        if (missingInAdapter.length > 0) {
          console.log(`   Missing in adapter: ${missingInAdapter.join(', ')}`);
        }
        if (extraInAdapter.length > 0) {
          console.log(`   Extra in adapter: ${extraInAdapter.join(', ')}`);
        }
      } else {
        console.log(`   ✅ Method counts match`);
      }
      
      // List endpoints
      if (port.endpoints && port.endpoints.length > 0) {
        console.log(`   Endpoints:`);
        port.endpoints.forEach(ep => console.log(`      - ${ep}`));
      }
    } else {
      console.log(`   ❌ No adapter found!`);
    }
    
    console.log();
  }
  
  // Issues summary
  const portsWithoutAdapters = ports.filter(p => !p.hasAdapter);
  const portsWithMismatch = ports.filter(p => 
    p.hasAdapter && p.methods.length !== p.adapterMethods?.length
  );
  
  if (portsWithoutAdapters.length > 0 || portsWithMismatch.length > 0) {
    console.log('⚠️  ISSUES FOUND');
    console.log('-'.repeat(80));
    
    if (portsWithoutAdapters.length > 0) {
      console.log(`Ports without adapters: ${portsWithoutAdapters.map(p => p.name).join(', ')}`);
    }
    
    if (portsWithMismatch.length > 0) {
      console.log(`Ports with method count mismatch: ${portsWithMismatch.map(p => p.name).join(', ')}`);
    }
    
    console.log();
  } else {
    console.log('✅ NO ISSUES FOUND - All ports have matching adapters with correct method counts');
    console.log();
  }
  
  // Export summary for validation scripts
  console.log('📄 EXPORT FOR VALIDATION');
  console.log('-'.repeat(80));
  console.log(`Total Ports: ${totalPorts}`);
  console.log(`Total Methods: ${totalPortMethods}`);
  console.log(`Total Endpoints: ${totalEndpoints}`);
  console.log();
  console.log('='.repeat(80));
}

// Run audit
const ports = auditPorts();
generateReport(ports);
