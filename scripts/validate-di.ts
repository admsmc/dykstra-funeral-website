#!/usr/bin/env tsx
/**
 * Dependency Injection Validation Script
 * 
 * Tests that all Effect services in the InfrastructureLayer can be resolved.
 * This catches DI configuration errors before runtime.
 * 
 * Run: pnpm validate:di
 */

import { Effect } from 'effect';
import { InfrastructureLayer } from '../packages/infrastructure/src/index';
import {
  CaseRepository,
  ContractRepository,
  PaymentRepository,
  PhotoRepository,
  TributeRepository,
  GuestbookRepository,
  InvitationRepository,
  NoteRepository,
  TaskRepository,
  AuditLogRepository,
  StaffRepository,
  ProductCatalogRepository,
  ServiceCatalogRepository,
  ContractTemplateRepository,
  StoragePort,
  EmailPort,
  SignaturePort,
  PaymentPort,
  EventPublisher,
} from '../packages/application/src/index';

/**
 * Service tags to test
 * Each critical service should be included here
 */
const servicesToTest = [
  // Repositories
  { name: 'CaseRepository', tag: CaseRepository },
  { name: 'ContractRepository', tag: ContractRepository },
  { name: 'PaymentRepository', tag: PaymentRepository },
  { name: 'PhotoRepository', tag: PhotoRepository },
  { name: 'TributeRepository', tag: TributeRepository },
  { name: 'GuestbookRepository', tag: GuestbookRepository },
  { name: 'InvitationRepository', tag: InvitationRepository },
  { name: 'NoteRepository', tag: NoteRepository },
  { name: 'TaskRepository', tag: TaskRepository },
  { name: 'AuditLogRepository', tag: AuditLogRepository },
  { name: 'StaffRepository', tag: StaffRepository },
  { name: 'ProductCatalogRepository', tag: ProductCatalogRepository },
  { name: 'ServiceCatalogRepository', tag: ServiceCatalogRepository },
  { name: 'ContractTemplateRepository', tag: ContractTemplateRepository },
  
  // Ports (external services)
  { name: 'StoragePort', tag: StoragePort },
  { name: 'EmailPort', tag: EmailPort },
  { name: 'SignaturePort', tag: SignaturePort },
  { name: 'PaymentPort', tag: PaymentPort },
  { name: 'EventPublisher', tag: EventPublisher },
];

/**
 * Test that a service can be resolved from the infrastructure layer
 */
async function testService(name: string, tag: any): Promise<boolean> {
  const testEffect = Effect.gen(function* (_) {
    const service = yield* _(tag);
    return service !== null && service !== undefined;
  });

  try {
    const result = await Effect.runPromise(
      Effect.provide(testEffect, InfrastructureLayer)
    );
    
    if (result) {
      console.log(`✅ ${name.padEnd(30)} - resolved successfully`);
      return true;
    } else {
      console.error(`❌ ${name.padEnd(30)} - resolved to null/undefined`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${name.padEnd(30)} - failed to resolve:`);
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Run all DI validation tests
 */
async function main() {
  console.log('🔍 Validating Dependency Injection Configuration...\n');
  console.log('Testing InfrastructureLayer service resolution:\n');

  const results = await Promise.all(
    servicesToTest.map(({ name, tag }) => testService(name, tag))
  );

  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✅ All dependency injection tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some services failed to resolve. Fix the issues above.\n');
    console.log('Common causes:');
    console.log('  - Missing service in InfrastructureLayer');
    console.log('  - Layer.effect() without providing dependencies');
    console.log('  - Circular dependencies between services');
    console.log('  - Service tag imported incorrectly\n');
    process.exit(1);
  }
}

// Run validation
main().catch((error) => {
  console.error('\n❌ Fatal error during DI validation:\n');
  console.error(error);
  process.exit(1);
});
