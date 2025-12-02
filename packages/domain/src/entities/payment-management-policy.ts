import { Data } from 'effect';

/**
 * Payment Management Policy
 *
 * SCD Type 2: Tracks historical policy changes with version control
 *
 * Defines how payments are processed, approved, and recorded per funeral home.
 * Each funeral home can have different payment processing rules and thresholds.
 *
 * Example variations:
 * - Strict: High approval thresholds, strict payment verification
 * - Standard: Balanced approval rules, moderate thresholds
 * - Permissive: Low thresholds, relaxed verification rules
 */
export class PaymentManagementPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;  // Policy identifier, typically funeralHomeId
  readonly version: number;       // SCD2: Version number
  readonly validFrom: Date;       // SCD2: When this version became active
  readonly validTo: Date | null;  // SCD2: When this version ended (null = current)
  readonly isCurrent: boolean;    // SCD2: Is this the current version?
  readonly funeralHomeId: string; // Which funeral home uses this policy

  // Approval Thresholds for Manual Payments
  readonly requireApprovalAboveAmount: number;     // Manual payments above this need approval
  readonly autoApproveUpToAmount: number;          // Auto-approve manual payments up to this amount
  readonly requireApprovalForAllChecks: boolean;   // All check payments require approval?
  readonly requireApprovalForAllAch: boolean;      // All ACH payments require approval?

  // Payment Type Configuration
  readonly allowedPaymentMethods: string[];        // Which payment methods to accept
  readonly enableCashPayments: boolean;            // Accept cash payments
  readonly enableCheckPayments: boolean;           // Accept check payments
  readonly enableAchPayments: boolean;             // Accept ACH payments
  readonly enableCreditCard: boolean;              // Accept credit cards

  // Check Payment Rules
  readonly requireCheckNumber: boolean;            // Check number mandatory
  readonly requireCheckDate: boolean;              // Check date must be provided
  readonly allowPostDatedChecks: boolean;          // Accept checks dated in future
  readonly maxCheckAgeDays: number;                // Reject checks older than N days

  // Refund Policy
  readonly allowRefunds: boolean;                  // Enable refund functionality
  readonly maxRefundDays: number;                  // Days after payment to allow refund
  readonly requireOriginalPaymentProof: boolean;   // Must have proof of original payment
  readonly requireRefundApproval: boolean;         // Refunds need approval above threshold
  readonly refundApprovalThreshold: number;        // Refund approval needed above this amount

  // ACH Payment Rules
  readonly requireAchVerification: boolean;        // Verify ACH details before processing
  readonly maxAchRetries: number;                  // How many times to retry failed ACH
  readonly achRetryDelayHours: number;             // Hours between ACH retries

  // Payment Record Retention
  readonly retentionDays: number;                  // How many days to keep payment records
  readonly archivePaymentsAfterDays: number;       // Archive paid-off payments after N days
  readonly enablePaymentHistory: boolean;          // Track full payment history

  // Aging & AR Reporting
  readonly agingBuckets: number[];                 // Aging report buckets (e.g., [30, 60, 90, 120])
  readonly markOverdueAfterDays: number;           // Mark invoice overdue after N days
  readonly calculateInterestOnOverdue: boolean;    // Apply interest to overdue payments
  readonly interestRate: number;                   // Annual interest rate for late payments (0-0.3)

  // Payment Stats & Aggregation
  readonly statsCalculationMethod: 'sum' | 'average' | 'weighted';  // How to aggregate payment stats
  readonly defaultPageSize: number;                // Default results per page for payment lists
  readonly listDefaultSortOrder: 'asc' | 'desc';   // Default sort order (asc = oldest first)

  // Email Notifications
  readonly enablePaymentNotifications: boolean;    // Send payment receipts/reminders
  readonly sendReceiptForAmountOver: number;       // Send receipt if payment > this amount (0 = all)
  readonly paymentReminderDaysBefore: number;      // Send reminder N days before due date

  // Audit Trail
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly updatedBy: string | null;
  readonly reason: string | null;        // Reason for policy change
}> {}

/**
 * Default Payment Management Policy
 *
 * Standard, balanced payment processing for a typical funeral home.
 * Customize per funeral home by creating variations.
 */
export const DEFAULT_PAYMENT_MANAGEMENT_POLICY: Omit<
  PaymentManagementPolicy,
  'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,

  // Moderate approval thresholds
  requireApprovalAboveAmount: 500,       // Payments > $500 need approval
  autoApproveUpToAmount: 5000,           // Auto-approve up to $5,000
  requireApprovalForAllChecks: false,    // Checks don't need auto-approval
  requireApprovalForAllAch: false,       // ACH doesn't need auto-approval

  // All payment methods allowed
  allowedPaymentMethods: ['cash', 'check', 'ach', 'credit_card'],
  enableCashPayments: true,
  enableCheckPayments: true,
  enableAchPayments: true,
  enableCreditCard: false,               // Disabled for security by default

  // Check requirements
  requireCheckNumber: true,
  requireCheckDate: true,
  allowPostDatedChecks: false,           // Don't allow post-dated checks
  maxCheckAgeDays: 180,                  // Reject checks older than 6 months

  // Refund policy
  allowRefunds: true,
  maxRefundDays: 30,                     // 30-day refund window
  requireOriginalPaymentProof: true,     // Need proof for refunds
  requireRefundApproval: true,           // Refunds need approval
  refundApprovalThreshold: 500,          // Refunds > $500 need approval

  // ACH configuration
  requireAchVerification: true,
  maxAchRetries: 3,
  achRetryDelayHours: 24,

  // Record retention
  retentionDays: 2555,                   // ~7 years for accounting/legal
  archivePaymentsAfterDays: 365,         // Archive completed payments after 1 year
  enablePaymentHistory: true,

  // Aging buckets: 30, 60, 90, 120+ days
  agingBuckets: [30, 60, 90, 120],
  markOverdueAfterDays: 30,
  calculateInterestOnOverdue: false,     // Don't charge interest by default
  interestRate: 0.01,                    // 1% annual if enabled

  // Stats & aggregation
  statsCalculationMethod: 'sum',
  defaultPageSize: 25,
  listDefaultSortOrder: 'desc',          // Newest payments first

  // Notifications
  enablePaymentNotifications: true,
  sendReceiptForAmountOver: 0,           // Send for all payments
  paymentReminderDaysBefore: 7,          // Remind 7 days before due date

  reason: null,
};

