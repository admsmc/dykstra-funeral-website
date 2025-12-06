import { Effect } from 'effect';
import { PaymentManagementPolicy } from '@dykstra/domain';
import { PaymentManagementPolicyRepository, type PaymentManagementPolicyRepositoryService } from '@dykstra/application';
import { randomUUID } from 'crypto';

/**
 * Payment Management Policy Seeder
 * 
 * Seeds a default payment management policy for development/testing.
 * This ensures that recordManualPayment use case has a policy to validate against.
 * 
 * In production, policies would be created via admin UI or migration scripts.
 */

/**
 * Default permissive payment policy
 * Allows all payment methods with reasonable defaults
 */
export const createDefaultPaymentPolicy = (funeralHomeId: string = 'default'): PaymentManagementPolicy => 
  new PaymentManagementPolicy({
    id: randomUUID(),
    businessKey: randomUUID(),
    funeralHomeId,
    version: 1,
    isCurrent: true,
    validFrom: new Date(),
    validTo: null,
    
    // Approval thresholds
    requireApprovalAboveAmount: 10000, // $10,000
    autoApproveUpToAmount: 5000,
    requireApprovalForAllChecks: false,
    requireApprovalForAllAch: false,
    
    // Allow all payment methods
    allowedPaymentMethods: ['cash', 'check', 'ach', 'credit_card'],
    enableCashPayments: true,
    enableCheckPayments: true,
    enableAchPayments: true,
    enableCreditCard: false,
    
    // Check payment rules
    requireCheckNumber: true,
    requireCheckDate: true,
    allowPostDatedChecks: false,
    maxCheckAgeDays: 180, // 6 months
    
    // Refund policies
    allowRefunds: true,
    maxRefundDays: 90,
    requireOriginalPaymentProof: true,
    requireRefundApproval: true,
    refundApprovalThreshold: 1000,
    
    // ACH configuration
    requireAchVerification: true,
    maxAchRetries: 3,
    achRetryDelayHours: 24,
    
    // Record retention
    retentionDays: 2555, // ~7 years
    archivePaymentsAfterDays: 365,
    enablePaymentHistory: true,
    
    // Aging & AR reporting
    agingBuckets: [30, 60, 90, 120],
    markOverdueAfterDays: 30,
    calculateInterestOnOverdue: false,
    interestRate: 0.0,
    
    // Stats & aggregation
    statsCalculationMethod: 'sum',
    defaultPageSize: 25,
    listDefaultSortOrder: 'desc',
    
    // Email notifications
    enablePaymentNotifications: true,
    sendReceiptForAmountOver: 0,
    paymentReminderDaysBefore: 7,
    
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system-seed',
    updatedBy: null,
    reason: 'Default policy seed',
  });

/**
 * Seed default payment policy for a funeral home
 * 
 * Effect-based function that checks if policy exists and creates if missing.
 * Safe to call multiple times - will not create duplicates.
 */
export const seedDefaultPaymentPolicy = (
  funeralHomeId: string = 'default'
): Effect.Effect<void, never, PaymentManagementPolicyRepositoryService> =>
  Effect.gen(function* () {
    const policyRepo = yield* PaymentManagementPolicyRepository;
    
    // Check if policy already exists
    const existingPolicy = yield* Effect.either(
      policyRepo.findByFuneralHome(funeralHomeId)
    );
    
    // Only create if doesn't exist
    if (existingPolicy._tag === 'Left') {
      const defaultPolicy = createDefaultPaymentPolicy(funeralHomeId);
      // Catch and ignore any save errors - this is a best-effort seed
      yield* Effect.catchAll(
        policyRepo.save(defaultPolicy),
        (error) => {
          console.error(`Failed to seed policy for ${funeralHomeId}:`, error);
          return Effect.void;
        }
      );
      console.log(`✅ Seeded default payment policy for funeral home: ${funeralHomeId}`);
    } else {
      console.log(`ℹ️  Payment policy already exists for funeral home: ${funeralHomeId}`);
    }
  });

/**
 * Seed policies for multiple funeral homes
 */
export const seedPaymentPoliciesForFuneralHomes = (
  funeralHomeIds: string[]
): Effect.Effect<void, never, PaymentManagementPolicyRepositoryService> =>
  Effect.gen(function* () {
    for (const funeralHomeId of funeralHomeIds) {
      yield* seedDefaultPaymentPolicy(funeralHomeId);
    }
  });
