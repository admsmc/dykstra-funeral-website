import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  generateRetentionAnalysis,
  type GenerateRetentionAnalysisCommand,
} from '../customer-retention-analysis';
import {
  GoContractPort,
  type GoContractPortService,
  NetworkError,
  type GoContract,
} from '../../../ports/go-contract-port';

const mockContracts: GoContract[] = [
  // Smith family - repeat customer (3 contracts over 5 years)
  {
    id: 'contract-smith-1',
    contractNumber: 'CN-001',
    contractDate: new Date('2020-01-15'),
    contractType: 'at-need',
    decedentFirstName: 'John',
    decedentLastName: 'Smith',
    totalAmount: 8500,
    status: 'active',
    createdAt: new Date('2020-01-15'),
    createdBy: 'user-1',
  },
  {
    id: 'contract-smith-2',
    contractNumber: 'CN-002',
    contractDate: new Date('2022-06-20'),
    contractType: 'pre-need',
    decedentFirstName: 'Mary',
    decedentLastName: 'Smith',
    totalAmount: 12000,
    status: 'active',
    createdAt: new Date('2022-06-20'),
    createdBy: 'user-1',
  },
  {
    id: 'contract-smith-3',
    contractNumber: 'CN-003',
    contractDate: new Date('2024-03-10'),
    contractType: 'at-need',
    decedentFirstName: 'Robert',
    decedentLastName: 'Smith',
    totalAmount: 9500,
    status: 'active',
    createdAt: new Date('2024-03-10'),
    createdBy: 'user-1',
  },
  // Johnson family - new customer (1 contract)
  {
    id: 'contract-johnson-1',
    contractNumber: 'CN-004',
    contractDate: new Date('2024-02-15'),
    contractType: 'at-need',
    decedentFirstName: 'Alice',
    decedentLastName: 'Johnson',
    totalAmount: 7000,
    status: 'active',
    createdAt: new Date('2024-02-15'),
    createdBy: 'user-1',
  },
  // Williams family - repeat customer (2 contracts)
  {
    id: 'contract-williams-1',
    contractNumber: 'CN-005',
    contractDate: new Date('2021-08-12'),
    contractType: 'at-need',
    decedentFirstName: 'Thomas',
    decedentLastName: 'Williams',
    totalAmount: 6500,
    status: 'active',
    createdAt: new Date('2021-08-12'),
    createdBy: 'user-1',
  },
  {
    id: 'contract-williams-2',
    contractNumber: 'CN-006',
    contractDate: new Date('2023-11-25'),
    contractType: 'at-need',
    decedentFirstName: 'Sarah',
    decedentLastName: 'Williams',
    totalAmount: 8000,
    status: 'active',
    createdAt: new Date('2023-11-25'),
    createdBy: 'user-1',
  },
];

const baseCommand: GenerateRetentionAnalysisCommand = {
  startDate: new Date('2020-01-01'),
  endDate: new Date('2024-12-31'),
  includePreNeed: true,
  generatedBy: 'analyst-123',
};

