import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { prisma } from '@dykstra/infrastructure';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      funeralHomeId: true,
    },
    take: 10,
  });

  console.log('\n=== Current Users in Database ===\n');
  
  if (users.length === 0) {
    console.log('No users found in database.');
  } else {
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Funeral Home ID: ${user.funeralHomeId || 'N/A'}`);
      console.log(`   User ID: ${user.id}`);
      console.log('');
    });
  }

  console.log('\n=== Staff Roles Required ===');
  console.log('To access staff dashboard, user role must be one of:');
  console.log('  - staff');
  console.log('  - director');
  console.log('  - funeral_director');
  console.log('  - admin');
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
