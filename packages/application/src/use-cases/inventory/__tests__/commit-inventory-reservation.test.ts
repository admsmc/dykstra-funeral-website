/**
 * Integration Tests: Commit Inventory Reservation
 * 
 * Tests the complete COGS tracking workflow:
 * - Load case with inventory reservations
 * - Commit reservations (reserved → sold)
 * - Get WAC cost from Go backend
 * - Create COGS journal entry (DR: COGS, CR: Inventory Asset)
 * - Update case with COGS tracking
 * - Calculate case profitability
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import { commitInventoryReservation } from '../commit-inventory-reservation';
import { Case, ValidationError, type CaseId } from '@dykstra/domain';
import { 
  CaseRepository,
  GoInventoryPort,
  GoFinancialPort,
  type GoInventoryPortService,
  type GoFinancialPortService,
} from '@dykstra/application';

describe('Commit Inventory Reservation Integration Tests', () => {
  const mockCaseRepo: CaseRepository = {
    findById: vi.fn(),
    update: vi.fn(),
  } as any;

  const mockInventoryPort: GoInventoryPortService = {
    getReservationsByCase: vi.fn(),
    commitReservation: vi.fn(),
    getItem: vi.fn(),
    getBalance: vi.fn(),
  } as any;

  const mockFinancialPort: GoFinancialPortService = {
    createJournalEntry: vi.fn(),
    postJournalEntry: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path: Commit Reservations with COGS Posting', () => {
    it('should commit reservations and create COGS journal entry', async () => {
      // Arrange: Case with active reservations
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
        serviceType: null,
        serviceDate: null,
        arrangements: null,
        goContractId: 'contract-001',
        glJournalEntryId: null,
        revenueAmount: 15000,
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

      const mockReservations = [
        {
          id: 'res-001',
          itemId: 'item-001',
          caseId: 'case-001',
          quantity: 1,
          status: 'active' as const,
          locationId: 'main',
          reservedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ];

      const mockItem = {
        id: 'item-001',
        sku: 'CASKET-001',
        description: 'Premium Oak Casket',
        category: 'casket',
        currentCost: 2500,
        retailPrice: 6000,
        reorderPoint: 3,
        reorderQuantity: 5,
        glAccountId: '1300',
        status: 'active' as const,
        unitOfMeasure: 'each',
        isSerialTracked: false,
      };

      const mockBalance = {
        itemId: 'item-001',
        locationId: 'main',
        quantityOnHand: 5,
        quantityReserved: 1,
        quantityAvailable: 4,
        weightedAverageCost: 2400, // WAC cost
      };

      const mockJournalEntry = {
        id: 'je-001',
        entryNumber: 'JE-2025-001',
        entryDate: new Date(),
        description: 'COGS for Case CASE-2025-001',
        status: 'posted' as const,
        lines: [],
        totalDebit: 2400,
        totalCredit: 2400,
        postedAt: new Date(),
        postedBy: 'user-1',
      };

      const mockUpdatedCase = new Case({
        ...mockCase,
        version: 2,
        cogsAmount: 2400,
        cogsJournalEntryId: 'je-001',
        inventoryDeliveredAt: new Date(),
        inventoryDeliveredBy: 'user-1',
      });

      vi.mocked(mockCaseRepo.findById).mockReturnValue(
        Effect.succeed(mockCase)
      );

      vi.mocked(mockInventoryPort.getReservationsByCase).mockReturnValue(
        Effect.succeed(mockReservations)
      );

      vi.mocked(mockInventoryPort.commitReservation).mockReturnValue(
        Effect.succeed(void 0)
      );

      vi.mocked(mockInventoryPort.getItem).mockReturnValue(
        Effect.succeed(mockItem)
      );

      vi.mocked(mockInventoryPort.getBalance).mockReturnValue(
        Effect.succeed(mockBalance)
      );

      vi.mocked(mockFinancialPort.createJournalEntry).mockReturnValue(
        Effect.succeed(mockJournalEntry)
      );

      vi.mocked(mockFinancialPort.postJournalEntry).mockReturnValue(
        Effect.succeed(void 0)
      );

      vi.mocked(mockCaseRepo.update).mockReturnValue(
        Effect.succeed(mockUpdatedCase)
      );

      const command = {
        caseId: 'case-001',
        deliveredBy: 'user-1',
        deliveryDate: new Date().toISOString(),
      };

      // Act
      const program = commitInventoryReservation(command);
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(CaseRepository, mockCaseRepo),
          Effect.provideService(GoInventoryPort, mockInventoryPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assert
      expect(result.caseId).toBe('case-001');
      expect(result.cogsAmount).toBe(2400);
      expect(result.journalEntryId).toBe('je-001');
      expect(result.itemsCommitted).toHaveLength(1);
      expect(result.itemsCommitted[0].unitCost).toBe(2400); // WAC cost
      expect(result.grossProfit).toBe(12600); // 15000 - 2400
      expect(result.grossMarginPercent).toBeCloseTo(84, 0);

      // Verify workflow execution
      expect(mockInventoryPort.commitReservation).toHaveBeenCalledWith('res-001');
      expect(mockInventoryPort.getBalance).toHaveBeenCalledWith('item-001', 'main');
      expect(mockFinancialPort.createJournalEntry).toHaveBeenCalled();
      expect(mockFinancialPort.postJournalEntry).toHaveBeenCalledWith('je-001');
      expect(mockCaseRepo.update).toHaveBeenCalled();
    });

    it('should calculate profitability metrics correctly', async () => {
      // Arrange: Case with revenue and multiple items
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
        serviceType: null,
        serviceDate: null,
        arrangements: null,
        goContractId: 'contract-002',
        glJournalEntryId: null,
        revenueAmount: 20000, // High revenue
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

      const mockReservations = [
        {
          id: 'res-001',
          itemId: 'item-001',
          caseId: 'case-002',
          quantity: 1,
          status: 'active' as const,
          locationId: 'main',
          reservedAt: new Date(),
          expiresAt: new Date(),
        },
        {
          id: 'res-002',
          itemId: 'item-002',
          caseId: 'case-002',
          quantity: 1,
          status: 'active' as const,
          locationId: 'main',
          reservedAt: new Date(),
          expiresAt: new Date(),
        },
      ];

      vi.mocked(mockCaseRepo.findById).mockReturnValue(Effect.succeed(mockCase));
      vi.mocked(mockInventoryPort.getReservationsByCase).mockReturnValue(Effect.succeed(mockReservations));
      vi.mocked(mockInventoryPort.commitReservation).mockReturnValue(Effect.succeed(void 0));
      
      vi.mocked(mockInventoryPort.getItem)
        .mockReturnValueOnce(Effect.succeed({ 
          id: 'item-001', 
          sku: 'CASKET-001',
          description: 'Casket',
          category: 'casket',
          currentCost: 3000,
          glAccountId: '1300',
        } as any))
        .mockReturnValueOnce(Effect.succeed({ 
          id: 'item-002', 
          sku: 'URN-001',
          description: 'Urn',
          category: 'urn',
          currentCost: 500,
          glAccountId: '1310',
        } as any));

      vi.mocked(mockInventoryPort.getBalance)
        .mockReturnValueOnce(Effect.succeed({ weightedAverageCost: 2800 } as any))
        .mockReturnValueOnce(Effect.succeed({ weightedAverageCost: 450 } as any));

      const mockJournalEntry = {
        id: 'je-002',
        entryNumber: 'JE-2025-002',
        entryDate: new Date(),
        description: 'COGS for case-002',
        status: 'posted' as const,
        lines: [],
        totalDebit: 3250,
        totalCredit: 3250,
      };

      const mockUpdatedCase = new Case({
        ...mockCase,
        version: 2,
        cogsAmount: 3250,
        cogsJournalEntryId: 'je-002',
        inventoryDeliveredAt: new Date(),
        inventoryDeliveredBy: 'user-1',
      });

      vi.mocked(mockFinancialPort.createJournalEntry).mockReturnValue(
        Effect.succeed(mockJournalEntry)
      );
      vi.mocked(mockFinancialPort.postJournalEntry).mockReturnValue(Effect.succeed(void 0));
      vi.mocked(mockCaseRepo.update).mockReturnValue(Effect.succeed(mockUpdatedCase));

      const command = {
        caseId: 'case-002',
        deliveredBy: 'user-1',
        deliveryDate: new Date().toISOString(),
      };

      // Act
      const program = commitInventoryReservation(command);
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(CaseRepository, mockCaseRepo),
          Effect.provideService(GoInventoryPort, mockInventoryPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assert: Total COGS = 2800 + 450 = 3250
      // Gross Profit = 20000 - 3250 = 16750
      // Gross Margin = 16750 / 20000 * 100 = 83.75%
      expect(result.cogsAmount).toBe(3250);
      expect(result.grossProfit).toBe(16750);
      expect(result.grossMarginPercent).toBeCloseTo(83.75, 1);
    });
  });

  describe('Validation Rules', () => {
    it('should reject commit for archived case', async () => {
      // Arrange: Archived case that cannot be modified
      const mockCase = new Case({
        id: 'case-003' as CaseId,
        businessKey: 'CASE-2025-003',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'Bob Johnson',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'archived' as const, // Archived status
        serviceType: null,
        serviceDate: null,
        arrangements: null,
        goContractId: null,
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

      vi.mocked(mockCaseRepo.findById).mockReturnValue(
        Effect.succeed(mockCase)
      );

      const command = {
        caseId: 'case-003',
        deliveredBy: 'user-1',
        deliveryDate: new Date().toISOString(),
      };

      // Act & Assert
      const program = commitInventoryReservation(command);
      await expect(
        Effect.runPromise(
          program.pipe(
            Effect.provideService(CaseRepository, mockCaseRepo),
            Effect.provideService(GoInventoryPort, mockInventoryPort),
            Effect.provideService(GoFinancialPort, mockFinancialPort)
          )
        )
      ).rejects.toThrow();
    });

    it('should reject commit when no active reservations exist', async () => {
      // Arrange: Case with no reservations
      const mockCase = new Case({
        id: 'case-004' as CaseId,
        businessKey: 'CASE-2025-004',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'Alice Brown',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'active' as const,
        serviceType: null,
        serviceDate: null,
        arrangements: null,
        goContractId: 'contract-004',
        glJournalEntryId: null,
        revenueAmount: 10000,
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

      vi.mocked(mockCaseRepo.findById).mockReturnValue(Effect.succeed(mockCase));
      vi.mocked(mockInventoryPort.getReservationsByCase).mockReturnValue(
        Effect.succeed([]) // No reservations
      );

      const command = {
        caseId: 'case-004',
        deliveredBy: 'user-1',
        deliveryDate: new Date().toISOString(),
      };

      // Act & Assert
      const program = commitInventoryReservation(command);
      await expect(
        Effect.runPromise(
          program.pipe(
            Effect.provideService(CaseRepository, mockCaseRepo),
            Effect.provideService(GoInventoryPort, mockInventoryPort),
            Effect.provideService(GoFinancialPort, mockFinancialPort)
          )
        )
      ).rejects.toThrow();
    });
  });

  describe('COGS Categorization', () => {
    it('should post COGS to correct GL accounts by category', async () => {
      // Arrange: Mix of merchandise and services
      const mockCase = new Case({
        id: 'case-005' as CaseId,
        businessKey: 'CASE-2025-005',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'Test User',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'active' as const,
        serviceType: null,
        serviceDate: null,
        arrangements: null,
        goContractId: 'contract-005',
        glJournalEntryId: null,
        revenueAmount: 25000,
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

      const mockReservations = [
        { id: 'res-001', itemId: 'casket-1', caseId: 'case-005', quantity: 1, status: 'active' as const, locationId: 'main', reservedAt: new Date(), expiresAt: new Date() },
        { id: 'res-002', itemId: 'transport-1', caseId: 'case-005', quantity: 1, status: 'active' as const, locationId: 'main', reservedAt: new Date(), expiresAt: new Date() },
      ];

      vi.mocked(mockCaseRepo.findById).mockReturnValue(Effect.succeed(mockCase));
      vi.mocked(mockInventoryPort.getReservationsByCase).mockReturnValue(Effect.succeed(mockReservations));
      vi.mocked(mockInventoryPort.commitReservation).mockReturnValue(Effect.succeed(void 0));
      
      vi.mocked(mockInventoryPort.getItem)
        .mockReturnValueOnce(Effect.succeed({ id: 'casket-1', category: 'casket', sku: 'CASKET', description: 'Casket', currentCost: 3000, glAccountId: '1300' } as any))
        .mockReturnValueOnce(Effect.succeed({ id: 'transport-1', category: 'transportation', sku: 'TRANS', description: 'Transport', currentCost: 500, glAccountId: '5130' } as any));

      vi.mocked(mockInventoryPort.getBalance).mockReturnValue(Effect.succeed({ weightedAverageCost: 2500 } as any));
      
      let capturedJournalEntry: any;
      vi.mocked(mockFinancialPort.createJournalEntry).mockImplementation((cmd) => {
        capturedJournalEntry = cmd;
        return Effect.succeed({ id: 'je-005' } as any);
      });
      
      vi.mocked(mockFinancialPort.postJournalEntry).mockReturnValue(Effect.succeed(void 0));
      vi.mocked(mockCaseRepo.update).mockReturnValue(Effect.succeed({} as any));

      // Act
      const program = commitInventoryReservation({
        caseId: 'case-005',
        deliveredBy: 'user-1',
        deliveryDate: new Date().toISOString(),
      });
      
      await Effect.runPromise(
        program.pipe(
          Effect.provideService(CaseRepository, mockCaseRepo),
          Effect.provideService(GoInventoryPort, mockInventoryPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assert: Journal entry has lines for both COGS categories
      expect(capturedJournalEntry).toBeDefined();
      expect(capturedJournalEntry.lines.length).toBeGreaterThanOrEqual(3); // 2 COGS lines + 1 inventory asset credit
    });
  });
});
