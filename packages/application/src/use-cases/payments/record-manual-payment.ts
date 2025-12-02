import { Effect } from 'effect';
import { Payment, ValidationError, type BusinessRuleViolationError, type InvalidStateTransitionError, type NotFoundError } from '@dykstra/domain';
import { PaymentRepository, type PersistenceError } from '../../ports/payment-repository';
import { PaymentManagementPolicyRepository, type PaymentManagementPolicyRepositoryService } from '../../ports/payment-management-policy-repository';
import type { PaymentMethod } from '@dykstra/shared';
import { randomUUID } from 'crypto';

/**
 * Record Manual Payment
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: PaymentManagementPolicy
 * Persisted In: PaymentManagementPolicyRepository
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 6+ tests
 * Last Updated: Phase 2.1
 */

export interface RecordManualPaymentCommand {
  readonly caseId: string;
  readonly funeralHomeId: string;
  readonly amount: number;
  readonly method: Extract<PaymentMethod, 'cash' | 'check' | 'ach'>;
  readonly checkNumber?: string;
  readonly paymentDate?: Date;
  readonly notes?: string;
  readonly recordedBy: string;
}

export interface RecordManualPaymentResult {
  payment: Payment;
  requiresApproval: boolean;
}

/**
 * Record manual payment use case
 * Creates a new payment record for manual payments
 *
 * Uses PaymentManagementPolicy to enforce:
 * - Payment method enablement (cash, check, ACH)
 * - Approval threshold requirements
 * - Check payment requirements (number, date, age)
 * - Per-funeral-home configuration
 *
 * Business rules:
 * - Amount must be positive
 * - Check payments validated per policy
 * - Payment marked as 'succeeded' if auto-approved
 * - Marked as 'pending_approval' if approval required
 * - Creates SCD2 version 1 record
 *
 * Clean Architecture:
 * - Loads policy first, validates against it
 * - Depends on PaymentRepository and PaymentManagementPolicyRepository
 * - Business logic in domain entity (Payment.create)
 * - Returns Effect for error handling
 */
export const recordManualPayment = (
  command: RecordManualPaymentCommand
): Effect.Effect<
  RecordManualPaymentResult,
  ValidationError | NotFoundError | BusinessRuleViolationError | InvalidStateTransitionError | PersistenceError,
  PaymentRepository | PaymentManagementPolicyRepositoryService
> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    const policyRepo = yield* _(PaymentManagementPolicyRepository);

    // Load policy for this funeral home
    const policy = yield* _(policyRepo.findByFuneralHome(command.funeralHomeId));

    // Validate policy is active
    if (!policy.isCurrent) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: 'Payment policy is not active',
          field: 'policy',
        })
      ));
    }

    // Validate payment method is enabled in policy
    if (!policy.allowedPaymentMethods.includes(command.method)) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: `Payment method '${command.method}' is not enabled in policy`,
          field: 'method',
        })
      ));
    }

    // Validate specific payment method requirements
    if (command.method === 'cash' && !policy.enableCashPayments) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: 'Cash payments are not enabled',
          field: 'method',
        })
      ));
    }

    if (command.method === 'check') {
      if (!policy.enableCheckPayments) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Check payments are not enabled',
            field: 'method',
          })
        ));
      }

      // Validate check-specific requirements
      if (policy.requireCheckNumber && !command.checkNumber) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Check number is required',
            field: 'checkNumber',
          })
        ));
      }

      if (policy.requireCheckDate && !command.paymentDate) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Check date is required',
            field: 'paymentDate',
          })
        ));
      }

      // Validate check age
      if (command.paymentDate) {
        const checkAgeDays = Math.floor(
          (new Date().getTime() - command.paymentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (checkAgeDays > policy.maxCheckAgeDays) {
          return yield* _(Effect.fail(
            new ValidationError({
              message: `Check is older than ${policy.maxCheckAgeDays} days`,
              field: 'paymentDate',
            })
          ));
        }
      }

      // Validate post-dated checks
      if (command.paymentDate && command.paymentDate > new Date() && !policy.allowPostDatedChecks) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Post-dated checks are not allowed',
            field: 'paymentDate',
          })
        ));
      }
    }

    if (command.method === 'ach' && !policy.enableAchPayments) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: 'ACH payments are not enabled',
          field: 'method',
        })
      ));
    }

    // Build notes with check number if applicable
    let notes = command.notes ?? '';
    if (command.method === 'check' && command.checkNumber) {
      notes = `Check #${command.checkNumber}${notes ? ` - ${notes}` : ''}`;
    }

    const businessKey = randomUUID();
    const id = randomUUID();

    // Create payment using domain logic
    const payment = yield* _(Payment.create({
      id,
      businessKey,
      caseId: command.caseId,
      amount: command.amount,
      method: command.method,
      notes,
      createdBy: command.recordedBy,
    }));

    // Determine if payment requires approval based on policy
    let requiresApproval = false;

    // Check approval requirements based on payment method
    if (command.method === 'check' && policy.requireApprovalForAllChecks) {
      requiresApproval = true;
    } else if (command.method === 'ach' && policy.requireApprovalForAllAch) {
      requiresApproval = true;
    } else if (command.amount > policy.requireApprovalAboveAmount) {
      requiresApproval = true;
    }

    // Mark payment as succeeded if auto-approved, otherwise pending approval
    let finalPayment: Payment;
    if (requiresApproval) {
      finalPayment = payment;
    } else {
      // Auto-approve payment if below threshold and not requiring special approval
      finalPayment = yield* _(payment.markSucceeded('auto_approved_by_policy'));
    }

    // Save to repository (SCD2: creates version 1)
    yield* _(paymentRepo.save(finalPayment));

    return {
      payment: finalPayment,
      requiresApproval,
    };
  });
