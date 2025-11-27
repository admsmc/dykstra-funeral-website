import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { prisma } from '@dykstra/infrastructure';

async function main() {
  console.log('\n🔍 Checking user roles in database...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (users.length === 0) {
    console.log('No users found in database.');
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   User ID: ${user.id}`);
    
    // Check if role is in correct format
    const validRoles = ['FAMILY_PRIMARY', 'FAMILY_MEMBER', 'STAFF', 'DIRECTOR', 'FUNERAL_DIRECTOR', 'ADMIN'];
    if (!validRoles.includes(user.role)) {
      console.log(`   ⚠️  WARNING: Role "${user.role}" is not a valid uppercase enum value!`);
    }
    console.log('');
  });

  console.log('\n💡 To update a user role to uppercase:');
  console.log('   npx prisma studio');
  console.log('   Or use SQL: UPDATE users SET role = \'ADMIN\' WHERE email = \'user@example.com\';');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
