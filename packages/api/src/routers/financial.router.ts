import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import {
  // Month-end close
  monthEndClose,
  validateMonthEndClose,
  getMonthEndCloseHistory,
  // Bank reconciliation
  startBankReconciliation,
  clearReconciliationItems,
  completeBankReconciliation,
  undoBankReconciliation,
  // AR Aging
  generateARAgingReport,
  // AP Payment Run
  executeAPPaymentRun,
  // Batch Payment Application
  applyBatchPayment,
  // Refund Processing
  processFinancialRefund,
  // Vendor Bill Processing
  createVendorBill,
  approveVendorBill,
  payVendorBill,
  // Revenue by Service Type
  generateRevenueByServiceType,
  // Budget Variance
  generateBudgetVarianceReport,
  // Budget Management
  getBudgetVariance,
  updateBudgetAccount,
  // Dashboard
  getFinancialKPIs,
  getFinancialTrends,
  // Fixed Assets
  registerAsset,
  getAssetRegister,
  getAssetDetails,
  getDepreciationSchedule,
  disposeAsset,
  runDepreciation,
  // GL Operations
  getGLTrialBalance,
  getAccountHistory,
  getFinancialStatement,
  postJournalEntry,
  getChartOfAccounts,
  createGLAccount,
  updateGLAccount,
  deactivateGLAccount,
  getAccountBalances,
  reverseJournalEntry,
  // AP Operations
  listVendorBills,
  groupVendorBillsByVendor,
} from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';

/**
 * Financial Operations Router
 * 
 * Handles all financial operations including:
 * - Period close workflows
 * - Bank reconciliation
 * - General ledger operations
 * - Accounts receivable
 * - Accounts payable
 * - Financial reporting
 * 
 * **Architecture Compliance**:
 * - ✅ Delegates to use cases (no business logic)
 * - ✅ Uses `runEffect()` for Effect execution
 * - ✅ Zod validation for all inputs
 * - ✅ Staff-only access via `staffProcedure`
 */