describe('Use Case 7.7: Customer Retention Analysis', () => {
  describe('Happy Paths', () => {
    // TODO: Requires backend support for listContractsByDateRange()
    // Current GoContractPort only provides listContractsByCase(caseId)
    // See use case lines 97-104 for implementation notes
    it.skip('should generate retention analysis report', async () => {
      const mockContractPort: GoContractPortService = {
        listContracts: () => Effect.succeed(mockContracts),
        getContract: () => Effect.fail(new NetworkError('Not implemented')),
        createContract: () => Effect.fail(new NetworkError('Not implemented')),
        updateContract: () => Effect.fail(new NetworkError('Not implemented')),
        cancelContract: () => Effect.fail(new NetworkError('Not implemented')),
        renewContract: () => Effect.fail(new NetworkError('Not implemented')),
        getContractPayments: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateRetentionAnalysis(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort))
        )
      );

      // Verify families identified
      expect(result.families.length).toBe(3); // Smith, Johnson, Williams
      
      // Verify Smith family metrics (highest revenue, should be first)
      const smithFamily = result.families.find(f => f.familyName === 'Smith');
      expect(smithFamily).toBeDefined();
      expect(smithFamily?.totalContracts).toBe(3);
      expect(smithFamily?.atNeedContracts).toBe(2);
      expect(smithFamily?.preNeedContracts).toBe(1);
      expect(smithFamily?.totalRevenue).toBe(30000); // 8500 + 12000 + 9500
      expect(smithFamily?.averageRevenuePerContract).toBe(10000);
      expect(smithFamily?.yearsAsCustomer).toBeGreaterThanOrEqual(4);
      
      // Verify summary metrics
      expect(result.summary.totalFamilies).toBe(3);
      expect(result.summary.newFamilies).toBe(1); // Johnson only
      expect(result.summary.repeatFamilies).toBe(2); // Smith and Williams
      expect(result.summary.activeFamilies).toBe(3); // All active in last 5 years
      expect(result.summary.retentionRate).toBeCloseTo(66.67, 2); // 2/3 = 66.67%
      expect(result.summary.averageContractsPerFamily).toBeCloseTo(2, 1); // 6 contracts / 3 families
      expect(result.summary.averageRevenuePerFamily).toBeCloseTo(17166.67, 2);
    });

    it.skip('should exclude pre-need contracts when requested', async () => {
      const commandWithoutPreNeed = {
        ...baseCommand,
        includePreNeed: false,
      };

      const mockContractPort: GoContractPortService = {
        listContracts: (cmd) => {
          // Filter out pre-need contracts
          const filtered = mockContracts.filter(c => c.contractType !== 'pre-need');
          return Effect.succeed(filtered);
        },
        getContract: () => Effect.fail(new NetworkError('Not implemented')),
        createContract: () => Effect.fail(new NetworkError('Not implemented')),
        updateContract: () => Effect.fail(new NetworkError('Not implemented')),
        cancelContract: () => Effect.fail(new NetworkError('Not implemented')),
        renewContract: () => Effect.fail(new NetworkError('Not implemented')),
        getContractPayments: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateRetentionAnalysis(commandWithoutPreNeed).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort))
        )
      );

      // Smith family should now have 2 contracts instead of 3 (excluding pre-need)
      const smithFamily = result.families.find(f => f.familyName === 'Smith');
      expect(smithFamily?.totalContracts).toBe(2);
      expect(smithFamily?.preNeedContracts).toBe(0);
      expect(smithFamily?.totalRevenue).toBe(18000); // 8500 + 9500 (excluding 12000 pre-need)
    });

    it('should handle empty results', async () => {
      const mockContractPort: GoContractPortService = {
        listContracts: () => Effect.succeed([]),
        getContract: () => Effect.fail(new NetworkError('Not implemented')),
        createContract: () => Effect.fail(new NetworkError('Not implemented')),
        updateContract: () => Effect.fail(new NetworkError('Not implemented')),
        cancelContract: () => Effect.fail(new NetworkError('Not implemented')),
        renewContract: () => Effect.fail(new NetworkError('Not implemented')),
        getContractPayments: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateRetentionAnalysis(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort))
        )
      );

      expect(result.families).toEqual([]);
      expect(result.summary.totalFamilies).toBe(0);
      expect(result.summary.newFamilies).toBe(0);
      expect(result.summary.repeatFamilies).toBe(0);
      expect(result.summary.activeFamilies).toBe(0);
      expect(result.summary.retentionRate).toBe(0);
      expect(result.summary.averageContractsPerFamily).toBe(0);
      expect(result.summary.averageRevenuePerFamily).toBe(0);
    });

    it.skip('should sort families by total revenue descending', async () => {
      const mockContractPort: GoContractPortService = {
        listContracts: () => Effect.succeed(mockContracts),
        getContract: () => Effect.fail(new NetworkError('Not implemented')),
        createContract: () => Effect.fail(new NetworkError('Not implemented')),
        updateContract: () => Effect.fail(new NetworkError('Not implemented')),
        cancelContract: () => Effect.fail(new NetworkError('Not implemented')),
        renewContract: () => Effect.fail(new NetworkError('Not implemented')),
        getContractPayments: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateRetentionAnalysis(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort))
        )
      );

      // Smith family ($30k) should be first, then Williams ($14.5k), then Johnson ($7k)
      expect(result.families[0].familyName).toBe('Smith');
      expect(result.families[0].totalRevenue).toBe(30000);
      expect(result.families[1].familyName).toBe('Williams');
      expect(result.families[1].totalRevenue).toBe(14500);
      expect(result.families[2].familyName).toBe('Johnson');
      expect(result.families[2].totalRevenue).toBe(7000);
    });
  });

  describe('Validation Errors', () => {
    it('should fail when start date is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        startDate: null as any,
      };

      const mockPort: GoContractPortService = {
        listContracts: () => Effect.fail(new NetworkError('Should not be called')),
        getContract: () => Effect.fail(new NetworkError('Not implemented')),
        createContract: () => Effect.fail(new NetworkError('Not implemented')),
        updateContract: () => Effect.fail(new NetworkError('Not implemented')),
        cancelContract: () => Effect.fail(new NetworkError('Not implemented')),
        renewContract: () => Effect.fail(new NetworkError('Not implemented')),
        getContractPayments: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateRetentionAnalysis(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockPort))
        )
      );

      await expect(result).rejects.toThrow('Start date must be a valid date');
    });

    it('should fail when start date is after end date', async () => {
      const invalidCommand = {
        ...baseCommand,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2020-01-01'),
      };

      const mockPort: GoContractPortService = {
        listContracts: () => Effect.fail(new NetworkError('Should not be called')),
        getContract: () => Effect.fail(new NetworkError('Not implemented')),
        createContract: () => Effect.fail(new NetworkError('Not implemented')),
        updateContract: () => Effect.fail(new NetworkError('Not implemented')),
        cancelContract: () => Effect.fail(new NetworkError('Not implemented')),
        renewContract: () => Effect.fail(new NetworkError('Not implemented')),
        getContractPayments: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateRetentionAnalysis(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockPort))
        )
      );

      await expect(result).rejects.toThrow('Start date must be before end date');
    });

    it('should fail when date range exceeds 10 years', async () => {
      const invalidCommand = {
        ...baseCommand,
        startDate: new Date('2010-01-01'),
        endDate: new Date('2025-01-01'), // > 10 years
      };

      const mockPort: GoContractPortService = {
        listContracts: () => Effect.fail(new NetworkError('Should not be called')),
        getContract: () => Effect.fail(new NetworkError('Not implemented')),
        createContract: () => Effect.fail(new NetworkError('Not implemented')),
        updateContract: () => Effect.fail(new NetworkError('Not implemented')),
        cancelContract: () => Effect.fail(new NetworkError('Not implemented')),
        renewContract: () => Effect.fail(new NetworkError('Not implemented')),
        getContractPayments: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateRetentionAnalysis(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockPort))
        )
      );

      await expect(result).rejects.toThrow('Date range cannot exceed 10 years');
    });
  });

  describe('Network Errors', () => {
    it.skip('should handle network error from listContracts', async () => {
      const mockContractPort: GoContractPortService = {
        listContracts: () => Effect.fail(new NetworkError('Connection timeout')),
        getContract: () => Effect.fail(new NetworkError('Not implemented')),
        createContract: () => Effect.fail(new NetworkError('Not implemented')),
        updateContract: () => Effect.fail(new NetworkError('Not implemented')),
        cancelContract: () => Effect.fail(new NetworkError('Not implemented')),
        renewContract: () => Effect.fail(new NetworkError('Not implemented')),
        getContractPayments: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateRetentionAnalysis(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoContractPort, mockContractPort))
        )
      );

      await expect(result).rejects.toThrow('Connection timeout');
    });
  });
});
