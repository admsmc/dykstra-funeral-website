/**
 * Integration Tests: Bank Reconciliation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import { startBankReconciliation, clearReconciliationItems, completeBankReconciliation } from '../bank-reconciliation';
import { GoReconciliationsPort, GoFinancialPort, type GoReconciliationsPortService, type GoFinancialPortService } from '@dykstra/application';

describe('Bank Reconciliation Integration Tests', () => {
  const mockReconPort: GoReconciliationsPortService = {
    createReconciliation: vi.fn(),
    getReconciliationItems: vi.fn(),
    markItemCleared: vi.fn(),
    completeReconciliation: vi.fn(),
  } as any;

  const mockFinancialPort: GoFinancialPortService = {
    getGLAccountByNumber: vi.fn(),
    createJournalEntry: vi.fn(),
    postJournalEntry: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start reconciliation and return unmatched items', async () => {
    vi.mocked(mockFinancialPort.getGLAccountByNumber).mockReturnValue(
      Effect.succeed({ id: 'acct-1', accountNumber: '1010', type: 'asset', name: 'Cash' })
    );
    vi.mocked(mockReconPort.createReconciliation).mockReturnValue(
      Effect.succeed({
        id: 'recon-1',
        accountId: 'acct-1',
        accountNumber: '1010',
        period: new Date(),
        glBalance: 10000,
        statementBalance: 9500,
      } as any)
    );
    vi.mocked(mockReconPort.getReconciliationItems).mockReturnValue(
      Effect.succeed([
        { id: 'item-1', cleared: false, amount: 500 },
        { id: 'item-2', cleared: true, amount: 200 },
      ] as any)
    );

    const program = startBankReconciliation({
      accountId: 'acct-1',
      accountNumber: '1010',
      period: new Date(),
      statementBalance: 9500,
      statementDate: new Date(),
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provideService(GoReconciliationsPort, mockReconPort),
        Effect.provideService(GoFinancialPort, mockFinancialPort)
      )
    );

    expect(result.difference).toBe(500);
    expect(result.unmatchedItems).toHaveLength(1);
  });

  it('should clear multiple items', async () => {
    vi.mocked(mockReconPort.markItemCleared).mockReturnValue(Effect.succeed(void 0));

    const program = clearReconciliationItems({
      reconciliationId: 'recon-1',
      itemIds: ['item-1', 'item-2'],
    });

    await Effect.runPromise(
      program.pipe(Effect.provideService(GoReconciliationsPort, mockReconPort))
    );

    expect(mockReconPort.markItemCleared).toHaveBeenCalledTimes(2);
  });
});
