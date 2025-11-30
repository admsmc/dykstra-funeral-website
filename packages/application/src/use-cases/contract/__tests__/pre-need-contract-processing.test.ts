import { describe, it, expect } from 'vitest';
import { Effect } from 'effect';
import { ValidationError, NotFoundError, type CaseId } from '@dykstra/domain';
import {
  createPreNeedContract,
  type CreatePreNeedContractCommand,
  type FamilyContact,
  type BeneficiaryInfo,
} from '../pre-need-contract-processing';
import {
  GoContractPort,
  type GoContractPortService,
  NetworkError,
  type GoContract,
} from '../../../ports/go-contract-port';
import {
  ServiceCatalogRepository,
  type ServiceCatalogRepository as ServiceCatalogRepositoryService,
  type Service,
} from '../../../ports/catalog-repository';
import {
  ProductCatalogRepository,
  type ProductCatalogRepository as ProductCatalogRepositoryService,
  type Product,
} from '../../../ports/catalog-repository';
import { Layer } from 'effect';

// Mock data
const mockBeneficiary: BeneficiaryInfo = {
  fullName: 'John Smith',
  dateOfBirth: new Date('1950-05-15'),
  ssnLast4: '1234',
  currentAddress: {
    street: '123 Main St',
    city: 'Grand Rapids',
    state: 'MI',
    zipCode: '49503',
  },
};

const mockPrimaryContact: FamilyContact = {
  name: 'Jane Smith',
  relationship: 'Spouse',
  phone: '(616) 555-1234',
  email: 'jane@example.com',
  address: {
    street: '123 Main St',
    city: 'Grand Rapids',
    state: 'MI',
    zipCode: '49503',
  },
  isPrimary: true,
};

const mockSecondaryContact: FamilyContact = {
  name: 'Bob Smith',
  relationship: 'Son',
  phone: '(616) 555-5678',
  email: 'bob@example.com',
  address: {
    street: '456 Oak Ave',
    city: 'Grand Rapids',
    state: 'MI',
    zipCode: '49504',
  },
  isPrimary: false,
};

