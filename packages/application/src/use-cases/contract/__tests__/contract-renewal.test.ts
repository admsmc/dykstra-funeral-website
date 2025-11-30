import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Effect, Layer } from 'effect';
import { ValidationError, NotFoundError, type CaseId } from '@dykstra/domain';
import {
  renewContract,
  type RenewContractCommand,
} from '../contract-renewal';
import {
  GoContractPort,
  type GoContractPortService,
  type GoContract,
  NetworkError,
} from '../../../ports/go-contract-port';
import {
  CaseRepository,
  type CaseRepository as CaseRepositoryService,
  PersistenceError,
} from '../../../ports/case-repository';

describe('Use Case 6.6: Contract Renewal Management', () => {
  // Mock original contract
  const mockOriginalContract: GoContract = {
    id: 'contract-123',
    caseId: 'case-456',
    version: 1,
    status: 'active',
    services: [
      {
        id: 'service-1',
        description: 'Funeral Service',
        quantity: 1,
        unitPrice: 2000,
        totalPrice: 2000,
        glAccountId: '4100',
      },
    ],
    products: [
      {
        id: 'product-1',
        description: 'Oak Casket',
        quantity: 1,
        unitPrice: 3000,
        totalPrice: 3000,
        glAccountId: '4200',
      },
    ],
    totalAmount: 5000,
    approvedBy: 'director-1',
    approvedAt: new Date('2024-01-01'),
    signedBy: ['family-1'],
    signedAt: new Date('2024-01-02'),
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-02'),
  };

  // Mock new contract with price adjustment
  const mockNewContract: GoContract = {
    id: 'contract-789',
    caseId: 'case-456',
    version: 1,
    status: 'draft',
    services: [
      {
        id: 'service-2',
        description: 'Funeral Service',
        quantity: 1,
        unitPrice: 2060, // 3% increase
        totalPrice: 2060,
        glAccountId: '4100',
      },
    ],
    products: [
      {
        id: 'product-2',
        description: 'Oak Casket',
        quantity: 1,
        unitPrice: 3090, // 3% increase
        totalPrice: 3090,
        glAccountId: '4200',
      },
    ],
    totalAmount: 5150, // Total with 3% increase
    createdAt: new Date('2025-11-30'),
    updatedAt: new Date('2025-11-30'),
  };

  // Mock case
  const mockCase = {
    id: 'case-456' as CaseId,
    caseNumber: 'FH-2024-001',
    decedentName: 'John Doe',
    status: 'active',
  };

  let mockContractPort: GoContractPortService;
  let mockCaseRepo: CaseRepositoryService;

  beforeEach(() => {
    mockContractPort = {
      getContract: vi.fn(() => Effect.succeed(mockOriginalContract)),
      createContract: vi.fn(() => Effect.succeed(mockNewContract)),
      // Stubs for other methods
      listContractsByCase: vi.fn(),
      updateContract: vi.fn(),
      approveContract: vi.fn(),
      signContract: vi.fn(),
      cancelContract: vi.fn(),
      getApprovalHistory: vi.fn(),
    } as GoContractPortService;

    mockCaseRepo = {
      findById: vi.fn(() => Effect.succeed(mockCase as any)),
      save: vi.fn((c) => Effect.succeed(c)),
      // Stubs
      findAll: vi.fn(),
      findByStatus: vi.fn(),
      delete: vi.fn(),
    } as CaseRepositoryService;
  });

  const runTest = <A, E>(
    effect: Effect.Effect<A, E, GoContractPortService | CaseRepositoryService>
  ) =>
    Effect.runPromise(
      Effect.provide(
        effect,
        Layer.mergeAll(
          Layer.succeed(GoContractPort, mockContractPort),
          Layer.succeed(CaseRepository, mockCaseRepo)
        )
      )
    );

  describe('Happy Path', () => {
    it('should renew contract with price adjustment', async () => {
      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Annual price adjustment',
        priceAdjustmentFactor: 1.03, // 3% increase
        renewedBy: 'user-789',
      };

      const result = await runTest(renewContract(command));

      expect(result.newContract).toEqual(mockNewContract);
      expect(result.originalContract).toEqual(mockOriginalContract);
      expect(result.newCaseId).toBe('case-456');
      expect(result.priceComparison.originalTotal).toBe(5000);
      expect(result.priceComparison.newTotal).toBe(5150);
      expect(result.priceComparison.difference).toBe(150);
      expect(result.priceComparison.percentChange).toBeCloseTo(3.0, 1);
      expect(result.renewalMetadata.renewalReason).toBe('Annual price adjustment');
      expect(result.renewalMetadata.renewedBy).toBe('user-789');
      expect(result.renewalMetadata.originalContractId).toBe('contract-123');
      expect(result.renewalMetadata.priceAdjustmentFactor).toBe(1.03);

      // Verify port calls
      expect(mockContractPort.getContract).toHaveBeenCalledWith('contract-123');
      expect(mockContractPort.createContract).toHaveBeenCalled();
    });

    it('should renew contract without price adjustment (1.0 factor)', async () => {
      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Service changes only',
        renewedBy: 'user-789',
      };

      const result = await runTest(renewContract(command));

      expect(result.renewalMetadata.priceAdjustmentFactor).toBe(1.0);
      expect(mockContractPort.createContract).toHaveBeenCalledWith(
        expect.objectContaining({
          caseId: 'case-456',
        })
      );
    });

    it('should handle price decrease', async () => {
      // Mock contract with lower total
      const lowerPriceContract: GoContract = {
        ...mockNewContract,
        totalAmount: 4750, // 5% decrease
      };
      (mockContractPort.createContract as any).mockReturnValueOnce(
        Effect.succeed(lowerPriceContract)
      );

      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Reduced services',
        priceAdjustmentFactor: 0.95,
        renewedBy: 'user-789',
      };

      const result = await runTest(renewContract(command));

      expect(result.priceComparison.difference).toBe(-250);
      expect(result.priceComparison.percentChange).toBeCloseTo(-5.0, 1);
    });
  });

  describe('Validation Errors', () => {
    it('should fail if original contract ID is missing', async () => {
      const command: RenewContractCommand = {
        originalContractId: '',
        renewalReason: 'Test',
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Original contract ID is required'
      );
    });

    it('should fail if renewal reason is missing', async () => {
      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: '',
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Renewal reason is required'
      );
    });

    it('should fail if renewed by is missing', async () => {
      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        renewedBy: '',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Renewed by (user ID) is required'
      );
    });

    it('should fail if price adjustment factor is zero', async () => {
      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        priceAdjustmentFactor: 0,
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Price adjustment factor must be positive'
      );
    });

    it('should fail if price adjustment factor is negative', async () => {
      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        priceAdjustmentFactor: -0.5,
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Price adjustment factor must be positive'
      );
    });

    it('should fail if price adjustment factor is too low (<0.5)', async () => {
      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        priceAdjustmentFactor: 0.4, // 60% decrease - too extreme
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'outside reasonable range'
      );
    });

    it('should fail if price adjustment factor is too high (>1.5)', async () => {
      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        priceAdjustmentFactor: 2.0, // 100% increase - too extreme
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'outside reasonable range'
      );
    });

    it('should fail if updated services array is empty', async () => {
      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        renewedBy: 'user-789',
        updatedServices: [], // Empty array not allowed
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Updated services array cannot be empty'
      );
    });

    it('should fail if updated products array is empty', async () => {
      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        renewedBy: 'user-789',
        updatedProducts: [],
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Updated products array cannot be empty'
      );
    });
  });

  describe('Contract Eligibility', () => {
    it('should fail if contract is in draft status', async () => {
      const draftContract: GoContract = {
        ...mockOriginalContract,
        status: 'draft',
      };
      (mockContractPort.getContract as any).mockReturnValueOnce(
        Effect.succeed(draftContract)
      );

      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Contract cannot be renewed in draft status'
      );
    });

    it('should fail if contract is cancelled', async () => {
      const cancelledContract: GoContract = {
        ...mockOriginalContract,
        status: 'cancelled',
      };
      (mockContractPort.getContract as any).mockReturnValueOnce(
        Effect.succeed(cancelledContract)
      );

      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Only active or completed contracts can be renewed'
      );
    });

    it('should allow renewal of completed contract', async () => {
      const completedContract: GoContract = {
        ...mockOriginalContract,
        status: 'completed',
      };
      (mockContractPort.getContract as any).mockReturnValueOnce(
        Effect.succeed(completedContract)
      );

      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Re-activation',
        renewedBy: 'user-789',
      };

      const result = await runTest(renewContract(command));

      expect(result.originalContract.status).toBe('completed');
    });

    it('should fail if contract has no services or products', async () => {
      const emptyContract: GoContract = {
        ...mockOriginalContract,
        services: [],
        products: [],
      };
      (mockContractPort.getContract as any).mockReturnValueOnce(
        Effect.succeed(emptyContract)
      );

      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Contract has no services or products'
      );
    });
  });

  describe('Network Errors', () => {
    it('should propagate network error from getContract', async () => {
      (mockContractPort.getContract as any).mockReturnValueOnce(
        Effect.fail(new NetworkError('Backend unavailable'))
      );

      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Backend unavailable'
      );
    });

    it('should propagate network error from createContract', async () => {
      (mockContractPort.createContract as any).mockReturnValueOnce(
        Effect.fail(new NetworkError('Failed to create contract'))
      );

      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        renewedBy: 'user-789',
      };

      await expect(runTest(renewContract(command))).rejects.toThrow(
        'Failed to create contract'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle contract with only services (no products)', async () => {
      const servicesOnlyContract: GoContract = {
        ...mockOriginalContract,
        products: [],
        totalAmount: 2000,
      };
      (mockContractPort.getContract as any).mockReturnValueOnce(
        Effect.succeed(servicesOnlyContract)
      );

      const newContractServicesOnly: GoContract = {
        ...mockNewContract,
        products: [],
        totalAmount: 2060,
      };
      (mockContractPort.createContract as any).mockReturnValueOnce(
        Effect.succeed(newContractServicesOnly)
      );

      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        priceAdjustmentFactor: 1.03,
        renewedBy: 'user-789',
      };

      const result = await runTest(renewContract(command));

      expect(result.priceComparison.originalTotal).toBe(2000);
      expect(result.priceComparison.newTotal).toBe(2060);
    });

    it('should handle contract with only products (no services)', async () => {
      const productsOnlyContract: GoContract = {
        ...mockOriginalContract,
        services: [],
        totalAmount: 3000,
      };
      (mockContractPort.getContract as any).mockReturnValueOnce(
        Effect.succeed(productsOnlyContract)
      );

      const newContractProductsOnly: GoContract = {
        ...mockNewContract,
        services: [],
        totalAmount: 3090,
      };
      (mockContractPort.createContract as any).mockReturnValueOnce(
        Effect.succeed(newContractProductsOnly)
      );

      const command: RenewContractCommand = {
        originalContractId: 'contract-123',
        renewalReason: 'Test',
        priceAdjustmentFactor: 1.03,
        renewedBy: 'user-789',
      };

      const result = await runTest(renewContract(command));

      expect(result.priceComparison.originalTotal).toBe(3000);
      expect(result.priceComparison.newTotal).toBe(3090);
    });
  });
});