/**
 * Strict Payment Policy
 * Compliance-focused with high approval requirements
 */
export const STRICT_PAYMENT_MANAGEMENT_POLICY: Omit<
  PaymentManagementPolicy,
  'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> = {
  ...DEFAULT_PAYMENT_MANAGEMENT_POLICY,

  // Very strict approval requirements
  requireApprovalAboveAmount: 100,       // Approve manually at > $100
  autoApproveUpToAmount: 500,            // Only auto-approve < $500
  requireApprovalForAllChecks: true,     // All checks need approval
  requireApprovalForAllAch: true,        // All ACH need approval

  // Limited payment methods
  allowedPaymentMethods: ['check', 'ach'],  // Cash + credit card disabled
  enableCashPayments: false,
  enableCheckPayments: true,
  enableAchPayments: true,
  enableCreditCard: false,

  // Strict check requirements
  requireCheckNumber: true,
  requireCheckDate: true,
  allowPostDatedChecks: false,
  maxCheckAgeDays: 90,                   // Only 3-month old checks accepted

  // Strict refund policy
  allowRefunds: true,
  maxRefundDays: 14,                     // Only 14-day refund window
  requireOriginalPaymentProof: true,
  requireRefundApproval: true,
  refundApprovalThreshold: 100,          // All refunds need approval

  // Strict ACH verification
  requireAchVerification: true,
  maxAchRetries: 1,                      // Single retry only
  achRetryDelayHours: 48,                // Long delay between retries

  // Long retention for audit trail
  retentionDays: 3650,                   // 10 years
  archivePaymentsAfterDays: 180,         // Archive after 6 months
  enablePaymentHistory: true,

  // Detailed aging tracking
  agingBuckets: [7, 14, 30, 60, 90, 120],  // More granular
  markOverdueAfterDays: 0,               // Strict overdue tracking
  calculateInterestOnOverdue: true,
  interestRate: 0.02,                    // 2% annual interest

  // Conservative notification
  enablePaymentNotifications: true,
  sendReceiptForAmountOver: 0,           // Send all receipts
  paymentReminderDaysBefore: 14,         // Remind 2 weeks early
};

/**
 * Permissive Payment Policy
 * Speed-focused with minimal approval requirements
 */
export const PERMISSIVE_PAYMENT_MANAGEMENT_POLICY: Omit<
  PaymentManagementPolicy,
  'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> = {
  ...DEFAULT_PAYMENT_MANAGEMENT_POLICY,

  // Minimal approval requirements
  requireApprovalAboveAmount: 2000,      // Only approve manually > $2,000
  autoApproveUpToAmount: 10000,          // Auto-approve up to $10,000
  requireApprovalForAllChecks: false,
  requireApprovalForAllAch: false,

  // All payment methods enabled
  allowedPaymentMethods: ['cash', 'check', 'ach', 'credit_card'],
  enableCashPayments: true,
  enableCheckPayments: true,
  enableAchPayments: true,
  enableCreditCard: true,                // Enable credit cards

  // Relaxed check requirements
  requireCheckNumber: false,             // Check number optional
  requireCheckDate: false,               // Check date optional
  allowPostDatedChecks: true,            // Allow post-dated checks
  maxCheckAgeDays: 365,                  // Accept 1-year old checks

  // Permissive refund policy
  allowRefunds: true,
  maxRefundDays: 90,                     // 90-day refund window
  requireOriginalPaymentProof: false,    // Refunds don't need proof
  requireRefundApproval: false,          // Refunds don't need approval
  refundApprovalThreshold: 10000,        // Only huge refunds need approval

  // Relaxed ACH verification
  requireAchVerification: false,         // Skip ACH verification
  maxAchRetries: 5,                      // Retry more times
  achRetryDelayHours: 12,                // Quick retries

  // Minimal retention
  retentionDays: 730,                    // 2 years minimum
  archivePaymentsAfterDays: 90,          // Archive quickly
  enablePaymentHistory: false,           // Disable history tracking

  // Simple aging
  agingBuckets: [30, 60, 90],            // Basic aging
  markOverdueAfterDays: 60,              // Lenient overdue marking
  calculateInterestOnOverdue: false,
  interestRate: 0,                       // No interest

  // Minimal notifications
  enablePaymentNotifications: false,     // No notifications
  sendReceiptForAmountOver: 1000,        // Only big payments get receipts
  paymentReminderDaysBefore: 3,          // Minimal reminders
};
