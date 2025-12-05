#!/usr/bin/env tsx
/**
 * Extract Adapter Method Signatures
 * 
 * This script extracts method signatures from Go adapters to help generate
 * complete port interface definitions.
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const PORTS_DIR = join(process.cwd(), 'packages/application/src/ports');
const ADAPTERS_DIR = join(process.cwd(), 'packages/infrastructure/src/adapters/go-backend');

interface MethodSignature {
  name: string;
  fullSignature: string;
}

interface ModuleInfo {
  name: string;
  portFile: string;
  adapterFile: string;
  portMethods: string[];
  adapterMethods: MethodSignature[];
  missingMethods: MethodSignature[];
}

function extractAdapterMethodSignatures(fileContent: string): MethodSignature[] {
  const methods: MethodSignature[] = [];
  
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
  
  // Split by method boundaries (look for pattern: methodName: (params) =>)
  const methodPattern = /(\w+):\s*\([^)]*\)\s*=>/g;
  let match;
  const methodStarts: Array<{ name: string; index: number }> = [];
  
  while ((match = methodPattern.exec(adapterBody)) !== null) {
    const methodName = match[1];
    if (methodName !== 'try' && methodName !== 'catch') {
      methodStarts.push({ name: methodName, index: match.index });
    }
  }
  
  // Extract full signatures
  for (let i = 0; i < methodStarts.length; i++) {
    const current = methodStarts[i];
    const next = methodStarts[i + 1];
    
    const methodStart = current.index;
    const methodEnd = next ? next.index : adapterBody.length;
    
    let methodBody = adapterBody.slice(methodStart, methodEnd);
    
    // Clean up the method body - extract just the signature line
    const signatureMatch = methodBody.match(/^(\w+):\s*\(([^)]*)\)\s*=>/);
    if (signatureMatch) {
      const name = signatureMatch[1];
      const params = signatureMatch[2].trim();
      
      // Try to determine return type from Effect.tryPromise calls
      const effectMatch = methodBody.match(/Effect\.tryPromise<([^>]+)>/);
      const returnType = effectMatch ? effectMatch[1] : 'any';
      
      const signature = params
        ? `readonly ${name}: (${params}) => Effect.Effect<${returnType}, NetworkError>;`
        : `readonly ${name}: () => Effect.Effect<${returnType}, NetworkError>;`;
      
      methods.push({
        name,
        fullSignature: signature
      });
    }
  }
  
  return methods;
}

function extractPortMethods(fileContent: string): string[] {
  const methods: string[] = [];
  
  // Extract methods from port interface
  const interfaceMatch = fileContent.match(/export interface \w+Service\s*{([^}]+)}/);
  if (!interfaceMatch) return methods;
  
  const interfaceBody = interfaceMatch[1];
  const methodPattern = /readonly\s+(\w+):/g;
  let match;
  
  while ((match = methodPattern.exec(interfaceBody)) !== null) {
    methods.push(match[1]);
  }
  
  return methods;
}

function analyzeModules(): ModuleInfo[] {
  const portFiles = readdirSync(PORTS_DIR)
    .filter(f => f.startsWith('go-') && f.endsWith('-port.ts'))
    .sort();
  
  const modules: ModuleInfo[] = [];
  
  for (const portFile of portFiles) {
    const moduleName = portFile.replace('go-', '').replace('-port.ts', '');
    const adapterFile = portFile.replace('-port.ts', '-adapter.ts');
    
    const portPath = join(PORTS_DIR, portFile);
    const adapterPath = join(ADAPTERS_DIR, adapterFile);
    
    const portContent = readFileSync(portPath, 'utf-8');
    const adapterContent = readFileSync(adapterPath, 'utf-8');
    
    const portMethods = extractPortMethods(portContent);
    const adapterMethods = extractAdapterMethodSignatures(adapterContent);
    
    const missingMethods = adapterMethods.filter(
      am => !portMethods.includes(am.name)
    );
    
    if (missingMethods.length > 0) {
      modules.push({
        name: moduleName,
        portFile,
        adapterFile,
        portMethods,
        adapterMethods,
        missingMethods
      });
    }
  }
  
  return modules;
}

function generateReport(modules: ModuleInfo[]): void {
  console.log('='.repeat(80));
  console.log('MISSING PORT INTERFACE METHODS');
  console.log('='.repeat(80));
  console.log();
  
  for (const module of modules) {
    console.log(`📦 ${module.name.toUpperCase()}`);
    console.log(`   Port: ${module.portFile}`);
    console.log(`   Adapter: ${module.adapterFile}`);
    console.log(`   Port Methods: ${module.portMethods.length}`);
    console.log(`   Adapter Methods: ${module.adapterMethods.length}`);
    console.log(`   Missing: ${module.missingMethods.length}`);
    console.log();
    console.log('   Missing methods to add to port interface:');
    console.log();
    
    for (const method of module.missingMethods) {
      console.log(`   ${method.fullSignature}`);
    }
    
    console.log();
    console.log('-'.repeat(80));
    console.log();
  }
  
  // Summary
  const totalMissing = modules.reduce((sum, m) => sum + m.missingMethods.length, 0);
  console.log(`📊 SUMMARY: ${totalMissing} methods missing across ${modules.length} modules`);
  console.log('='.repeat(80));
}

// Run analysis
const modules = analyzeModules();
generateReport(modules);

// Generate output file for reference
const outputPath = join(process.cwd(), 'scripts/missing-port-methods.json');
writeFileSync(outputPath, JSON.stringify(modules, null, 2));
console.log(`\n✅ Detailed analysis written to: ${outputPath}`);
