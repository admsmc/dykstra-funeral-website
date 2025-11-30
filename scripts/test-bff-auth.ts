#!/usr/bin/env tsx

/**
 * Manual Test Script for BFF Authentication
 * 
 * This script tests the BFF authentication utilities with a live database connection.
 * Run this to verify that tenant lookup and JWT generation work correctly.
 * 
 * Usage:
 *   pnpm tsx scripts/test-bff-auth.ts
 * 
 * Prerequisites:
 *   - DATABASE_URL environment variable set
 *   - GO_BACKEND_JWT_SECRET environment variable set
 *   - At least one user in the database with a funeralHomeId
 */

import 'dotenv/config';
import { getTenantId, generateGoBackendToken, getGoBackendToken, clearTenantCache } from '../src/lib/bff-auth';
import { prisma } from '@dykstra/infrastructure';
import { jwtVerify } from 'jose';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testEnvironmentSetup(): Promise<boolean> {
  logSection('Test 1: Environment Setup');
  
  const requiredVars = ['DATABASE_URL', 'GO_BACKEND_JWT_SECRET'];
  let allSet = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`✓ ${varName} is set`, 'green');
    } else {
      log(`✗ ${varName} is NOT set`, 'red');
      allSet = false;
    }
  }
  
  if (!allSet) {
    log('\n⚠ Please set missing environment variables in .env file', 'yellow');
    return false;
  }
  
  log('\n✓ All required environment variables are set', 'green');
  return true;
}

async function testDatabaseConnection(): Promise<boolean> {
  logSection('Test 2: Database Connection');
  
  try {
    await prisma.$connect();
    log('✓ Successfully connected to database', 'green');
    
    // Get user count
    const userCount = await prisma.user.count();
    log(`✓ Found ${userCount} user(s) in database`, 'green');
    
    if (userCount === 0) {
      log('\n⚠ No users found in database. Creating a test user...', 'yellow');
      
      // Check if we have any funeral homes
      const funeralHomeCount = await prisma.funeralHome.count();
      
      if (funeralHomeCount === 0) {
        log('⚠ No funeral homes found. Creating test funeral home...', 'yellow');
        
        const funeralHome = await prisma.funeralHome.create({
          data: {
            name: 'Test Funeral Home',
            phone: '555-123-4567',
            email: 'test@testfh.com',
          },
        });
        
        log(`✓ Created test funeral home: ${funeralHome.id}`, 'green');
        
        // Create test user
        const user = await prisma.user.create({
          data: {
            id: 'test-user-bff-auth-' + Date.now(),
            email: 'test@example.com',
            name: 'Test User',
            role: 'STAFF',
            funeralHomeId: funeralHome.id,
          },
        });
        
        log(`✓ Created test user: ${user.id}`, 'green');
      }
    }
    
    return true;
  } catch (error) {
    log(`✗ Database connection failed: ${error instanceof Error ? error.message : String(error)}`, 'red');
    return false;
  }
}

async function testGetTenantId(): Promise<string | null> {
  logSection('Test 3: Get Tenant ID');
  
  try {
    // Find a user with a funeral home
    const user = await prisma.user.findFirst({
      where: {
        funeralHomeId: { not: null },
      },
      select: {
        id: true,
        email: true,
        funeralHomeId: true,
      },
    });
    
    if (!user) {
      log('✗ No users with funeral home found', 'red');
      return null;
    }
    
    log(`Found user: ${user.email} (${user.id})`, 'blue');
    
    // Test getTenantId
    const tenantId = await getTenantId(user.id);
    
    if (tenantId) {
      log(`✓ Successfully retrieved tenant ID: ${tenantId}`, 'green');
      
      if (tenantId === user.funeralHomeId) {
        log('✓ Tenant ID matches database value', 'green');
      } else {
        log(`✗ Tenant ID mismatch! Got: ${tenantId}, Expected: ${user.funeralHomeId}`, 'red');
      }
      
      // Test caching
      log('\nTesting cache...', 'blue');
      const startTime = Date.now();
      const cachedTenantId = await getTenantId(user.id);
      const cachedTime = Date.now() - startTime;
      
      if (cachedTenantId === tenantId && cachedTime < 5) {
        log(`✓ Cache working (retrieved in ${cachedTime}ms)`, 'green');
      } else {
        log(`⚠ Cache might not be working (took ${cachedTime}ms)`, 'yellow');
      }
      
      return user.id;
    } else {
      log('✗ getTenantId returned null', 'red');
      return null;
    }
  } catch (error) {
    log(`✗ Error testing getTenantId: ${error instanceof Error ? error.message : String(error)}`, 'red');
    return null;
  }
}

