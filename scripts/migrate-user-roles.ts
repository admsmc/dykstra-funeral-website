#!/usr/bin/env tsx
/**
 * Migrate User Roles to Uppercase
 * 
 * This script updates all user roles in the database from lowercase
 * to uppercase to match the Prisma schema enum values.
 * 
 * Run: npx tsx scripts/migrate-user-roles.ts
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
  console.error('   Make sure .env.local exists with DATABASE_URL');
  process.exit(1);
}

// Create Prisma client with adapter
const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Role mapping from old lowercase to new uppercase
const roleMapping: Record<string, string> = {
  'family_primary': 'FAMILY_PRIMARY',
  'family_member': 'FAMILY_MEMBER',
  'staff': 'STAFF',
  'director': 'DIRECTOR',
  'funeral_director': 'FUNERAL_DIRECTOR',
  'admin': 'ADMIN',
};

async function main() {
  console.log('\n🔄 Migrating user roles to uppercase...\n');

  try {
    // Get all users with their current roles
    const users = await prisma.$queryRaw<Array<{ id: string; email: string; role: string }>>`
      SELECT id, email, role FROM users
    `;

    if (users.length === 0) {
      console.log('No users found in database.');
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const currentRole = user.role;
      const newRole = roleMapping[currentRole.toLowerCase()] || currentRole;

      console.log(`${user.email}:`);
      console.log(`  Current role: ${currentRole}`);

      if (currentRole === newRole) {
        console.log(`  ✓ Already correct (${newRole})`);
        skippedCount++;
      } else {
        console.log(`  → Updating to: ${newRole}`);
        
        // Update the role using raw SQL to bypass Prisma enum validation
        await prisma.$executeRaw`
          UPDATE users 
          SET role = ${newRole}::text::"UserRole"
          WHERE id = ${user.id}
        `;
        
        console.log(`  ✅ Updated`);
        updatedCount++;
      }
      console.log('');
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total:   ${users.length}`);
    
    if (updatedCount > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   You can now restart the dev server.');
    } else {
      console.log('\n✅ All roles already in correct format.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
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
