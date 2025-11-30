/**
 * Integration Tests: Month-End Close
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import { monthEndClose } from '../month-end-close';
import { GoFinancialPort, GoFixedAssetsPort, GoReconciliationsPort, AuditLogRepository, type GoFinancialPortService, type GoFixedAssetsPortService, type GoReconciliationsPortService, type AuditLogRepository as AuditLogRepositoryService } from '@dykstra/application';

describe('Month-End Close Integration Tests', () => {
  const mockFinancialPort: GoFinancialPortService = {
    getTrialBalance: vi.fn(),
    generateFinancialStatement: vi.fn(),
    generateBalanceSheet: vi.fn(),
    generateCashFlowStatement: vi.fn(),
    getChartOfAccounts: vi.fn(),
  } as any;

  const mockFixedAssetsPort: GoFixedAssetsPortService = {
    runMonthlyDepreciation: vi.fn(),
  } as any;

  const mockReconPort: GoReconciliationsPortService = {
    listReconciliations: vi.fn(),
  } as any;

  const mockAuditRepo: AuditLogRepositoryService = {
    create: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete month-end close with balanced trial balance', async () => {
    const periodEnd = new Date('2025-11-30');
    
    vi.mocked(mockFinancialPort.getTrialBalance).mockReturnValue(
      Effect.succeed({ balanced: true, totalDebits: 100000, totalCredits: 100000 })
    );
    vi.mocked(mockFinancialPort.generateFinancialStatement).mockReturnValue(
      Effect.succeed({ id: 'stmt-1', netIncome: 10000 } as any)
    );
    vi.mocked(mockFinancialPort.generateBalanceSheet).mockReturnValue(
      Effect.succeed({ 
        id: 'bs-1', 
        documentUrl: 'url-1',
        totalAssets: 200000,
        totalLiabilities: 50000,
        totalEquity: 150000
      } as any)
    );
    vi.mocked(mockFinancialPort.generateCashFlowStatement).mockReturnValue(
      Effect.succeed({ id: 'cf-1' } as any)
    );
    vi.mocked(mockFixedAssetsPort.runMonthlyDepreciation).mockReturnValue(
      Effect.succeed({ 
        runId: 'depr-1', 
        assetsProcessed: 5, 
        totalDepreciationAmount: 2000 
      })
    );
    vi.mocked(mockReconPort.listReconciliations).mockReturnValue(
      Effect.succeed([
        { id: 'rec-1', status: 'completed' as const, accountId: 'cash-1', accountNumber: '1010', period: periodEnd },
      ] as any)
    );
    vi.mocked(mockFinancialPort.getChartOfAccounts).mockReturnValue(
      Effect.succeed([{ id: 'cash-1', type: 'asset', subtype: 'cash', accountNumber: '1010' }] as any)
    );
    vi.mocked(mockAuditRepo.create).mockReturnValue(
      Effect.succeed({ id: 'audit-1' } as any)
    );

    const program = monthEndClose({
      periodEnd,
      tenant: 'tenant-1',
      closedBy: 'user-1',
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provideService(GoFinancialPort, mockFinancialPort),
        Effect.provideService(GoFixedAssetsPort, mockFixedAssetsPort),
        Effect.provideService(GoReconciliationsPort, mockReconPort),
        Effect.provideService(AuditLogRepository, mockAuditRepo)
      )
    );

    expect(result.trialBalance.balanced).toBe(true);
    expect(result.depreciation.totalDepreciation).toBe(2000);
    expect(result.depreciation.assetsDepreciated).toBe(5);
    expect(result.statements.balanceSheet).toBe('bs-2025-11');
  });

  it('should reject close with unbalanced trial balance', async () => {
    vi.mocked(mockFinancialPort.getTrialBalance).mockReturnValue(
      Effect.succeed({ balanced: false, totalDebits: 100000, totalCredits: 100100 })
    );

    const program = monthEndClose({
      periodEnd: new Date(),
      tenant: 'tenant-1',
      closedBy: 'user-1',
    });

    await expect(
      Effect.runPromise(
        program.pipe(
          Effect.provideService(GoFinancialPort, mockFinancialPort),
          Effect.provideService(GoFixedAssetsPort, mockFixedAssetsPort),
          Effect.provideService(GoReconciliationsPort, mockReconPort),
          Effect.provideService(AuditLogRepository, mockAuditRepo)
        )
      )
    ).rejects.toThrow();
  });
});
