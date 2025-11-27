#!/usr/bin/env node
/**
 * Environment Variable Validation
 * Checks required env vars exist and validates format
 * Prevents runtime crashes due to missing configuration
 */

// Load .env.local if it exists
const fs = require('fs');
const path = require('path');
const rootDir = path.join(__dirname, '..');

const envLocalPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

const requiredEnvVars = {
  // Database
  'DATABASE_URL': {
    required: true,
    pattern: /^postgresql:\/\//,
    description: 'PostgreSQL connection string'
  },
  
  // Clerk Authentication
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': {
    required: true,
    pattern: /^pk_/,
    description: 'Clerk publishable key'
  },
  'CLERK_SECRET_KEY': {
    required: true,
    pattern: /^sk_/,
    description: 'Clerk secret key'
  },
};

const optionalEnvVars = {
  // AWS S3 (optional - falls back to local storage)
  'AWS_ACCESS_KEY_ID': {
    pattern: /^[A-Z0-9]{20}$/,
    description: 'AWS access key ID'
  },
  'AWS_SECRET_ACCESS_KEY': {
    pattern: /.{40}/,
    description: 'AWS secret access key'
  },
  'AWS_REGION': {
    pattern: /^[a-z]{2}-[a-z]+-\d$/,
    description: 'AWS region (e.g., us-east-1)'
  },
  'AWS_S3_BUCKET': {
    pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    description: 'S3 bucket name'
  },
  
  // Stripe (optional for payments)
  'STRIPE_SECRET_KEY': {
    pattern: /^sk_(test|live)_/,
    description: 'Stripe secret key'
  },
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': {
    pattern: /^pk_(test|live)_/,
    description: 'Stripe publishable key'
  },
  
  // Email (optional)
  'SENDGRID_API_KEY': {
    pattern: /^SG\./,
    description: 'SendGrid API key'
  },
};

let hasErrors = false;
let hasWarnings = false;

console.log('🔍 Checking environment variables...\n');

// Check required variables
console.log('Required Variables:');
for (const [key, config] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  
  if (!value) {
    console.error(`❌ ${key} - MISSING`);
    console.error(`   Description: ${config.description}`);
    hasErrors = true;
  } else if (config.pattern && !config.pattern.test(value)) {
    console.error(`❌ ${key} - INVALID FORMAT`);
    console.error(`   Description: ${config.description}`);
    console.error(`   Expected pattern: ${config.pattern}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${key}`);
  }
}

// Check optional variables
console.log('\nOptional Variables:');
for (const [key, config] of Object.entries(optionalEnvVars)) {
  const value = process.env[key];
  
  if (!value) {
    console.log(`⚪ ${key} - Not set (${config.description})`);
  } else if (config.pattern && !config.pattern.test(value)) {
    console.warn(`⚠️  ${key} - INVALID FORMAT`);
    console.warn(`   Description: ${config.description}`);
    console.warn(`   Expected pattern: ${config.pattern}`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${key}`);
  }
}

// Check for common mistakes
console.log('\nCommon Issues:');

if (fs.existsSync(path.join(rootDir, '.env')) && !fs.existsSync(path.join(rootDir, '.env.local'))) {
  console.warn('⚠️  Using .env instead of .env.local');
  console.warn('   Next.js loads .env.local first. Consider renaming .env to .env.local');
  hasWarnings = true;
}

// Check if DATABASE_URL points to production in development
if (process.env['NODE_ENV'] !== 'production' && process.env['DATABASE_URL']?.includes('prod')) {
  console.error('❌ DATABASE_URL appears to point to production in development!');
  console.error('   This could cause accidental production data modification');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('\n❌ Environment validation FAILED');
  console.error('   Fix the errors above before running the application\n');
  process.exit(1);
}

if (hasWarnings) {
  console.warn('\n⚠️  Environment validation completed with warnings');
  console.warn('   Review warnings above\n');
  process.exit(0);
}

console.log('\n✅ Environment validation PASSED\n');