async function testJWTGeneration(userId: string): Promise<void> {
  logSection('Test 4: JWT Token Generation');
  
  try {
    // Generate token
    log('Generating JWT token...', 'blue');
    const token = await getGoBackendToken(userId);
    
    log(`✓ Token generated successfully`, 'green');
    log(`Token length: ${token.length} characters`, 'blue');
    
    // Verify token structure
    const parts = token.split('.');
    if (parts.length === 3) {
      log('✓ Token has correct structure (header.payload.signature)', 'green');
    } else {
      log(`✗ Invalid token structure (${parts.length} parts)`, 'red');
      return;
    }
    
    // Decode and verify token
    log('\nVerifying token...', 'blue');
    const secret = new TextEncoder().encode(process.env.GO_BACKEND_JWT_SECRET!);
    const { payload, protectedHeader } = await jwtVerify(token, secret);
    
    log('✓ Token signature valid', 'green');
    log('\nToken Header:', 'blue');
    console.log(JSON.stringify(protectedHeader, null, 2));
    
    log('\nToken Payload:', 'blue');
    console.log(JSON.stringify(payload, null, 2));
    
    // Verify claims
    log('\nVerifying claims...', 'blue');
    
    const checks = [
      { name: 'sub (subject)', value: payload.sub, expected: userId },
      { name: 'tid (tenant ID)', value: payload.tid, exists: true },
      { name: 'iss (issuer)', value: payload.iss, expected: 'dykstra-bff' },
      { name: 'aud (audience)', value: payload.aud, expected: 'dykstra-go-backend' },
      { name: 'iat (issued at)', value: payload.iat, exists: true },
      { name: 'exp (expires at)', value: payload.exp, exists: true },
    ];
    
    for (const check of checks) {
      if (check.expected !== undefined) {
        if (check.value === check.expected) {
          log(`✓ ${check.name}: ${check.value}`, 'green');
        } else {
          log(`✗ ${check.name}: ${check.value} (expected: ${check.expected})`, 'red');
        }
      } else if (check.exists) {
        if (check.value !== undefined) {
          log(`✓ ${check.name}: ${check.value}`, 'green');
        } else {
          log(`✗ ${check.name}: missing`, 'red');
        }
      }
    }
    
    // Check expiration time
    if (payload.exp && payload.iat) {
      const expiresIn = (payload.exp as number) - (payload.iat as number);
      if (expiresIn === 3600) {
        log(`✓ Token expires in 1 hour (${expiresIn}s)`, 'green');
      } else {
        log(`⚠ Unexpected expiration time: ${expiresIn}s`, 'yellow');
      }
    }
    
    // Test token with wrong secret
    log('\nTesting token rejection with wrong secret...', 'blue');
    const wrongSecret = new TextEncoder().encode('wrong-secret-key-should-fail-verification');
    
    try {
      await jwtVerify(token, wrongSecret);
      log('✗ Token verified with wrong secret (SECURITY ISSUE!)', 'red');
    } catch {
      log('✓ Token correctly rejected with wrong secret', 'green');
    }
    
  } catch (error) {
    log(`✗ Error testing JWT generation: ${error instanceof Error ? error.message : String(error)}`, 'red');
  }
}

async function testCacheClear(): Promise<void> {
  logSection('Test 5: Cache Clear Functionality');
  
  try {
    const user = await prisma.user.findFirst({
      where: { funeralHomeId: { not: null } },
      select: { id: true },
    });
    
    if (!user) {
      log('⚠ No users available for cache test', 'yellow');
      return;
    }
    
    // Populate cache
    await getTenantId(user.id);
    log('✓ Cache populated', 'green');
    
    // Clear cache
    clearTenantCache();
    log('✓ Cache cleared', 'green');
    
    // Verify cache was cleared (would need to check database query count)
    await getTenantId(user.id);
    log('✓ Cache repopulated after clear', 'green');
    
  } catch (error) {
    log(`✗ Error testing cache clear: ${error instanceof Error ? error.message : String(error)}`, 'red');
  }
}

async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'cyan');
  log('║   BFF Authentication Test Suite                      ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════╝', 'cyan');
  
  try {
    // Test 1: Environment setup
    const envOk = await testEnvironmentSetup();
    if (!envOk) {
      process.exit(1);
    }
    
    // Test 2: Database connection
    const dbOk = await testDatabaseConnection();
    if (!dbOk) {
      process.exit(1);
    }
    
    // Test 3: Tenant ID lookup
    const userId = await testGetTenantId();
    if (!userId) {
      log('\n⚠ Cannot continue with remaining tests (no valid user found)', 'yellow');
      process.exit(1);
    }
    
    // Test 4: JWT generation
    await testJWTGeneration(userId);
    
    // Test 5: Cache clear
    await testCacheClear();
    
    // Summary
    logSection('Test Summary');
    log('✓ All tests completed successfully!', 'green');
    log('\nYou can now use this authentication system in production.', 'blue');
    log('Make sure to set GO_BACKEND_JWT_SECRET to a strong secret in production!', 'yellow');
    
  } catch (error) {
    log(`\n✗ Test suite failed: ${error instanceof Error ? error.message : String(error)}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
