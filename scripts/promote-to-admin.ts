#!/usr/bin/env tsx
/**
 * Promote User to Admin
 * 
 * This script promotes a user to ADMIN role for testing.
 * 
 * Run: npx tsx scripts/promote-to-admin.ts <email>
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: npx tsx scripts/promote-to-admin.ts <email>');
  console.error('   Example: npx tsx scripts/promote-to-admin.ts user@example.com');
  process.exit(1);
}

// Create Prisma client with adapter
const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`\n🔐 Promoting ${email} to ADMIN role...\n`);

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.error('   Make sure the email is correct and the user exists.');
      process.exit(1);
    }

    console.log('Found user:');
    console.log(`  Name:  ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Current role: ${user.role}`);
    console.log('');

    if (user.role === 'ADMIN') {
      console.log('✅ User already has ADMIN role!');
      return;
    }

    // Update to ADMIN
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });

    console.log('✅ User promoted to ADMIN successfully!');
    console.log('');
    console.log('You can now:');
    console.log('  1. Restart the dev server');
    console.log('  2. Sign in with this user');
    console.log('  3. Access the staff dashboard');
    console.log('');

  } catch (error) {
    console.error('\n❌ Failed to promote user:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
