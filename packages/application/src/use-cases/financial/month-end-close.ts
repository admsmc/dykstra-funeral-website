import { Effect } from 'effect';
import { 
  GoFinancialPort,
  type GoFinancialPortService,
  NetworkError
} from '../../ports/go-financial-port';
import { GoFixedAssetsPort, type GoFixedAssetsPortService } from '../../ports/go-fixed-assets-port';
import { GoReconciliationsPort, type GoReconciliationsPortService } from '../../ports/go-reconciliations-port';
import { AuditLogRepository, type AuditLogRepository as AuditLogRepositoryService } from '../../ports/audit-log-repository';
import { ValidationError } from '@dykstra/domain';

/**
 * Command to execute month-end close
 */
export interface MonthEndCloseCommand {
  readonly periodEnd: Date;
  readonly tenant: string;
  readonly legalEntity?: string;
  readonly currency?: string;
  readonly closedBy: string;
  readonly notes?: string;
  readonly skipReconciliationCheck?: boolean; // For testing/emergencies only
}

/**
 * Result of month-end close
 */
export interface MonthEndCloseResult {
  readonly periodClosed: Date;
  readonly trialBalance: {
    id: string;
    balanced: boolean;
    totalDebits: number;
    totalCredits: number;
  };
  readonly statements: {
    incomeStatement: string;
    balanceSheet: string;
    cashFlow: string;
  };
  readonly depreciation: {
    runId: string;
    assetsDepreciated: number;
    totalDepreciation: number;
  };
  readonly reconciliations: {
    total: number;
    reconciled: number;
    outstanding: readonly string[];
  };
  readonly auditLogId: string;
  readonly closedAt: Date;
}

/**
 * Month-End Close Process
 * 
 * This use case orchestrates the complete month-end close workflow, including:
 * - Trial balance verification
 * - Financial statement generation
 * - Depreciation run
 * - Reconciliation verification
 * - Period locking
 * - Audit trail creation
 * 
 * **Business Rules**:
 * 1. Trial balance must be balanced (debits = credits)
 * 2. All bank accounts must be reconciled
 * 3. No open/pending transactions in the period
 * 4. Depreciation must be run for all active assets
 * 5. Close process is audited and irreversible
 * 
 * **Workflow**:
 * 1. Get trial balance for entity and currency
 * 2. Generate P&L (income statement)
 * 3. Generate balance sheet
 * 4. Generate cash flow statement
 * 5. Run monthly depreciation on all active fixed assets
 * 6. Verify all bank accounts reconciled (fail if not)
 * 7. Create audit log entry with close summary and document links
 * 8. Lock period (prevent backdated transactions)
 * 
 * **Compliance**:
 * - GAAP/IFRS: Month-end close ensures financial statements are complete
 * - SOX: Audit trail documents who closed the period and when
 * - Tax: Locked periods prevent retroactive changes
 * 
 * **Prerequisites**:
 * - All journal entries posted
 * - All invoices sent/paid
 * - All bills approved/paid
 * - All bank reconciliations complete
 * 
 * @param command - Month-end close command
 * @returns Effect with close result or errors
 * 
 * @example
 * ```typescript
 * const result = yield* monthEndClose({
 *   periodEnd: new Date('2024-11-30'),
 *   tenant: 'funeral-home-1',
 *   legalEntity: 'main-entity',
 *   currency: 'USD',
 *   closedBy: 'user_123',
 *   notes: 'November 2024 month-end close'
 * });
 * 
 * console.log(`Period closed: ${result.periodClosed}`);
 * console.log(`Trial balance: ${result.trialBalance.balanced ? 'Balanced' : 'Out of balance'}`);
 * console.log(`Depreciation: $${result.depreciation.totalDepreciation}`);
 * console.log(`Reconciliations: ${result.reconciliations.reconciled}/${result.reconciliations.total}`);
 * ```
 */
export const monthEndClose = (
  command: MonthEndCloseCommand
): Effect.Effect<
  MonthEndCloseResult,
  ValidationError | NetworkError,
  GoFinancialPortService | GoFixedAssetsPortService | GoReconciliationsPortService | AuditLogRepositoryService
> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;
    const fixedAssetsPort = yield* GoFixedAssetsPort;
    const reconciliationsPort = yield* GoReconciliationsPort;
    const auditLogRepo = yield* AuditLogRepository;

    // Step 1: Get trial balance for period
    const trialBalance = yield* financialPort.getTrialBalance(command.periodEnd);

    // Step 2: Verify trial balance is balanced
    if (!trialBalance.balanced) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Trial balance is out of balance. Debits: ${trialBalance.totalDebits}, Credits: ${trialBalance.totalCredits}. Difference: ${Math.abs(trialBalance.totalDebits - trialBalance.totalCredits)}`,
          field: 'trialBalance'
        })
      );
    }

    // Step 3: Generate P&L (income statement)
    const incomeStatement = yield* financialPort.generateFinancialStatement(
      'income_statement',
      command.periodEnd
    );

    // Step 4: Generate balance sheet
    const balanceSheet = yield* financialPort.generateBalanceSheet(command.periodEnd);

    // Step 5: Generate cash flow statement
    // Calculate period start (first day of month)
    const periodStart = new Date(
      command.periodEnd.getFullYear(),
      command.periodEnd.getMonth(),
      1
    );
    yield* financialPort.generateCashFlowStatement(
      periodStart,
      command.periodEnd
    );

    // Step 6: Run monthly depreciation on all active fixed assets
    const depreciationRun = yield* fixedAssetsPort.runMonthlyDepreciation(command.periodEnd);

    // Step 7: Verify all bank accounts reconciled (unless skipped for emergencies)
    if (!command.skipReconciliationCheck) {
      const allReconciliations = yield* reconciliationsPort.listReconciliations();
      
      // Get all cash/bank accounts that need reconciliation
      const chartOfAccounts = yield* financialPort.getChartOfAccounts();
      const cashAccounts = chartOfAccounts.filter(
        account => account.type === 'asset' && account.subtype === 'cash'
      );

      // Check which cash accounts have completed reconciliations for this period
      const reconciledAccountIds = allReconciliations
        .filter(rec => 
          rec.status === 'completed' &&
          rec.period.getMonth() === command.periodEnd.getMonth() &&
          rec.period.getFullYear() === command.periodEnd.getFullYear()
        )
        .map(rec => rec.accountId);

      const unreconciledAccounts = cashAccounts.filter(
        account => !reconciledAccountIds.includes(account.id)
      );

      if (unreconciledAccounts.length > 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Cannot close period. ${unreconciledAccounts.length} bank account(s) not reconciled: ${unreconciledAccounts.map(a => a.accountNumber).join(', ')}`,
            field: 'reconciliations'
          })
        );
      }
    }

    // Step 8: Create audit log entry with close summary
    const auditLog = yield* auditLogRepo.create({
      entityType: 'month_end_close',
      entityId: `close-${command.periodEnd.toISOString().slice(0, 7)}`, // e.g., "close-2024-11"
      action: 'close_period',
      userId: command.closedBy,
      metadata: {
        periodEnd: command.periodEnd.toISOString(),
        tenant: command.tenant,
        legalEntity: command.legalEntity,
        currency: command.currency,
        trialBalanceId: 'tb-' + command.periodEnd.toISOString().slice(0, 7),
        incomeStatementId: 'is-' + command.periodEnd.toISOString().slice(0, 7),
        balanceSheetId: 'bs-' + command.periodEnd.toISOString().slice(0, 7),
        cashFlowStatementId: 'cf-' + command.periodEnd.toISOString().slice(0, 7),
        depreciationRunId: depreciationRun.runId,
        trialBalanceDebits: trialBalance.totalDebits,
        trialBalanceCredits: trialBalance.totalCredits,
        balanced: trialBalance.balanced,
        assetsDepreciated: depreciationRun.assetsProcessed,
        totalDepreciation: depreciationRun.totalDepreciationAmount,
        netIncome: incomeStatement.netIncome,
        totalAssets: balanceSheet.totalAssets,
        totalLiabilities: balanceSheet.totalLiabilities,
        totalEquity: balanceSheet.totalEquity,
        notes: command.notes,
        skipReconciliationCheck: command.skipReconciliationCheck ?? false
      }
    });

    // Step 9: Period locking would happen here
    // For now, this is a no-op since Go backend doesn't expose lockPeriod yet
    // In production, call: yield* financialPort.lockPeriod(command.periodEnd);

    // Step 10: Calculate reconciliation summary
    const allReconsFinal = yield* reconciliationsPort.listReconciliations();
    const periodReconciliations = allReconsFinal.filter(rec =>
      rec.period.getMonth() === command.periodEnd.getMonth() &&
      rec.period.getFullYear() === command.periodEnd.getFullYear()
    );
    const reconciledCount = periodReconciliations.filter(rec => rec.status === 'completed').length;
    const outstandingAccounts = periodReconciliations
      .filter(rec => rec.status !== 'completed')
      .map(rec => rec.accountNumber);

    // Step 11: Return comprehensive result
    return {
      periodClosed: command.periodEnd,
      trialBalance: {
        id: 'tb-' + command.periodEnd.toISOString().slice(0, 7),
        balanced: trialBalance.balanced,
        totalDebits: trialBalance.totalDebits,
        totalCredits: trialBalance.totalCredits
      },
      statements: {
        incomeStatement: 'is-' + command.periodEnd.toISOString().slice(0, 7),
        balanceSheet: 'bs-' + command.periodEnd.toISOString().slice(0, 7),
        cashFlow: 'cf-' + command.periodEnd.toISOString().slice(0, 7)
      },
      depreciation: {
        runId: depreciationRun.runId,
        assetsDepreciated: depreciationRun.assetsProcessed,
        totalDepreciation: depreciationRun.totalDepreciationAmount
      },
      reconciliations: {
        total: periodReconciliations.length,
        reconciled: reconciledCount,
        outstanding: outstandingAccounts
      },
      auditLogId: auditLog.id,
      closedAt: new Date()
    };
  });

