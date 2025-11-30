/**
 * Integration Tests: Finalize Case with GL Posting
 * 
 * Tests the complete case finalization workflow with revenue recognition:
 * - Load case and validate status
 * - Fetch contract from Go backend
 * - Calculate revenue breakdown by category
 * - Create GL journal entry (DR: AR, CR: Revenue accounts)
 * - Post journal entry to TigerBeetle
 * - Update case with GL reference
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import { finalizeCaseWithGLPosting } from '../finalize-case-with-gl-posting';
import { Case, ValidationError, type CaseId } from '@dykstra/domain';
import { 
  CaseRepository,
  GoContractPort,
  GoFinancialPort,
  type GoContractPortService,
  type GoFinancialPortService,
} from '@dykstra/application';

describe('Finalize Case with GL Posting Integration Tests', () => {
  const mockCaseRepo = {
    findByBusinessKey: vi.fn(),
    update: vi.fn(),
  } as any;

  const mockContractPort: GoContractPortService = {
    getContract: vi.fn(),
  } as any;

  const mockFinancialPort: GoFinancialPortService = {
    getGLAccountByNumber: vi.fn(),
    createJournalEntry: vi.fn(),
    postJournalEntry: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path: Complete Finalization Workflow', () => {
    it('should finalize case and post revenue recognition journal entry', async () => {
      // Arrange: Active case with contract
      const mockCase = new Case({
        id: 'case-001' as CaseId,
        businessKey: 'CASE-2025-001',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'John Smith',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'active' as const,
        serviceType: 'traditional',
        serviceDate: new Date(),
        arrangements: null,
        goContractId: 'contract-001',
        glJournalEntryId: null,
        revenueAmount: null,
        cogsAmount: null,
        cogsJournalEntryId: null,
        inventoryDeliveredAt: null,
        inventoryDeliveredBy: null,
        finalizedAt: null,
        finalizedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
      });

      const mockContract = {
        id: 'contract-001',
        caseId: 'case-001',
        status: 'active' as const,
        totalAmount: 15000,
        services: [
          { id: 'svc-1', description: 'Professional services', quantity: 1, unitPrice: 5000, totalPrice: 5000, glAccountId: '4100' },
          { id: 'svc-2', description: 'Facilities', quantity: 1, unitPrice: 2000, totalPrice: 2000, glAccountId: '4100' },
        ],
        products: [
          { id: 'prod-1', description: 'Oak casket', quantity: 1, unitPrice: 8000, totalPrice: 8000, glAccountId: '4200' },
        ],
        createdAt: new Date(),
      };

      const mockARAccount = { id: 'ar-1', accountNumber: '1200', name: 'Accounts Receivable', type: 'asset' };
      const mockServiceRevAccount = { id: 'rev-svc-1', accountNumber: '4100', name: 'Revenue - Professional Services', type: 'revenue' };
      const mockMerchRevAccount = { id: 'rev-merch-1', accountNumber: '4200', name: 'Revenue - Merchandise', type: 'revenue' };

      const mockJournalEntry = {
        id: 'je-001',
        entryNumber: 'JE-2025-001',
        entryDate: new Date(),
        description: 'Revenue recognition for case CASE-2025-001',
        status: 'posted' as const,
        lines: [],
        totalDebit: 15000,
        totalCredit: 15000,
        postedAt: new Date(),
      };

      const mockFinalizedCase = new Case({
        ...mockCase,
        version: 2,
        status: 'completed' as const,
        glJournalEntryId: 'je-001',
        revenueAmount: 15000,
        finalizedAt: new Date(),
        finalizedBy: 'user-1',
      });

      vi.mocked(mockCaseRepo.findByBusinessKey).mockReturnValue(Effect.succeed(mockCase));
      vi.mocked(mockContractPort.getContract).mockReturnValue(Effect.succeed(mockContract));
      vi.mocked(mockFinancialPort.getGLAccountByNumber)
        .mockReturnValueOnce(Effect.succeed(mockARAccount))
        .mockReturnValueOnce(Effect.succeed(mockServiceRevAccount))
        .mockReturnValueOnce(Effect.succeed(mockMerchRevAccount));
      vi.mocked(mockFinancialPort.createJournalEntry).mockReturnValue(Effect.succeed(mockJournalEntry));
      vi.mocked(mockFinancialPort.postJournalEntry).mockReturnValue(Effect.succeed(void 0));
      vi.mocked(mockCaseRepo.update).mockReturnValue(Effect.succeed(mockFinalizedCase));

      const command = {
        caseBusinessKey: 'CASE-2025-001',
        actorUserId: 'user-1',
      };

      // Act
      const program = finalizeCaseWithGLPosting(command);
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(CaseRepository, mockCaseRepo),
          Effect.provideService(GoContractPort, mockContractPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assert
      expect(result.caseId).toBe('CASE-2025-001');
      expect(result.journalEntryId).toBe('je-001');
      expect(result.totalAmount).toBe(15000);
      expect(result.glAccountsPosted).toContain('1200'); // AR
      expect(result.glAccountsPosted).toContain('4100'); // Services
      expect(result.glAccountsPosted).toContain('4200'); // Merchandise

      // Verify workflow execution
      expect(mockContractPort.getContract).toHaveBeenCalledWith('contract-001');
      expect(mockFinancialPort.createJournalEntry).toHaveBeenCalled();
      expect(mockFinancialPort.postJournalEntry).toHaveBeenCalledWith('je-001');
      expect(mockCaseRepo.update).toHaveBeenCalled();
    });

    it('should calculate correct revenue breakdown by category', async () => {
      // Arrange: Case with mixed service and merchandise revenue
      const mockCase = new Case({
        id: 'case-002' as CaseId,
        businessKey: 'CASE-2025-002',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'Jane Doe',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'active' as const,
        serviceType: 'cremation',
        serviceDate: new Date(),
        arrangements: null,
        goContractId: 'contract-002',
        glJournalEntryId: null,
        revenueAmount: null,
        cogsAmount: null,
        cogsJournalEntryId: null,
        inventoryDeliveredAt: null,
        inventoryDeliveredBy: null,
        finalizedAt: null,
        finalizedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
      });

      const mockContract = {
        id: 'contract-002',
        status: 'active' as const,
        totalAmount: 8500,
        services: [
          { id: 'svc-1', description: 'Cremation services', quantity: 1, unitPrice: 3500, totalPrice: 3500, glAccountId: '4100' },
        ],
        products: [
          { id: 'prod-1', description: 'Urn', quantity: 1, unitPrice: 5000, totalPrice: 5000, glAccountId: '4200' },
        ],
        createdAt: new Date(),
      };

      vi.mocked(mockCaseRepo.findByBusinessKey).mockReturnValue(Effect.succeed(mockCase));
      vi.mocked(mockContractPort.getContract).mockReturnValue(Effect.succeed(mockContract));
      vi.mocked(mockFinancialPort.getGLAccountByNumber).mockReturnValue(
        Effect.succeed({ id: 'acct-1', accountNumber: '1200', name: 'Account', type: 'asset' })
      );
      vi.mocked(mockFinancialPort.createJournalEntry).mockImplementation((cmd) => {
        // Verify revenue breakdown
        expect(cmd.lines.length).toBe(3); // 1 DR AR + 2 CR revenue lines
        const serviceRevLine = cmd.lines.find(line => line.credit === 3500);
        const merchRevLine = cmd.lines.find(line => line.credit === 5000);
        expect(serviceRevLine).toBeDefined();
        expect(merchRevLine).toBeDefined();
        
        return Effect.succeed({ id: 'je-002', entryNumber: 'JE-002' } as any);
      });
      vi.mocked(mockFinancialPort.postJournalEntry).mockReturnValue(Effect.succeed(void 0));
      vi.mocked(mockCaseRepo.update).mockImplementation((updatedCase) => {
        // Verify the case was finalized with correct data
        expect(updatedCase.glJournalEntryId).toBe('je-002');
        return Effect.succeed(updatedCase);
      });

      // Act
      const program = finalizeCaseWithGLPosting({
        caseBusinessKey: 'CASE-2025-002',
        actorUserId: 'user-1',
      });

      await Effect.runPromise(
        program.pipe(
          Effect.provideService(CaseRepository, mockCaseRepo),
          Effect.provideService(GoContractPort, mockContractPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assert: Verification done in mockImplementation
      expect(mockFinancialPort.createJournalEntry).toHaveBeenCalled();
    });
  });

  describe('Validation Rules', () => {
    it('should reject finalization when case has no contract', async () => {
      // Arrange: Case without contract
      const mockCase = new Case({
        id: 'case-003' as CaseId,
        businessKey: 'CASE-2025-003',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'Bob Johnson',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'active' as const,
        serviceType: null,
        serviceDate: null,
        arrangements: null,
        goContractId: null, // No contract
        glJournalEntryId: null,
        revenueAmount: null,
        cogsAmount: null,
        cogsJournalEntryId: null,
        inventoryDeliveredAt: null,
        inventoryDeliveredBy: null,
        finalizedAt: null,
        finalizedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
      });

      vi.mocked(mockCaseRepo.findByBusinessKey).mockReturnValue(Effect.succeed(mockCase));

      // Act & Assert
      const program = finalizeCaseWithGLPosting({
        caseBusinessKey: 'CASE-2025-003',
        actorUserId: 'user-1',
      });

      await expect(
        Effect.runPromise(
          program.pipe(
            Effect.provideService(CaseRepository, mockCaseRepo),
            Effect.provideService(GoContractPort, mockContractPort),
            Effect.provideService(GoFinancialPort, mockFinancialPort)
          )
        )
      ).rejects.toThrow();
    });

    it('should reject finalization for archived case', async () => {
      // Arrange: Archived case
      const mockCase = new Case({
        id: 'case-004' as CaseId,
        businessKey: 'CASE-2025-004',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'Alice Brown',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'archived' as const, // Archived
        serviceType: 'traditional',
        serviceDate: new Date(),
        arrangements: null,
        goContractId: 'contract-004',
        glJournalEntryId: null,
        revenueAmount: null,
        cogsAmount: null,
        cogsJournalEntryId: null,
        inventoryDeliveredAt: null,
        inventoryDeliveredBy: null,
        finalizedAt: null,
        finalizedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
      });

      vi.mocked(mockCaseRepo.findByBusinessKey).mockReturnValue(Effect.succeed(mockCase));

      // Act & Assert
      const program = finalizeCaseWithGLPosting({
        caseBusinessKey: 'CASE-2025-004',
        actorUserId: 'user-1',
      });

      await expect(
        Effect.runPromise(
          program.pipe(
            Effect.provideService(CaseRepository, mockCaseRepo),
            Effect.provideService(GoContractPort, mockContractPort),
            Effect.provideService(GoFinancialPort, mockFinancialPort)
          )
        )
      ).rejects.toThrow();
    });

    it('should reject finalization when contract is not active/completed', async () => {
      // Arrange: Case with draft contract
      const mockCase = new Case({
        id: 'case-005' as CaseId,
        businessKey: 'CASE-2025-005',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'Charlie Wilson',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'active' as const,
        serviceType: 'memorial',
        serviceDate: new Date(),
        arrangements: null,
        goContractId: 'contract-005',
        glJournalEntryId: null,
        revenueAmount: null,
        cogsAmount: null,
        cogsJournalEntryId: null,
        inventoryDeliveredAt: null,
        inventoryDeliveredBy: null,
        finalizedAt: null,
        finalizedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
      });

      const mockContract = {
        id: 'contract-005',
        status: 'draft' as const, // Not active/completed
        totalAmount: 10000,
        services: [],
        products: [],
        createdAt: new Date(),
      };

      vi.mocked(mockCaseRepo.findByBusinessKey).mockReturnValue(Effect.succeed(mockCase));
      vi.mocked(mockContractPort.getContract).mockReturnValue(Effect.succeed(mockContract));

      // Act & Assert
      const program = finalizeCaseWithGLPosting({
        caseBusinessKey: 'CASE-2025-005',
        actorUserId: 'user-1',
      });

      await expect(
        Effect.runPromise(
          program.pipe(
            Effect.provideService(CaseRepository, mockCaseRepo),
            Effect.provideService(GoContractPort, mockContractPort),
            Effect.provideService(GoFinancialPort, mockFinancialPort)
          )
        )
      ).rejects.toThrow();
    });
  });

  describe('GL Account Categorization', () => {
    it('should post to correct GL accounts based on line item type', async () => {
      // This test verifies the journal entry structure
      const mockCase = new Case({
        id: 'case-006' as CaseId,
        businessKey: 'CASE-2025-006',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'Test User',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'active' as const,
        serviceType: 'traditional',
        serviceDate: new Date(),
        arrangements: null,
        goContractId: 'contract-006',
        glJournalEntryId: null,
        revenueAmount: null,
        cogsAmount: null,
        cogsJournalEntryId: null,
        inventoryDeliveredAt: null,
        inventoryDeliveredBy: null,
        finalizedAt: null,
        finalizedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
      });

      const mockContract = {
        id: 'contract-006',
        status: 'active' as const,
        totalAmount: 12000,
        services: [{ id: 's1', description: 'Service', quantity: 1, unitPrice: 5000, totalPrice: 5000, glAccountId: '4100' }],
        products: [{ id: 'p1', description: 'Product', quantity: 1, unitPrice: 7000, totalPrice: 7000, glAccountId: '4200' }],
        createdAt: new Date(),
      };

      vi.mocked(mockCaseRepo.findByBusinessKey).mockReturnValue(Effect.succeed(mockCase));
      vi.mocked(mockContractPort.getContract).mockReturnValue(Effect.succeed(mockContract));
      vi.mocked(mockFinancialPort.getGLAccountByNumber).mockReturnValue(
        Effect.succeed({ id: 'acct', accountNumber: '1200', name: 'Account', type: 'asset' })
      );

      let capturedJournalEntry: any;
      vi.mocked(mockFinancialPort.createJournalEntry).mockImplementation((cmd) => {
        capturedJournalEntry = cmd;
        return Effect.succeed({ id: 'je-006', entryNumber: 'JE-006' } as any);
      });
      vi.mocked(mockFinancialPort.postJournalEntry).mockReturnValue(Effect.succeed(void 0));
      vi.mocked(mockCaseRepo.update).mockReturnValue(Effect.succeed({} as any));

      // Act
      const program = finalizeCaseWithGLPosting({
        caseBusinessKey: 'CASE-2025-006',
        actorUserId: 'user-1',
      });

      await Effect.runPromise(
        program.pipe(
          Effect.provideService(CaseRepository, mockCaseRepo),
          Effect.provideService(GoContractPort, mockContractPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assert: Journal entry structure
      expect(capturedJournalEntry).toBeDefined();
      expect(capturedJournalEntry.lines.length).toBeGreaterThanOrEqual(2); // At least DR AR + CR revenue
      
      // Verify debits equal credits
      const totalDebits = capturedJournalEntry.lines.reduce((sum: number, line: any) => sum + line.debit, 0);
      const totalCredits = capturedJournalEntry.lines.reduce((sum: number, line: any) => sum + line.credit, 0);
      expect(totalDebits).toBe(totalCredits);
      expect(totalDebits).toBe(12000);
    });
  });
});
