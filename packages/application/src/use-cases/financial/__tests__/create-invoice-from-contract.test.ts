/**
 * Integration Tests: Create Invoice from Contract
 * 
 * Tests invoice creation from approved contracts:
 * - Contract validation (status, signatures)
 * - Case-contract association
 * - Line item extraction
 * - Payment terms calculation
 * - Invoice creation in Go backend
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import { createInvoiceFromContract } from '../create-invoice-from-contract';
import { Case, type CaseId } from '@dykstra/domain';
import { 
  CaseRepository,
  GoContractPort,
  GoFinancialPort,
  type GoContractPortService,
  type GoFinancialPortService,
} from '@dykstra/application';

describe('Create Invoice from Contract Integration Tests', () => {
  const mockCaseRepo = {
    findByBusinessKey: vi.fn(),
  } as any;

  const mockContractPort: GoContractPortService = {
    getContract: vi.fn(),
  } as any;

  const mockFinancialPort: GoFinancialPortService = {
    createInvoice: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path: Invoice Creation', () => {
    it('should create invoice from approved and signed contract', async () => {
      const mockCase = new Case({
        id: 'case-001' as CaseId,
        businessKey: 'CASE-2025-001',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'John Doe',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'active' as const,
        serviceType: null,
        serviceDate: null,
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
        status: 'approved' as const,
        signedBy: ['user-1', 'client-1'],
        totalAmount: 12000,
        services: [
          { description: 'Service 1', quantity: 1, unitPrice: 5000, totalPrice: 5000, glAccountId: '4100' },
        ],
        products: [
          { description: 'Product 1', quantity: 1, unitPrice: 7000, totalPrice: 7000, glAccountId: '4200' },
        ],
        createdAt: new Date(),
      };

      const mockInvoice = {
        id: 'inv-001',
        invoiceNumber: 'INV-2025-001',
        totalAmount: 12000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      vi.mocked(mockContractPort.getContract).mockReturnValue(Effect.succeed(mockContract));
      vi.mocked(mockCaseRepo.findByBusinessKey).mockReturnValue(Effect.succeed(mockCase));
      vi.mocked(mockFinancialPort.createInvoice).mockReturnValue(Effect.succeed(mockInvoice));

      // Act
      const program = createInvoiceFromContract({
        contractId: 'contract-001',
        caseBusinessKey: 'CASE-2025-001',
      });

      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(CaseRepository, mockCaseRepo),
          Effect.provideService(GoContractPort, mockContractPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assert
      expect(result.invoiceId).toBe('inv-001');
      expect(result.invoiceNumber).toBe('INV-2025-001');
      expect(result.totalAmount).toBe(12000);
      expect(mockFinancialPort.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: 'contract-001',
          caseId: 'CASE-2025-001',
          lineItems: expect.arrayContaining([
            expect.objectContaining({ description: 'Service 1' }),
            expect.objectContaining({ description: 'Product 1' }),
          ]),
        })
      );
    });

    it('should calculate payment terms correctly', async () => {
      const mockCase = new Case({
        id: 'case-002' as CaseId,
        businessKey: 'CASE-2025-002',
        version: 1,
        funeralHomeId: 'fh-001',
        decedentName: 'Jane Smith',
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: 'at_need' as const,
        status: 'active' as const,
        serviceType: null,
        serviceDate: null,
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
        signedBy: ['user-1'],
        totalAmount: 5000,
        services: [],
        products: [],
        createdAt: new Date(),
      };

      vi.mocked(mockContractPort.getContract).mockReturnValue(Effect.succeed(mockContract));
      vi.mocked(mockCaseRepo.findByBusinessKey).mockReturnValue(Effect.succeed(mockCase));
      vi.mocked(mockFinancialPort.createInvoice).mockImplementation((cmd) => {
        // Verify payment terms (default 30 days)
        const daysDiff = Math.round((cmd.dueDate.getTime() - cmd.invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        expect(daysDiff).toBe(30);
        
        return Effect.succeed({
          id: 'inv-002',
          invoiceNumber: 'INV-002',
          totalAmount: 5000,
          dueDate: cmd.dueDate,
          createdAt: new Date(),
        });
      });

      // Act
      const program = createInvoiceFromContract({
        contractId: 'contract-002',
        caseBusinessKey: 'CASE-2025-002',
        paymentTermsDays: 30,
      });

      await Effect.runPromise(
        program.pipe(
          Effect.provideService(CaseRepository, mockCaseRepo),
          Effect.provideService(GoContractPort, mockContractPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assert done in mockImplementation
      expect(mockFinancialPort.createInvoice).toHaveBeenCalled();
    });
  });

  describe('Validation Rules', () => {
    it('should reject invoice creation for unapproved contract', async () => {
      const mockContract = {
        id: 'contract-003',
        status: 'draft' as const,
        signedBy: [],
        totalAmount: 10000,
        services: [],
        products: [],
        createdAt: new Date(),
      };

      vi.mocked(mockContractPort.getContract).mockReturnValue(Effect.succeed(mockContract));

      const program = createInvoiceFromContract({
        contractId: 'contract-003',
        caseBusinessKey: 'CASE-2025-003',
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

    it('should reject invoice creation for unsigned contract', async () => {
      const mockContract = {
        id: 'contract-004',
        status: 'approved' as const,
        signedBy: [], // No signatures
        totalAmount: 10000,
        services: [],
        products: [],
        createdAt: new Date(),
      };

      vi.mocked(mockContractPort.getContract).mockReturnValue(Effect.succeed(mockContract));

      const program = createInvoiceFromContract({
        contractId: 'contract-004',
        caseBusinessKey: 'CASE-2025-004',
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

    it('should reject invoice when contract not associated with case', async () => {
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
        goContractId: 'contract-999', // Different contract
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
        status: 'approved' as const,
        signedBy: ['user-1'],
        totalAmount: 5000,
        services: [],
        products: [],
        createdAt: new Date(),
      };

      vi.mocked(mockContractPort.getContract).mockReturnValue(Effect.succeed(mockContract));
      vi.mocked(mockCaseRepo.findByBusinessKey).mockReturnValue(Effect.succeed(mockCase));

      const program = createInvoiceFromContract({
        contractId: 'contract-005',
        caseBusinessKey: 'CASE-2025-005',
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
});