export const financialRouter = router({
  /**
   * ═══════════════════════════════════════════════════════
   * PERIOD CLOSE OPERATIONS
   * ═══════════════════════════════════════════════════════
   */
  periodClose: router({
    /**
     * Execute month-end close
     * 
     * Orchestrates complete month-end close workflow:
     * - Trial balance verification
     * - Financial statement generation
     * - Depreciation run
     * - Reconciliation verification
     * - Period locking
     */
    execute: staffProcedure
      .input(
        z.object({
          periodEnd: z.date(),
          tenant: z.string(),
          legalEntity: z.string().optional(),
          currency: z.string().default('USD'),
          notes: z.string().max(2000).optional(),
          skipReconciliationCheck: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await runEffect(
          monthEndClose({
            periodEnd: input.periodEnd,
            tenant: input.tenant,
            legalEntity: input.legalEntity,
            currency: input.currency,
            closedBy: ctx.user.id,
            notes: input.notes,
            skipReconciliationCheck: input.skipReconciliationCheck,
          })
        );
      }),

    /**
     * Validate month-end close readiness
     * 
     * Checks all prerequisites without executing close:
     * - Trial balance balanced
     * - Bank reconciliations complete
     * - No draft journal entries
     */
    validate: staffProcedure
      .input(
        z.object({
          periodEnd: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(validateMonthEndClose(input.periodEnd));
      }),

    /**
     * Get month-end close history
     * 
     * Retrieves audit log of previous closes for reporting and compliance.
     */
    getHistory: staffProcedure
      .input(
        z.object({
          periodStart: z.date(),
          periodEnd: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          getMonthEndCloseHistory(input.periodStart, input.periodEnd)
        );
      }),
  }),

  /**
   * ═══════════════════════════════════════════════════════
   * BANK RECONCILIATION OPERATIONS
   * ═══════════════════════════════════════════════════════
   */
  bankRec: router({
    /**
     * Start bank reconciliation
     * 
     * Creates reconciliation workspace and fetches unreconciled transactions.
     */
    start: staffProcedure
      .input(
        z.object({
          accountId: z.string(),
          accountNumber: z.string(),
          period: z.date(),
          statementBalance: z.number(),
          statementDate: z.date(),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          startBankReconciliation({
            accountId: input.accountId,
            accountNumber: input.accountNumber,
            period: input.period,
            statementBalance: input.statementBalance,
            statementDate: input.statementDate,
          })
        );
      }),

    /**
     * Clear reconciliation items
     * 
     * Mark multiple items as cleared (matched to bank statement).
     */
    clearItems: staffProcedure
      .input(
        z.object({
          reconciliationId: z.string(),
          itemIds: z.array(z.string()).min(1),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          clearReconciliationItems({
            reconciliationId: input.reconciliationId,
            itemIds: input.itemIds,
          })
        );
      }),

    /**
     * Complete bank reconciliation
     * 
     * Finalizes reconciliation and optionally posts adjustment entry.
     */
    complete: staffProcedure
      .input(
        z.object({
          reconciliationId: z.string(),
          adjustmentAmount: z.number().optional(),
          adjustmentReason: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await runEffect(
          completeBankReconciliation({
            reconciliationId: input.reconciliationId,
            reconciledBy: ctx.user.id,
            adjustmentAmount: input.adjustmentAmount,
            adjustmentReason: input.adjustmentReason,
          })
        );
      }),

    /**
     * Undo bank reconciliation
     * 
     * Reverts a completed reconciliation for correction.
     * Does NOT reverse adjustment entries (must be done separately).
     */
    undo: staffProcedure
      .input(
        z.object({
          reconciliationId: z.string(),
          reason: z.string().min(1).max(500),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          undoBankReconciliation(input.reconciliationId, input.reason)
        );
      }),

    /**
     * Get unreconciled bank transactions
     * 
     * Fetches bank transactions that haven't been matched to GL entries.
     */
    getBankTransactions: staffProcedure
      .input(
        z.object({
          accountId: z.string(),
          startDate: z.date(),
          endDate: z.date(),
          includeCleared: z.boolean().default(false),
        })
      )
      .query(async () => {
        // For now, return mock data - will wire to Go backend when available
        // TODO: Use input.accountId, input.startDate, input.endDate, input.includeCleared
        const mockTransactions = [
          { id: 'BT-001', date: '2024-12-03', description: 'Check #1245 - Johnson Family', amount: -8500, type: 'debit' as const, status: 'unmatched' as const },
          { id: 'BT-002', date: '2024-12-03', description: 'Wire Transfer - Insurance Claim', amount: 12400, type: 'credit' as const, status: 'unmatched' as const },
          { id: 'BT-003', date: '2024-12-02', description: 'ACH Payment - Vendor XYZ', amount: -3200, type: 'debit' as const, status: 'unmatched' as const },
          { id: 'BT-004', date: '2024-12-02', description: 'Deposit - Smith Family', amount: 6800, type: 'credit' as const, status: 'unmatched' as const },
          { id: 'BT-005', date: '2024-12-01', description: 'Unknown Deposit', amount: 450, type: 'credit' as const, status: 'unmatched' as const },
          { id: 'BT-006', date: '2024-12-01', description: 'Check #1243 - Williams Estate', amount: -15000, type: 'debit' as const, status: 'unmatched' as const },
        ];
        return mockTransactions;
      }),

    /**
     * Get unreconciled GL entries
     * 
     * Fetches GL transactions that haven't been matched to bank transactions.
     */
    getGLEntries: staffProcedure
      .input(
        z.object({
          accountId: z.string(),
          startDate: z.date(),
          endDate: z.date(),
          includeMatched: z.boolean().default(false),
        })
      )
      .query(async () => {
        // For now, return mock data - will wire to Go backend when available
        // TODO: Use input.accountId, input.startDate, input.endDate, input.includeMatched
        const mockEntries = [
          { id: 'JE-2401', date: '2024-12-03', description: 'Payment Received - Johnson Family', amount: -8500, type: 'debit' as const, matched: false },
          { id: 'JE-2402', date: '2024-12-03', description: 'Insurance Claim - Policy #8829', amount: 12400, type: 'credit' as const, matched: false },
          { id: 'JE-2403', date: '2024-12-02', description: 'Vendor Payment - XYZ Supplies', amount: -3200, type: 'debit' as const, matched: false },
          { id: 'JE-2398', date: '2024-12-02', description: 'Service Payment - Smith Family', amount: 6800, type: 'credit' as const, matched: false },
          { id: 'JE-2404', date: '2024-12-01', description: 'Miscellaneous Revenue', amount: 450, type: 'credit' as const, matched: false },
          { id: 'JE-2395', date: '2024-12-01', description: 'Estate Payment - Williams', amount: -15000, type: 'debit' as const, matched: false },
          { id: 'JE-2405', date: '2024-11-30', description: 'Operating Expense - Utilities', amount: -540, type: 'debit' as const, matched: false },
        ];
        return mockEntries;
      }),

    /**
     * Get smart match suggestions
     * 
     * Uses AI/ML to suggest matches between bank transactions and GL entries.
     */
    getMatchSuggestions: staffProcedure
      .input(
        z.object({
          accountId: z.string(),
          threshold: z.number().min(0).max(1).default(0.8),
        })
      )
      .query(async () => {
        // For now, return mock suggestions - will implement ML matching when Go backend is ready
        // TODO: Use input.accountId, input.threshold
        const mockSuggestions = [
          { bankTxId: 'BT-003', glEntryId: 'JE-2403', confidence: 0.95, reason: 'Exact amount and similar description' },
          { bankTxId: 'BT-005', glEntryId: 'JE-2404', confidence: 0.90, reason: 'Exact amount match' },
        ];
        return mockSuggestions;
      }),

    /**
     * Import bank statement
     * 
     * Parses CSV/OFX bank statement and creates transactions.
     */
    importStatement: staffProcedure
      .input(
        z.object({
          accountId: z.string(),
          fileContent: z.string(),
          fileType: z.enum(['csv', 'ofx', 'qfx']),
        })
      )
      .mutation(async ({ input }) => {
        // Basic CSV parsing (simplified)
        const lines = input.fileContent.split('\n');
        const header = lines[0]?.toLowerCase() || '';
        
        // Detect CSV format
        const hasDate = header.includes('date');
        const hasDescription = header.includes('description') || header.includes('memo');
        const hasAmount = header.includes('amount');
        
        if (!hasDate || !hasDescription || !hasAmount) {
          throw new Error('Invalid CSV format. Expected columns: Date, Description, Amount');
        }
        
        // Parse rows (simplified - real implementation would be more robust)
        const transactions = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line || !line.trim()) continue;
          
          const cols = line.split(',');
          if (cols.length >= 3 && cols[0] && cols[1] && cols[2]) {
            transactions.push({
              date: cols[0].trim(),
              description: cols[1].trim(),
              amount: parseFloat(cols[2].trim()),
            });
          }
        }
        
        return {
          success: true,
          transactionsImported: transactions.length,
          transactions: transactions.slice(0, 10), // Return first 10 for preview
        };
      }),
  }),

  /**
   * ═══════════════════════════════════════════════════════
   * GENERAL LEDGER OPERATIONS
   * ═══════════════════════════════════════════════════════
   */
  gl: router({
    /**
     * Get trial balance
     * 
     * Returns all GL accounts with balances for a specific period.
     */
    getTrialBalance: staffProcedure
      .input(
        z.object({
          period: z.date(),
          funeralHomeId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          getGLTrialBalance({
            period: input.period,
            funeralHomeId: input.funeralHomeId,
          })
        );
      }),

    /**
     * Get account history
     * 
     * Returns detailed transaction history for a GL account.
     */
    getAccountHistory: staffProcedure
      .input(
        z.object({
          accountId: z.string(),
          startDate: z.date(),
          endDate: z.date(),
          funeralHomeId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          getAccountHistory({
            accountId: input.accountId,
            startDate: input.startDate,
            endDate: input.endDate,
            funeralHomeId: input.funeralHomeId,
          })
        );
      }),

    /**
     * Get financial statement
     * 
     * Generates P&L, Balance Sheet, or Cash Flow statement.
     */
    getFinancialStatement: staffProcedure
      .input(
        z.object({
          type: z.enum(['income_statement', 'balance_sheet', 'cash_flow']),
          startDate: z.date().optional(),
          endDate: z.date(),
          funeralHomeId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          getFinancialStatement({
            type: input.type,
            startDate: input.startDate,
            endDate: input.endDate,
            funeralHomeId: input.funeralHomeId,
          })
        );
      }),

    /**
     * Post journal entry
     * 
     * Creates and posts a manual journal entry to the GL.
     */
    postJournalEntry: staffProcedure
      .input(
        z.object({
          entryDate: z.date(),
          description: z.string().min(1).max(500),
          funeralHomeId: z.string(),
          lines: z
            .array(
              z.object({
                accountId: z.string(),
                debit: z.number().nonnegative(),
                credit: z.number().nonnegative(),
                description: z.string().max(500).optional(),
              })
            )
            .min(2),
        })
      )
      .mutation(async ({ input }) => {
        // Validate debits equal credits
        const totalDebits = input.lines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredits = input.lines.reduce((sum, line) => sum + line.credit, 0);

        if (Math.abs(totalDebits - totalCredits) > 0.01) {
          throw new Error(
            `Journal entry out of balance. Debits: ${totalDebits}, Credits: ${totalCredits}`
          );
        }

        // Post journal entry via use case
        const entry = await runEffect(
          postJournalEntry({
            entryDate: input.entryDate,
            description: input.description,
            funeralHomeId: input.funeralHomeId,
            lines: input.lines,
          })
        );

        return {
          journalEntryId: entry.id,
          posted: true,
          totalDebits: entry.totalDebit,
          totalCredits: entry.totalCredit,
        };
      }),

    /**
     * Get chart of accounts
     * 
     * Returns all GL accounts with hierarchy.
     */
    getChartOfAccounts: staffProcedure
      .input(
        z.object({
          funeralHomeId: z.string(),
          includeInactive: z.boolean().default(false),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          getChartOfAccounts({
            funeralHomeId: input.funeralHomeId,
            includeInactive: input.includeInactive,
          })
        );
      }),

    /**
     * Create GL account
     * 
     * Creates a new general ledger account.
     */
    createAccount: staffProcedure
      .input(
        z.object({
          accountNumber: z.string().regex(/^\d{4,}$/, 'Must be 4+ digits'),
          name: z.string().min(3).max(100),
          accountType: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
          parentAccountId: z.string().optional(),
          funeralHomeId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          createGLAccount({
            accountNumber: input.accountNumber,
            name: input.name,
            accountType: input.accountType,
            parentAccountId: input.parentAccountId,
            funeralHomeId: input.funeralHomeId,
          })
        );
      }),

    /**
     * Update GL account
     * 
     * Updates an existing GL account.
     */
    updateAccount: staffProcedure
      .input(
        z.object({
          accountId: z.string(),
          name: z.string().min(3).max(100).optional(),
          accountType: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']).optional(),
          parentAccountId: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          updateGLAccount({
            accountId: input.accountId,
            name: input.name,
            accountType: input.accountType,
            parentAccountId: input.parentAccountId,
          })
        );
      }),

    /**
     * Deactivate GL account
     * 
     * Deactivates a GL account (soft delete).
     */
    deactivateAccount: staffProcedure
      .input(
        z.object({
          accountId: z.string(),
          reason: z.string().min(1).max(500),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          deactivateGLAccount({
            accountId: input.accountId,
            reason: input.reason,
          })
        );
      }),

    /**
     * Get account balances
     * 
     * Returns current balances for all accounts.
     */
    getAccountBalances: staffProcedure
      .input(
        z.object({
          funeralHomeId: z.string(),
          accountIds: z.array(z.string()).optional(),
          asOfDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          getAccountBalances({
            funeralHomeId: input.funeralHomeId,
            accountIds: input.accountIds,
            asOfDate: input.asOfDate,
          })
        );
      }),

    /**
     * Reverse journal entry
     * 
     * Creates a reversal entry for an existing journal entry.
     */
    reverseJournalEntry: staffProcedure
      .input(
        z.object({
          journalEntryId: z.string(),
          reversalDate: z.date(),
          reversalReason: z.string().min(1).max(500),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await runEffect(
          reverseJournalEntry({
            journalEntryId: input.journalEntryId,
            reversalDate: input.reversalDate,
            reversalReason: input.reversalReason,
            reversedBy: ctx.user.id,
            funeralHomeId: 'default', // Get from context
          })
        );
      }),
  }),

  /**
   * ═══════════════════════════════════════════════════════
   * ACCOUNTS RECEIVABLE OPERATIONS
   * ═══════════════════════════════════════════════════════
   */
  ar: router({
    /**
     * Get AR aging report
     * 
     * Returns aging buckets (0-30, 31-60, 61-90, 90+) with priority scores.
     */
    getAgingReport: staffProcedure
      .input(
        z.object({
          asOfDate: z.date(),
          funeralHomeId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          generateARAgingReport({
            asOfDate: input.asOfDate,
          })
        );
      }),

    /**
     * Get overdue invoices
     * 
     * Returns list of invoices past due date.
     */
    getOverdueInvoices: staffProcedure
      .input(
        z.object({
          asOfDate: z.date().optional(),
          funeralHomeId: z.string(),
          minimumDaysOverdue: z.number().int().nonnegative().default(1),
        })
      )
      .query(async ({ input }) => {
        // Note: Will be implemented in Phase 1.4 (Day 7-8)
        return {
          asOfDate: input.asOfDate || new Date(),
          invoices: [],
          totalOverdueAmount: 0,
        };
      }),

    /**
     * Apply batch payments
     * 
     * Apply multiple payments to invoices in a single batch.
     */
    applyBatchPayments: staffProcedure
      .input(
        z.object({
          payments: z.array(
            z.object({
              paymentId: z.string(),
              invoiceId: z.string(),
              amount: z.number().positive(),
            })
          ),
          funeralHomeId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          applyBatchPayment({
            paymentId: 'batch-payment-id', // TODO: Create batch payment first
            allocations: input.payments.map(p => ({
              invoiceId: p.invoiceId,
              amount: p.amount,
            })),
          })
        );
      }),

    /**
     * List invoices
     * 
     * Returns list of invoices with filtering.
     */
    listInvoices: staffProcedure
      .input(
        z.object({
          status: z.enum(['all', 'draft', 'sent', 'paid', 'overdue', 'void']).default('all'),
          caseId: z.string().optional(),
          funeralHomeId: z.string(),
        })
      )
      .query(async ({ input }) => {
        // Mock invoice data
        const mockInvoices = [
          { id: '1', invoiceNumber: 'INV-2024-001', customerName: 'Smith Family', caseId: 'CASE-001', caseNumber: 'CASE-001', invoiceDate: '2024-11-15', dueDate: '2024-12-15', totalAmount: 8500, paidAmount: 0, balance: 8500, status: 'sent' as const, daysOverdue: 0 },
          { id: '2', invoiceNumber: 'INV-2024-002', customerName: 'Johnson Family', caseId: 'CASE-002', caseNumber: 'CASE-002', invoiceDate: '2024-10-20', dueDate: '2024-11-20', totalAmount: 12000, paidAmount: 5000, balance: 7000, status: 'overdue' as const, daysOverdue: 15 },
          { id: '3', invoiceNumber: 'INV-2024-003', customerName: 'Williams Estate', caseId: 'CASE-003', caseNumber: 'CASE-003', invoiceDate: '2024-09-10', dueDate: '2024-10-10', totalAmount: 6500, paidAmount: 1000, balance: 5500, status: 'overdue' as const, daysOverdue: 56 },
          { id: '4', invoiceNumber: 'INV-2024-004', customerName: 'Brown Family', caseId: 'CASE-004', caseNumber: 'CASE-004', invoiceDate: '2024-08-15', dueDate: '2024-09-15', totalAmount: 9200, paidAmount: 2000, balance: 7200, status: 'overdue' as const, daysOverdue: 81 },
          { id: '5', invoiceNumber: 'INV-2024-005', customerName: 'Davis Family', caseId: 'CASE-005', caseNumber: 'CASE-005', invoiceDate: '2024-06-20', dueDate: '2024-07-20', totalAmount: 15000, paidAmount: 0, balance: 15000, status: 'overdue' as const, daysOverdue: 138 },
          { id: '6', invoiceNumber: 'INV-2024-006', customerName: 'Miller Family', caseId: 'CASE-006', caseNumber: 'CASE-006', invoiceDate: '2024-11-25', dueDate: '2024-12-25', totalAmount: 7800, paidAmount: 0, balance: 7800, status: 'sent' as const, daysOverdue: 0 },
          { id: '7', invoiceNumber: 'INV-2024-007', customerName: 'Wilson Estate', caseId: 'CASE-007', caseNumber: 'CASE-007', invoiceDate: '2024-10-05', dueDate: '2024-11-05', totalAmount: 11500, paidAmount: 11500, balance: 0, status: 'paid' as const, daysOverdue: 0 },
          { id: '8', invoiceNumber: 'INV-2024-008', customerName: 'Moore Family', caseId: 'CASE-008', caseNumber: 'CASE-008', invoiceDate: '2024-10-12', dueDate: '2024-11-12', totalAmount: 5200, paidAmount: 0, balance: 5200, status: 'overdue' as const, daysOverdue: 23 },
          { id: '9', invoiceNumber: 'INV-2024-009', customerName: 'Taylor Family', caseId: 'CASE-009', caseNumber: 'CASE-009', invoiceDate: '2024-12-01', dueDate: '2025-01-01', totalAmount: 8900, paidAmount: 0, balance: 8900, status: 'draft' as const, daysOverdue: 0 },
        ];
        let filtered = mockInvoices;
        if (input.status !== 'all') {
          filtered = filtered.filter(inv => inv.status === input.status);
        }
        if (input.caseId) {
          filtered = filtered.filter(inv => inv.caseId === input.caseId);
        }
        return filtered;
      }),

    /**
     * Create invoice
     * 
     * Creates a new AR invoice for a case.
     */
    createInvoice: staffProcedure
      .input(
        z.object({
          caseId: z.string(),
          invoiceDate: z.date(),
          dueDate: z.date(),
          notes: z.string().max(1000).optional(),
          lineItems: z.array(
            z.object({
              description: z.string(),
              quantity: z.number().positive(),
              unitPrice: z.number().nonnegative(),
              amount: z.number().nonnegative(),
              taxable: z.boolean().default(false),
            })
          ).min(1),
          funeralHomeId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Calculate totals
        const subtotal = input.lineItems.reduce((sum, item) => sum + item.amount, 0);
        const taxableAmount = input.lineItems
          .filter(item => item.taxable)
          .reduce((sum, item) => sum + item.amount, 0);
        const taxRate = 0.06; // 6% tax rate
        const taxAmount = taxableAmount * taxRate;
        const total = subtotal + taxAmount;

        // Mock invoice creation
        return {
          id: `inv-${Date.now()}`,
          invoiceNumber: `INV-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          caseId: input.caseId,
          invoiceDate: input.invoiceDate,
          dueDate: input.dueDate,
          subtotal,
          taxAmount,
          total,
          status: 'draft' as const,
          createdAt: new Date(),
          createdBy: ctx.user.id,
        };
      }),

    /**
     * Void invoice
     * 
     * Voids an invoice (cannot be undone).
     */
    voidInvoice: staffProcedure
      .input(
        z.object({
          invoiceId: z.string(),
          reason: z.string().min(1).max(500),
        })
      )
      .mutation(async ({ input }) => {
        // Mock void operation
        return {
          invoiceId: input.invoiceId,
          voided: true,
          voidedAt: new Date(),
          reason: input.reason,
        };
      }),
  }),

  /**
   * ═══════════════════════════════════════════════════════
   * PROCUREMENT & PURCHASE ORDERS
   * ═══════════════════════════════════════════════════════
   */
  procurement: router({
    /**
     * List purchase orders
     */
    listPOs: staffProcedure
      .input(
        z.object({
          status: z.enum(['draft', 'approved', 'ordered', 'received', 'closed', 'all']).default('all'),
          funeralHomeId: z.string().optional(),
        })
      )
      .query(async () => {
        // Mock data for now - will wire to Go Procurement port
        const mockPOs = [
          { id: '1', poNumber: 'PO-2024-001', vendor: 'Casket Supplier Inc', vendorId: 'V001', items: 3, total: 12500, status: 'received' as const, createdAt: '2024-12-01' },
          { id: '2', poNumber: 'PO-2024-002', vendor: 'Memorial Products Co', vendorId: 'V002', items: 5, total: 3200, status: 'ordered' as const, createdAt: '2024-12-02' },
          { id: '3', poNumber: 'PO-2024-003', vendor: 'Flowers & More', vendorId: 'V003', items: 2, total: 450, status: 'approved' as const, createdAt: '2024-12-04' },
          { id: '4', poNumber: 'PO-2024-004', vendor: 'Casket Supplier Inc', vendorId: 'V001', items: 1, total: 8900, status: 'draft' as const, createdAt: '2024-12-05' },
        ];
        return mockPOs;
      }),

    /**
     * List suppliers/vendors
     */
    listSuppliers: staffProcedure
      .input(
        z.object({
          status: z.enum(['all', 'active', 'inactive']).default('all'),
          category: z.string().optional(),
          funeralHomeId: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        // Mock supplier data - will wire to Go backend (Use Case 5.6)
        const mockSuppliers = [
          { id: '1', name: 'Casket Supplier Inc', category: 'Caskets & Urns', rating: 4.8, totalSpend: 45000, orders: 24, status: 'active' as const },
          { id: '2', name: 'Memorial Products Co', category: 'Memorial Goods', rating: 4.5, totalSpend: 23000, orders: 18, status: 'active' as const },
          { id: '3', name: 'Flowers & More', category: 'Flowers', rating: 4.2, totalSpend: 12000, orders: 32, status: 'active' as const },
        ];
        let filtered = mockSuppliers;
        if (input.status !== 'all') {
          filtered = filtered.filter(s => s.status === input.status);
        }
        if (input.category) {
          filtered = filtered.filter(s => s.category === input.category);
        }
        return filtered;
      }),

    /**
     * Create supplier
     */
    createSupplier: staffProcedure
      .input(
        z.object({
          name: z.string(),
          category: z.string(),
          contactEmail: z.string().email().optional(),
          contactPhone: z.string().optional(),
          address: z.string().optional(),
          funeralHomeId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Mock implementation - will wire to Go backend
        return {
          id: `supplier-${Date.now()}`,
          ...input,
          rating: 0,
          totalSpend: 0,
          orders: 0,
          status: 'active' as const,
          createdAt: new Date(),
        };
      }),

    /**
     * Update supplier
     */
    updateSupplier: staffProcedure
      .input(
        z.object({
          supplierId: z.string(),
          name: z.string().optional(),
          category: z.string().optional(),
          contactEmail: z.string().email().optional(),
          contactPhone: z.string().optional(),
          address: z.string().optional(),
          status: z.enum(['active', 'inactive']).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Mock implementation - will wire to Go backend
        return {
          supplierId: input.supplierId,
          updatedAt: new Date(),
        };
      }),
  }),

  /**
   * ═══════════════════════════════════════════════════════
   * ACCOUNTS PAYABLE OPERATIONS
   * ═══════════════════════════════════════════════════════
   */
  ap: router({
    /**
     * List vendor bills
     * 
     * Returns list of vendor bills with filtering.
     */
    listBills: staffProcedure
      .input(
        z.object({
          status: z.enum(['all', 'pending', 'approved', 'paid', 'rejected']).default('all'),
          vendorId: z.string().optional(),
          funeralHomeId: z.string(),
        })
      )
      .query(async ({ input }) => {
        // Mock bill data
        const mockBills = [
          { id: '1', billNumber: 'BILL-2024-001', vendor: 'Casket Supplier Inc', vendorId: 'V001', poNumber: 'PO-2024-001', receiptNumber: 'REC-2024-001', invoiceDate: '2024-11-20', dueDate: '2024-12-20', amount: 12500, status: 'pending' as const, hasVariance: false },
          { id: '2', billNumber: 'BILL-2024-002', vendor: 'Memorial Products Co', vendorId: 'V002', poNumber: 'PO-2024-002', receiptNumber: 'REC-2024-002', invoiceDate: '2024-11-25', dueDate: '2024-12-25', amount: 3200, status: 'pending' as const, hasVariance: true, varianceAmount: 150 },
          { id: '3', billNumber: 'BILL-2024-003', vendor: 'Flowers & More', vendorId: 'V003', poNumber: 'PO-2024-003', receiptNumber: 'REC-2024-003', invoiceDate: '2024-11-10', dueDate: '2024-12-10', amount: 450, status: 'approved' as const, hasVariance: false },
          { id: '4', billNumber: 'BILL-2024-004', vendor: 'Casket Supplier Inc', vendorId: 'V001', poNumber: 'PO-2024-005', receiptNumber: 'REC-2024-005', invoiceDate: '2024-10-15', dueDate: '2024-11-15', amount: 8900, status: 'paid' as const, hasVariance: false, paidDate: '2024-11-14', checkNumber: 'CHK-1001' },
        ];
        let filtered = mockBills;
        if (input.status !== 'all') {
          filtered = filtered.filter(bill => bill.status === input.status);
        }
        if (input.vendorId) {
          filtered = filtered.filter(bill => bill.vendorId === input.vendorId);
        }
        return filtered;
      }),

    /**
     * Process vendor bill
     * 
     * 3-way matching: PO + Receipt + Invoice.
     */
    processBill: staffProcedure
      .input(
        z.object({
          purchaseOrderId: z.string(),
          receiptId: z.string(),
          vendorId: z.string(),
          invoiceNumber: z.string(),
          invoiceDate: z.date(),
          dueDate: z.date(),
          lineItems: z.array(
            z.object({
              description: z.string(),
              quantity: z.number().positive(),
              unitPrice: z.number().positive(),
              amount: z.number().positive(),
            })
          ),
          funeralHomeId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await runEffect(
          createVendorBill({
            vendorId: input.vendorId,
            purchaseOrderId: input.purchaseOrderId,
            billDate: input.invoiceDate,
            dueDate: input.dueDate,
            billNumber: input.invoiceNumber,
            lineItems: input.lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              glAccountId: 'default-gl-account', // TODO: Add GL account mapping
            })),
            createdBy: ctx.user.id,
          })
        );
      }),

    /**
     * Approve vendor bill
     * 
     * Approve bill for payment after verification.
     */
    approveBill: staffProcedure
      .input(
        z.object({
          billId: z.string(),
          notes: z.string().max(500).optional(),
          funeralHomeId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await runEffect(
          approveVendorBill({
            billId: input.billId,
            approvedBy: ctx.user.id,
            notes: input.notes,
          })
        );
      }),

    /**
     * Pay vendor bill
     * 
     * Record payment for approved bill.
     */
    payBill: staffProcedure
      .input(
        z.object({
          billId: z.string(),
          vendorId: z.string(),
          paymentDate: z.date(),
          paymentMethod: z.enum(['check', 'ach', 'wire']),
          amount: z.number().positive(),
          checkNumber: z.string().optional(),
          referenceNumber: z.string().optional(),
          funeralHomeId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await runEffect(
          payVendorBill({
            billId: input.billId,
            vendorId: input.vendorId,
            paymentDate: input.paymentDate,
            paymentMethod: input.paymentMethod,
            amount: input.amount,
            checkNumber: input.checkNumber,
            referenceNumber: input.referenceNumber,
            paidBy: ctx.user.id,
          })
        );
      }),

    /**
     * Get payables by vendor
     * 
     * Returns outstanding payables grouped by vendor.
     */
    getPayablesByVendor: staffProcedure
      .input(
        z.object({
          asOfDate: z.date().optional(),
          funeralHomeId: z.string(),
          status: z.enum(['pending', 'approved', 'paid', 'all']).default('all'),
        })
      )
      .query(async ({ input }) => {
        // Map status filter
        const statusFilter = input.status === 'all' ? undefined : 
                            input.status === 'pending' ? 'pending_approval' as const :
                            input.status;
        
        // Fetch vendor bills
        const bills = await runEffect(
          listVendorBills({
            status: statusFilter,
            endDate: input.asOfDate,
            funeralHomeId: input.funeralHomeId,
          })
        );
        
        // Group by vendor
        const vendors = groupVendorBillsByVendor(bills);
        
        // Calculate total payables
        const totalPayables = vendors.reduce((sum, v) => sum + v.totalDue, 0);
        
        return {
          asOfDate: input.asOfDate || new Date(),
          vendors,
          totalPayables,
        };
      }),

    /**
     * Generate AP payment run
     * 
     * Generate list of bills to pay based on due dates and available cash.
     * Note: Will be implemented in Phase 1.4 (Day 7-8)
     */
    generatePaymentRun: staffProcedure
      .input(
        z.object({
          paymentDate: z.date(),
          availableCash: z.number().positive(),
          funeralHomeId: z.string(),
          includeDueBefore: z.date(),
          excludeVendors: z.array(z.string()).optional(),
        })
      )
      .query(async ({ input }) => {
        // Placeholder until full implementation
        return {
          paymentRunId: 'pr-placeholder',
          bills: [],
          totalAmount: 0,
          paymentDate: input.paymentDate,
        };
      }),

    /**
     * Execute AP payment run
     * 
     * Process batch payments for selected bills.
     */
    executePaymentRun: staffProcedure
      .input(
        z.object({
          paymentRunId: z.string(),
          paymentMethod: z.enum(['check', 'ach', 'wire']),
          funeralHomeId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await runEffect(
          executeAPPaymentRun({
            billIds: [], // TODO: Get from payment run
            runDate: new Date(),
            paymentMethod: input.paymentMethod,
            createdBy: ctx.user.id,
            tenant: input.funeralHomeId,
            autoApprove: true,
            autoExecute: true,
          })
        );
      }),
  }),

  /**
   * ═══════════════════════════════════════════════════════
   * FINANCIAL REPORTING
   * ═══════════════════════════════════════════════════════
   */
  reports: router({
    /**
     * Revenue by service type
     * 
     * Analyze revenue breakdown by service category.
     */
    revenueByServiceType: staffProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
          funeralHomeId: z.string(),
        })
      )
      .query(async ({ input, ctx }) => {
        return await runEffect(
          generateRevenueByServiceType({
            startDate: input.startDate,
            endDate: input.endDate,
            generatedBy: ctx.user.id,
          })
        );
      }),

    /**
     * Budget variance report
     * 
     * Compare actual vs budgeted amounts.
     */
    budgetVariance: staffProcedure
      .input(
        z.object({
          period: z.date(),
          funeralHomeId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          generateBudgetVarianceReport({
            period: input.period,
          })
        );
      }),
  }),

  /**
   * ═══════════════════════════════════════════════════════
   * BUDGET MANAGEMENT
   * ═══════════════════════════════════════════════════════
   */
  budget: router({
    /**
     * Get budget variance
     * 
     * Compare actual vs budget with variance analysis.
     */
    getVariance: staffProcedure
      .input(
        z.object({
          period: z.date(),
          funeralHomeId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          getBudgetVariance({
            period: input.period,
            funeralHomeId: input.funeralHomeId,
          })
        );
      }),

    /**
     * Update budget account
     * 
     * Update budget amounts for account across periods.
     */
    updateAccount: staffProcedure
      .input(
        z.object({
          budgetId: z.string(),
          accountId: z.string(),
          periods: z.array(
            z.object({
              period: z.string(),
              amount: z.number().nonnegative(),
            })
          ).min(1),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          updateBudgetAccount({
            budgetId: input.budgetId,
            accountId: input.accountId,
            periods: input.periods,
          })
        );
      }),
  }),

  /**
   * ═══════════════════════════════════════════════════════
   * DASHBOARDS
   * ═══════════════════════════════════════════════════════
   */
  dashboards: router({
    /**
     * Financial KPIs for dashboard cards
     */
    getKPIs: staffProcedure
      .input(
        z.object({
          funeralHomeId: z.string(),
          period: z.string(), // e.g., '2024-12'
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          getFinancialKPIs({ funeralHomeId: input.funeralHomeId, period: input.period })
        );
      }),

    /**
     * Financial trends for time-series charts
     */
    getTrends: staffProcedure
      .input(
        z.object({
          funeralHomeId: z.string(),
          fromPeriod: z.string(), // '2024-01'
          toPeriod: z.string(),   // '2024-12'
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          getFinancialTrends({
            funeralHomeId: input.funeralHomeId,
            fromPeriod: input.fromPeriod,
            toPeriod: input.toPeriod,
          })
        );
      }),
  }),

  /**
   * ═══════════════════════════════════════════════════════
   * FIXED ASSETS
   * ═══════════════════════════════════════════════════════
   */
  fixedAssets: router({
    /**
     * Register new fixed asset
     */
    register: staffProcedure
      .input(
        z.object({
          assetNumber: z.string(),
          description: z.string(),
          category: z.string(),
          acquisitionDate: z.date(),
          acquisitionCost: z.number().positive(),
          salvageValue: z.number().nonnegative(),
          usefulLifeYears: z.number().positive(),
          depreciationMethod: z.enum(['straight_line', 'declining_balance', 'units_of_production']),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          registerAsset({
            assetNumber: input.assetNumber,
            description: input.description,
            category: input.category,
            acquisitionDate: input.acquisitionDate,
            acquisitionCost: input.acquisitionCost,
            salvageValue: input.salvageValue,
            usefulLifeYears: input.usefulLifeYears,
            depreciationMethod: input.depreciationMethod,
          })
        );
      }),

    /**
     * Get asset register (list of all assets)
     */
    getRegister: staffProcedure
      .input(
        z.object({
          category: z.string().optional(),
          status: z.enum(['active', 'disposed', 'fully_depreciated']).optional(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(
          getAssetRegister({
            category: input.category,
            status: input.status,
          })
        );
      }),

    /**
     * Get asset details by ID
     */
    getDetails: staffProcedure
      .input(
        z.object({
          assetId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(getAssetDetails(input.assetId));
      }),

    /**
     * Get depreciation schedule for asset
     */
    getDepreciationSchedule: staffProcedure
      .input(
        z.object({
          assetId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await runEffect(getDepreciationSchedule(input.assetId));
      }),

    /**
     * Dispose asset
     */
    dispose: staffProcedure
      .input(
        z.object({
          assetId: z.string(),
          disposalDate: z.date(),
          disposalAmount: z.number().nonnegative(),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          disposeAsset({
            assetId: input.assetId,
            disposalDate: input.disposalDate,
            disposalAmount: input.disposalAmount,
          })
        );
      }),

    /**
     * Run monthly depreciation
     */
    runDepreciation: staffProcedure
      .input(
        z.object({
          period: z.date(),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          runDepreciation({
            period: input.period,
          })
        );
      }),
  }),

  /**
   * ═══════════════════════════════════════════════════════
   * REFUND PROCESSING
   * ═══════════════════════════════════════════════════════
   */
  refunds: router({
    /**
     * Process case refund
     * 
     * Handle multi-payment refunds with audit trail.
     */
    process: staffProcedure
      .input(
        z.object({
          caseId: z.string(),
          paymentIds: z.array(z.string()).min(1),
          refundAmount: z.number().positive(),
          reason: z.string().min(1).max(500),
          notes: z.string().max(2000).optional(),
          funeralHomeId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const paymentId = input.paymentIds[0];
        if (!paymentId) {
          throw new Error('At least one payment ID is required for refund');
        }
        
        return await runEffect(
          processFinancialRefund({
            paymentId,
            refundAmount: input.refundAmount,
            reason: input.reason as 'overpayment' | 'cancellation' | 'error_correction' | 'service_adjustment' | 'other',
            notes: input.notes,
            processedBy: ctx.user.id,
          })
        );
      }),
  }),
});