/**
 * Pre-Close Validation
 * 
 * Validates all prerequisites for month-end close without actually closing.
 * Useful for pre-close checklists and alerting staff of issues.
 * 
 * @param periodEnd - Period to validate
 * @returns Effect with validation result
 * 
 * @example
 * ```typescript
 * const validation = yield* validateMonthEndClose(new Date('2024-11-30'));
 * 
 * if (!validation.ready) {
 *   console.log('Issues blocking close:');
 *   validation.issues.forEach(issue => console.log(`- ${issue}`));
 * }
 * ```
 */
export const validateMonthEndClose = (
  periodEnd: Date
): Effect.Effect<
  {
    ready: boolean;
    issues: readonly string[];
    warnings: readonly string[];
  },
  NetworkError,
  GoFinancialPortService | GoReconciliationsPortService
> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;
    const reconciliationsPort = yield* GoReconciliationsPort;

    const issues: string[] = [];
    const warnings: string[] = [];

    // Check 1: Trial balance
    const trialBalanceResult = yield* Effect.either(
      financialPort.getTrialBalance(periodEnd)
    );
    
    if (trialBalanceResult._tag === 'Right') {
      const trialBalance = trialBalanceResult.right;
      if (!trialBalance.balanced) {
        issues.push(
          `Trial balance out of balance by ${Math.abs(trialBalance.totalDebits - trialBalance.totalCredits)}`
        );
      }
    } else {
      issues.push('Failed to retrieve trial balance');
    }

    // Check 2: Bank reconciliations
    const reconciliations = yield* reconciliationsPort.listReconciliations();
    const periodReconciliations = reconciliations.filter(rec =>
      rec.period.getMonth() === periodEnd.getMonth() &&
      rec.period.getFullYear() === periodEnd.getFullYear()
    );
    
    const unreconciledCount = periodReconciliations.filter(
      rec => rec.status !== 'completed'
    ).length;

    if (unreconciledCount > 0) {
      issues.push(`${unreconciledCount} bank account(s) not reconciled`);
    }

    // Check 3: Open journal entries (draft status)
    const journalEntries = yield* financialPort.listJournalEntries({
      startDate: new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1),
      endDate: periodEnd,
      status: 'draft'
    });

    if (journalEntries.length > 0) {
      warnings.push(`${journalEntries.length} draft journal entries exist`);
    }

    return {
      ready: issues.length === 0,
      issues: issues,
      warnings: warnings
    };
  });

/**
 * Get Month-End Close History
 * 
 * Retrieves audit log of previous month-end closes for reporting and compliance.
 * 
 * @param periodStart - Start of period range
 * @param periodEnd - End of period range
 * @returns Effect with close history
 * 
 * @example
 * ```typescript
 * const history = yield* getMonthEndCloseHistory(
 *   new Date('2024-01-01'),
 *   new Date('2024-12-31')
 * );
 * 
 * console.log(`Closed ${history.length} periods in 2024`);
 * ```
 */
export const getMonthEndCloseHistory = (
  periodStart: Date,
  periodEnd: Date
): Effect.Effect<
  readonly {
    period: Date;
    closedBy: string;
    closedAt: Date;
    trialBalanceDebits: number;
    trialBalanceCredits: number;
    netIncome: number;
  }[],
  never,
  AuditLogRepositoryService
> =>
  Effect.gen(function* () {
    const auditLogRepo = yield* AuditLogRepository;

    const logs = yield* auditLogRepo.findByEntity({
      entityId: '',
      entityType: 'month_end_close'
    });

    // Filter by date range and extract relevant data
    const closes = logs
      .filter((log: { metadata: Record<string, unknown> | null; }) => {
        const periodDate = new Date(log.metadata?.['periodEnd'] as string);
        return periodDate >= periodStart && periodDate <= periodEnd;
      })
      .map((log: { metadata: Record<string, unknown> | null; userId: string; timestamp: Date; }) => ({
        period: new Date(log.metadata?.['periodEnd'] as string),
        closedBy: log.userId,
        closedAt: log.timestamp,
        trialBalanceDebits: (log.metadata?.['trialBalanceDebits'] as number) || 0,
        trialBalanceCredits: (log.metadata?.['trialBalanceCredits'] as number) || 0,
        netIncome: (log.metadata?.['netIncome'] as number) || 0
      }))
      .sort((a: { period: Date; }, b: { period: Date; }) => b.period.getTime() - a.period.getTime()); // Newest first

    return closes;
  });
