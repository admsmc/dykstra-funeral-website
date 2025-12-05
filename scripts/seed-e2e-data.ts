#!/usr/bin/env tsx
/**
 * E2E Database Seeding Script
 * 
 * Seeds the database with test data for Playwright E2E tests.
 * Run before E2E tests to ensure consistent test data.
 * 
 * Usage:
 *   pnpm seed:e2e        # Seed test data
 *   pnpm seed:e2e:clean  # Clean and re-seed
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const E2E_USER_ID = 'test-user-playwright';
const E2E_FUNERAL_HOME_ID = 'test-funeral-home-e2e';

async function cleanE2EData() {
  console.log('🧹 Cleaning existing E2E test data...');
  
  // Delete in order to respect foreign key constraints
  await prisma.payment.deleteMany({ where: { createdBy: E2E_USER_ID } });
  await prisma.contract.deleteMany({ where: { createdBy: E2E_USER_ID } });
  await prisma.task.deleteMany({ where: { assignedTo: E2E_USER_ID } });
  await prisma.case.deleteMany({ where: { funeralHomeId: E2E_FUNERAL_HOME_ID } });
  await prisma.contractTemplate.deleteMany({ where: { funeralHomeId: E2E_FUNERAL_HOME_ID } });
  await prisma.user.deleteMany({ where: { id: E2E_USER_ID } });
  await prisma.funeralHome.deleteMany({ where: { id: E2E_FUNERAL_HOME_ID } });
  
  console.log('✅ Cleaned E2E test data');
}

async function seedFuneralHome() {
  console.log('🏢 Creating test funeral home...');
  
  const funeralHome = await prisma.funeralHome.create({
    data: {
      id: E2E_FUNERAL_HOME_ID,
      name: 'E2E Test Funeral Home',
      address: '123 Test Street',
      city: 'Testville',
      state: 'TS',
      zip: '12345',
      phone: '555-0100',
      email: 'test@e2e-funeral.test',
      website: 'https://e2e-test.funeral.test',
    },
  });
  
  console.log('✅ Created funeral home:', funeralHome.name);
  return funeralHome;
}

async function seedTestUser() {
  console.log('👤 Creating test user...');
  
  const user = await prisma.user.create({
    data: {
      id: E2E_USER_ID,
      email: 'test@playwright.dev',
      name: 'E2E Test User',
      role: 'STAFF',
      funeralHomeId: E2E_FUNERAL_HOME_ID,
    },
  });
  
  console.log('✅ Created test user:', user.email);
  return user;
}


async function seedCases() {
  console.log('📁 Creating test cases...');
  
  const cases = await Promise.all([
    // Active case
    prisma.case.create({
      data: {
        id: 'case-e2e-001',
        businessKey: 'CASE-E2E-001',
        funeralHomeId: E2E_FUNERAL_HOME_ID,
        decedentName: 'John Doe',
        decedentDateOfBirth: new Date('1945-06-15'),
        decedentDateOfDeath: new Date('2024-12-01'),
        type: 'AT_NEED',
        status: 'ACTIVE',
        serviceType: 'TRADITIONAL_BURIAL',
        serviceDate: new Date('2024-12-05'),
        version: 1,
        isCurrent: true,
        validFrom: new Date(),
        createdBy: E2E_USER_ID,
      },
    }),
    // Completed case
    prisma.case.create({
      data: {
        id: 'case-e2e-002',
        businessKey: 'CASE-E2E-002',
        funeralHomeId: E2E_FUNERAL_HOME_ID,
        decedentName: 'Jane Smith',
        decedentDateOfBirth: new Date('1950-03-20'),
        decedentDateOfDeath: new Date('2024-11-15'),
        type: 'AT_NEED',
        status: 'COMPLETED',
        serviceType: 'TRADITIONAL_CREMATION',
        serviceDate: new Date('2024-11-20'),
        version: 1,
        isCurrent: true,
        validFrom: new Date(),
        createdBy: E2E_USER_ID,
      },
    }),
    // Pre-need case
    prisma.case.create({
      data: {
        id: 'case-e2e-003',
        businessKey: 'CASE-E2E-003',
        funeralHomeId: E2E_FUNERAL_HOME_ID,
        decedentName: 'Robert Johnson',
        decedentDateOfBirth: new Date('1955-08-10'),
        type: 'PRE_NEED',
        status: 'INQUIRY',
        serviceType: 'MEMORIAL_SERVICE',
        version: 1,
        isCurrent: true,
        validFrom: new Date(),
        createdBy: E2E_USER_ID,
      },
    }),
  ]);
  
  console.log(`✅ Created ${cases.length} test cases`);
  return cases;
}

async function seedContracts(cases: any[]) {
  console.log('📄 Creating test contracts...');
  
  const contracts = await Promise.all([
    prisma.contract.create({
      data: {
        id: 'contract-e2e-001',
        businessKey: 'CONTRACT-E2E-001',
        caseId: cases[0].id,
        contractVersion: 1,
        status: 'PENDING_SIGNATURES',
        services: [],
        products: [],
        subtotal: 8500.0,
        tax: 510.0,
        totalAmount: 9010.0,
        termsAndConditions: 'Standard funeral service terms and conditions.',
        temporalVersion: 1,
        isCurrent: true,
        validFrom: new Date(),
        createdBy: E2E_USER_ID,
      },
    }),
    prisma.contract.create({
      data: {
        id: 'contract-e2e-002',
        businessKey: 'CONTRACT-E2E-002',
        caseId: cases[1].id,
        contractVersion: 1,
        status: 'FULLY_SIGNED',
        services: [],
        products: [],
        subtotal: 4200.0,
        tax: 252.0,
        totalAmount: 4452.0,
        termsAndConditions: 'Cremation service terms and conditions.',
        temporalVersion: 1,
        isCurrent: true,
        validFrom: new Date(),
        createdBy: E2E_USER_ID,
      },
    }),
  ]);
  
  console.log(`✅ Created ${contracts.length} test contracts`);
  return contracts;
}

async function seedPayments(cases: any[]) {
  console.log('💰 Creating test payments...');
  
  const payments = await Promise.all([
    // Successful payment
    prisma.payment.create({
      data: {
        id: 'payment-e2e-001',
        businessKey: 'PAY-E2E-001',
        caseId: cases[1].id,
        amount: 4452.0,
        method: 'CREDIT_CARD',
        status: 'SUCCEEDED',
        version: 1,
        isCurrent: true,
        validFrom: new Date('2024-11-20'),
        createdBy: E2E_USER_ID,
      },
    }),
    // Pending payment
    prisma.payment.create({
      data: {
        id: 'payment-e2e-002',
        businessKey: 'PAY-E2E-002',
        caseId: cases[0].id,
        amount: 2000.0,
        method: 'CHECK',
        status: 'PENDING',
        version: 1,
        isCurrent: true,
        validFrom: new Date('2024-12-01'),
        createdBy: E2E_USER_ID,
      },
    }),
    // Partial payment
    prisma.payment.create({
      data: {
        id: 'payment-e2e-003',
        businessKey: 'PAY-E2E-003',
        caseId: cases[0].id,
        amount: 3000.0,
        method: 'ACH',
        status: 'SUCCEEDED',
        version: 1,
        isCurrent: true,
        validFrom: new Date('2024-12-02'),
        createdBy: E2E_USER_ID,
      },
    }),
  ]);
  
  console.log(`✅ Created ${payments.length} test payments`);
  return payments;
}

async function seedTemplates() {
  console.log('📋 Creating test templates...');
  
  const templates = await Promise.all([
    prisma.contractTemplate.create({
      data: {
        id: 'template-e2e-001',
        name: 'Standard Funeral Service Agreement',
        description: 'Traditional funeral service contract template',
        funeralHomeId: E2E_FUNERAL_HOME_ID,
        content: 'This agreement is entered into between {{funeral_home_name}} and {{family_name}}...',
        isDefault: true,
        isActive: true,
        createdBy: E2E_USER_ID,
      },
    }),
    prisma.contractTemplate.create({
      data: {
        id: 'template-e2e-002',
        name: 'Cremation Service Agreement',
        description: 'Cremation service contract template',
        funeralHomeId: E2E_FUNERAL_HOME_ID,
        content: 'This cremation service agreement is between {{funeral_home_name}} and {{family_name}}...',
        isDefault: false,
        isActive: true,
        createdBy: E2E_USER_ID,
      },
    }),
    prisma.contractTemplate.create({
      data: {
        id: 'template-e2e-003',
        name: 'Pre-Planning Agreement',
        description: 'Pre-need planning contract template',
        funeralHomeId: E2E_FUNERAL_HOME_ID,
        content: 'This pre-planning agreement is between {{funeral_home_name}} and {{client_name}}...',
        isDefault: false,
        isActive: true,
        createdBy: E2E_USER_ID,
      },
    }),
  ]);
  
  console.log(`✅ Created ${templates.length} test templates`);
  return templates;
}

async function seedTasks(cases: any[]) {
  console.log('✅ Creating test tasks...');
  
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        id: 'task-e2e-001',
        caseId: cases[0].id,
        title: 'Complete death certificate',
        description: 'File death certificate with county clerk',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        assignedTo: E2E_USER_ID,
        createdBy: E2E_USER_ID,
      },
    }),
    prisma.task.create({
      data: {
        id: 'task-e2e-002',
        caseId: cases[0].id,
        title: 'Order flowers',
        description: 'Contact florist for service arrangements',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        assignedTo: E2E_USER_ID,
        createdBy: E2E_USER_ID,
      },
    }),
    prisma.task.create({
      data: {
        id: 'task-e2e-003',
        caseId: cases[1].id,
        title: 'Schedule service',
        description: 'Confirm service time with family',
        status: 'COMPLETED',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        completedAt: new Date(),
        assignedTo: E2E_USER_ID,
        createdBy: E2E_USER_ID,
      },
    }),
  ]);
  
  console.log(`✅ Created ${tasks.length} test tasks`);
  return tasks;
}

async function main() {
  try {
    console.log('🌱 Starting E2E database seeding...\n');
    
    const shouldClean = process.argv.includes('--clean');
    
    if (shouldClean) {
      await cleanE2EData();
      console.log('');
    }
    
    // Seed in order (respecting foreign key constraints)
    const funeralHome = await seedFuneralHome();
    const user = await seedTestUser();
    const templates = await seedTemplates();
    const cases = await seedCases();
    const contracts = await seedContracts(cases);
    const payments = await seedPayments(cases);
    const tasks = await seedTasks(cases);
    
    console.log('\n✨ E2E database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Funeral Home: ${funeralHome.name}`);
    console.log(`   - Test User: ${user.email}`);
    console.log(`   - Templates: ${templates.length}`);
    console.log(`   - Cases: ${cases.length}`);
    console.log(`   - Contracts: ${contracts.length}`);
    console.log(`   - Payments: ${payments.length}`);
    console.log(`   - Tasks: ${tasks.length}`);
    console.log('');
    console.log('🧪 Ready for E2E tests!');
    
  } catch (error) {
    console.error('❌ Error seeding E2E data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