const mockService: Service = {
  id: 'service-123',
  name: 'Traditional Burial Service',
  description: 'Complete traditional burial service',
  price: 3500,
  serviceType: 'TRADITIONAL_BURIAL',
  isRequired: true,
  isAvailable: true,
  displayOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProduct: Product = {
  id: 'product-789',
  name: 'Oak Casket',
  description: 'Premium oak casket',
  price: 2500,
  category: 'CASKET',
  sku: 'CASKET-OAK-001',
  isAvailable: true,
  displayOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockContract: GoContract = {
  id: 'contract-123',
  caseId: 'case-456',
  version: 1,
  status: 'draft',
  services: [
    {
      id: 'item-1',
      description: 'Traditional Burial Service',
      quantity: 1,
      unitPrice: 3500,
      totalPrice: 3500,
      glAccountId: 'gl-4000',
    },
  ],
  products: [
    {
      id: 'item-2',
      description: 'Oak Casket',
      quantity: 1,
      unitPrice: 2500,
      totalPrice: 2500,
      glAccountId: 'gl-4100',
    },
  ],
  totalAmount: 6000,
  signedBy: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};


const baseCommand: CreatePreNeedContractCommand = {
  caseId: 'case-456' as CaseId,
  beneficiary: mockBeneficiary,
  familyContacts: [mockPrimaryContact],
  serviceIds: ['service-123'],
  productIds: ['product-789'],
  paymentTerm: 'monthly_24',
  initialDeposit: 1000,
  priceLockType: 'guaranteed',
  trustFundPercentage: 0.90,
  createdBy: 'director-123',
};

describe('Use Case 6.8: Pre-Need Contract Processing', () => {
  describe('Happy Paths', () => {
    it('should create pre-need contract', async () => {
      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = await Effect.runPromise(
        createPreNeedContract(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      expect(result.contract.id).toBe('contract-123');
      expect(result.caseId).toBe('case-456');
      expect(result.beneficiary.fullName).toBe('John Smith');
      expect(result.primaryContact.name).toBe('Jane Smith');
      expect(result.paymentSchedule.length).toBe(24); // monthly_24 with remaining balance
      expect(result.trustAllocation.trustPercentage).toBe(0.90);
      expect(result.trustAllocation.trustAmount).toBe(5400); // 90% of $6000
      expect(result.trustAllocation.administrativeFee).toBe(600); // 10% of $6000
      expect(result.summary.totalAmount).toBe(6000);
      expect(result.summary.initialDepositPaid).toBe(1000);
      expect(result.summary.remainingBalance).toBe(5000);
    });


    it('should handle lump sum payment with no remaining balance', async () => {
      const lumpSumCommand = {
        ...baseCommand,
        paymentTerm: 'lump_sum' as const,
        initialDeposit: 6000, // Full amount
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = await Effect.runPromise(
        createPreNeedContract(lumpSumCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      expect(result.paymentSchedule.length).toBe(0); // No remaining payments
      expect(result.summary.remainingBalance).toBe(0);
    });

    it('should handle multiple family contacts correctly', async () => {
      const multiContactCommand = {
        ...baseCommand,
        familyContacts: [mockPrimaryContact, mockSecondaryContact],
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = await Effect.runPromise(
        createPreNeedContract(multiContactCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      expect(result.primaryContact.name).toBe('Jane Smith');
      expect(result.primaryContact.isPrimary).toBe(true);
    });
  });

  describe('Validation Errors', () => {
    it('should fail when beneficiary name is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        beneficiary: {
          ...mockBeneficiary,
          fullName: '',
        },
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = Effect.runPromise(
        createPreNeedContract(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      await expect(result).rejects.toThrow('Beneficiary full name is required');
    });

    it('should fail when no family contacts provided', async () => {
      const invalidCommand = {
        ...baseCommand,
        familyContacts: [],
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = Effect.runPromise(
        createPreNeedContract(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      await expect(result).rejects.toThrow('At least one family contact is required');
    });

    it('should fail when no primary contact designated', async () => {
      const invalidCommand = {
        ...baseCommand,
        familyContacts: [{ ...mockPrimaryContact, isPrimary: false }],
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = Effect.runPromise(
        createPreNeedContract(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      await expect(result).rejects.toThrow('At least one primary contact must be designated');
    });

    it('should fail when multiple primary contacts designated', async () => {
      const invalidCommand = {
        ...baseCommand,
        familyContacts: [
          mockPrimaryContact,
          { ...mockSecondaryContact, isPrimary: true },
        ],
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = Effect.runPromise(
        createPreNeedContract(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      await expect(result).rejects.toThrow('Only one primary contact is allowed');
    });

    it('should fail when no services selected', async () => {
      const invalidCommand = {
        ...baseCommand,
        serviceIds: [],
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = Effect.runPromise(
        createPreNeedContract(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      await expect(result).rejects.toThrow('At least one service must be selected');
    });

    it('should fail when initial deposit is negative', async () => {
      const invalidCommand = {
        ...baseCommand,
        initialDeposit: -100,
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = Effect.runPromise(
        createPreNeedContract(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      await expect(result).rejects.toThrow('Initial deposit cannot be negative');
    });

    it('should fail when trust percentage is too low', async () => {
      const invalidCommand = {
        ...baseCommand,
        trustFundPercentage: 0.5, // Below 70%
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = Effect.runPromise(
        createPreNeedContract(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      await expect(result).rejects.toThrow('Trust fund percentage must be between 70% and 100%');
    });

    it('should fail when trust percentage is too high', async () => {
      const invalidCommand = {
        ...baseCommand,
        trustFundPercentage: 1.1, // Above 100%
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = Effect.runPromise(
        createPreNeedContract(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      await expect(result).rejects.toThrow('Trust fund percentage must be between 70% and 100%');
    });
  });

  describe('Payment Schedule Generation', () => {
    it('should generate correct schedule for monthly_12', async () => {
      const command = {
        ...baseCommand,
        paymentTerm: 'monthly_12' as const,
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = await Effect.runPromise(
        createPreNeedContract(command).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      expect(result.paymentSchedule.length).toBe(12);
      expect(result.paymentSchedule[0].paymentNumber).toBe(1);
      expect(result.paymentSchedule[11].paymentNumber).toBe(12);
      // Each payment should be roughly (6000 - 1000) / 12 = 416.67
      expect(result.paymentSchedule[0].amount).toBeCloseTo(416.67, 2);
    });

    it('should generate correct schedule for quarterly_4', async () => {
      const command = {
        ...baseCommand,
        paymentTerm: 'quarterly_4' as const,
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = await Effect.runPromise(
        createPreNeedContract(command).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      expect(result.paymentSchedule.length).toBe(4);
      // Each payment should be (6000 - 1000) / 4 = 1250
      expect(result.paymentSchedule[0].amount).toBe(1250);
    });
  });

  describe('Network Errors', () => {
    it('should handle contract creation failure', async () => {
      const mockContractPort: GoContractPortService = {
        createContract: () =>
          Effect.fail(new NetworkError('Failed to create contract')),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = Effect.runPromise(
        createPreNeedContract(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      await expect(result).rejects.toThrow('Failed to create contract');
    });

    it('should handle service catalog lookup failure', async () => {
      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.fail(new NotFoundError('Service not found')),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = Effect.runPromise(
        createPreNeedContract(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      await expect(result).rejects.toThrow('An error has occurred');
    });
  });

  describe('Edge Cases', () => {
    it('should handle contracts with services only (no products)', async () => {
      const servicesOnlyCommand = {
        ...baseCommand,
        productIds: [],
      };

      const mockContractPort: GoContractPortService = {
        createContract: () =>
          Effect.succeed({
            ...mockContract,
            products: [],
            totalAmount: 3500, // Services only
          }),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = await Effect.runPromise(
        createPreNeedContract(servicesOnlyCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      expect(result.summary.totalProducts).toBe(0);
      expect(result.summary.totalServices).toBe(1);
    });

    it('should handle 100% trust fund percentage', async () => {
      const fullTrustCommand = {
        ...baseCommand,
        trustFundPercentage: 1.0,
      };

      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = await Effect.runPromise(
        createPreNeedContract(fullTrustCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      expect(result.trustAllocation.trustPercentage).toBe(1.0);
      expect(result.trustAllocation.trustAmount).toBe(6000);
      expect(result.trustAllocation.administrativeFee).toBe(0);
    });

    it('should generate unique trust account numbers', async () => {
      const mockContractPort: GoContractPortService = {
        createContract: () => Effect.succeed(mockContract),
        getContract: () => Effect.fail(new NotFoundError('Not found')),
        listContractsByCase: () => Effect.succeed([]),
        updateContract: () => Effect.succeed(mockContract),
        approveContract: () => Effect.succeed(undefined),
        signContract: () => Effect.succeed(undefined),
        cancelContract: () => Effect.succeed(undefined),
        getApprovalHistory: () => Effect.succeed([]),
      };


      const mockServiceRepo: ServiceCatalogRepositoryService = {
        findById: () => Effect.succeed(mockService),
        findAll: () => Effect.succeed([mockService]),
        findByServiceType: () => Effect.succeed([mockService]),
      };

      const mockProductRepo: ProductCatalogRepositoryService = {
        findById: () => Effect.succeed(mockProduct),
        findAll: () => Effect.succeed([mockProduct]),
        findByCategory: () => Effect.succeed([mockProduct]),
      };

      const result = await Effect.runPromise(
        createPreNeedContract(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort)),
          Effect.provide(Layer.succeed(ServiceCatalogRepository, mockServiceRepo)),
          Effect.provide(Layer.succeed(ProductCatalogRepository, mockProductRepo))
        )
      );

      // Trust account number format: TRxxxx-yyyymmdd
      // Format is TR followed by last 4 chars of case ID (could be lowercase), then dash and date
      expect(result.trustAllocation.trustAccountNumber).toMatch(/^TR.{4}-\d{8}$/);
      expect(result.trustAllocation.trustAccountNumber).toContain('TR');
    });
  });
});
