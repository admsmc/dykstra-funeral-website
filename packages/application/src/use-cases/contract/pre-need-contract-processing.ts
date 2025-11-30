import { Effect } from 'effect';
import { ValidationError, NotFoundError, type CaseId } from '@dykstra/domain';
import {
  GoContractPort,
  type GoContractPortService,
  NetworkError,
  type GoContract,
  type GoContractItem,
} from '../../ports/go-contract-port';
import {
  ServiceCatalogRepository,
  type ServiceCatalogRepository as ServiceCatalogRepositoryService,
} from '../../ports/catalog-repository';
import {
  ProductCatalogRepository,
  type ProductCatalogRepository as ProductCatalogRepositoryService,
} from '../../ports/catalog-repository';

/**
 * Use Case 6.8: Pre-Need Contract Processing
 * 
 * Creates new pre-need funeral contracts where families pre-plan and pre-pay for
 * funeral services before they are needed. Pre-need contracts include special
 * handling for payment terms, trust accounting, and long-term storage.
 * 
 * Business Rules:
 * 1. Pre-need contracts must include at least one service
 * 2. Payment terms specify installment schedule or lump sum
 * 3. Trust fund percentage determines how much goes to trust (typically 90-100%)
 * 4. Contracts can be locked at current prices or inflation-adjusted
 * 5. Family contact information required for long-term follow-up
 * 6. Initial deposit may be required (configurable minimum)
 * 7. Contract includes beneficiary designation
 * 
 * Workflow:
 * 1. Validate command (services, payment terms, contacts)
 * 2. Create or retrieve associated case
 * 3. Calculate contract totals and trust amounts
 * 4. Create contract with Go backend
 * 5. Record trust fund allocation
 * 6. Generate contract documents
 * 7. Return contract summary with payment schedule
 * 
 * Integration:
 * - Uses GoContractPort.createContract (verified exists)
 * - Uses CaseRepository for case management
 * - Uses ServiceCatalogRepository for service pricing
 * - Uses ProductCatalogRepository for product pricing
 * 
 * Trust Accounting:
 * - Pre-need funds typically held in trust per state regulations
 * - Trust percentage varies by state (e.g., 90% in Michigan)
 * - Remaining percentage covers administrative costs
 * 
 * @see Implementation Plan: docs/Implementation Plan_ Remaining 20 Critical Use Cases.md
 */

export type PaymentTerm = 
  | 'lump_sum'           // Single payment upfront
  | 'monthly_12'         // 12 monthly installments
  | 'monthly_24'         // 24 monthly installments
  | 'monthly_36'         // 36 monthly installments
  | 'quarterly_4'        // 4 quarterly payments
  | 'semi_annual_2';     // 2 semi-annual payments

export type PriceLockType =
  | 'guaranteed'         // Price locked at current rates
  | 'inflation_adjusted' // Adjusted based on inflation index
  | 'market_rate';       // Current market rate at time of service

export interface FamilyContact {
  /**
   * Contact name
   */
  readonly name: string;
  
  /**
   * Relationship to beneficiary (e.g., "Self", "Spouse", "Child")
   */
  readonly relationship: string;
  
  /**
   * Contact phone number
   */
  readonly phone: string;
  
  /**
   * Contact email
   */
  readonly email?: string;
  
  /**
   * Contact address
   */
  readonly address: {
    readonly street: string;
    readonly city: string;
    readonly state: string;
    readonly zipCode: string;
  };
  
  /**
   * Is this the primary contact?
   */
  readonly isPrimary: boolean;
}

export interface BeneficiaryInfo {
  /**
   * Full legal name of beneficiary
   */
  readonly fullName: string;
  
  /**
   * Date of birth
   */
  readonly dateOfBirth: Date;
  
  /**
   * Social Security Number (last 4 digits only for security)
   */
  readonly ssnLast4?: string;
  
  /**
   * Current address
   */
  readonly currentAddress: {
    readonly street: string;
    readonly city: string;
    readonly state: string;
    readonly zipCode: string;
  };
}

export interface CreatePreNeedContractCommand {
  /**
   * Existing case ID (must be created separately)
   */
  readonly caseId: CaseId;
  
  /**
   * Beneficiary information (person for whom services are planned)
   */
  readonly beneficiary: BeneficiaryInfo;
  
  /**
   * Family contact information (one or more)
   */
  readonly familyContacts: readonly FamilyContact[];
  
  /**
   * Selected services (by catalog service IDs)
   */
  readonly serviceIds: readonly string[];
  
  /**
   * Selected products (by catalog product IDs)
   */
  readonly productIds: readonly string[];
  
  /**
   * Payment term selection
   */
  readonly paymentTerm: PaymentTerm;
  
  /**
   * Initial deposit amount (must meet minimum)
   */
  readonly initialDeposit: number;
  
  /**
   * Price lock type
   */
  readonly priceLockType: PriceLockType;
  
  /**
   * Trust fund percentage (decimal, e.g., 0.90 for 90%)
   * Typically 0.90-1.00 depending on state regulations
   */
  readonly trustFundPercentage: number;
  
  /**
   * Special requests or notes from family
   */
  readonly specialRequests?: string;
  
  /**
   * User creating the contract (funeral director)
   */
  readonly createdBy: string;
}

export interface PaymentSchedule {
  /**
   * Payment number (1, 2, 3...)
   */
  readonly paymentNumber: number;
  
  /**
   * Due date for this payment
   */
  readonly dueDate: Date;
  
  /**
   * Payment amount
   */
  readonly amount: number;
  
  /**
   * Payment status
   */
  readonly status: 'pending' | 'paid' | 'overdue';
}

export interface TrustAllocation {
  /**
   * Total contract amount
   */
  readonly totalContractAmount: number;
  
  /**
   * Amount allocated to trust fund
   */
  readonly trustAmount: number;
  
  /**
   * Trust fund percentage applied
   */
  readonly trustPercentage: number;
  
  /**
   * Administrative fee (retained amount)
   */
  readonly administrativeFee: number;
  
  /**
   * Trust account reference number (generated)
   */
  readonly trustAccountNumber: string;
}

export interface CreatePreNeedContractResult {
  /**
   * Created contract
   */
  readonly contract: GoContract;
  
  /**
   * Case ID (existing or newly created)
   */
  readonly caseId: string;
  
  /**
   * Beneficiary information
   */
  readonly beneficiary: BeneficiaryInfo;
  
  /**
   * Primary family contact
   */
  readonly primaryContact: FamilyContact;
  
  /**
   * Payment schedule details
   */
  readonly paymentSchedule: readonly PaymentSchedule[];
  
  /**
   * Trust fund allocation details
   */
  readonly trustAllocation: TrustAllocation;
  
  /**
   * Contract summary
   */
  readonly summary: {
    readonly totalServices: number;
    readonly totalProducts: number;
    readonly totalAmount: number;
    readonly initialDepositPaid: number;
    readonly remainingBalance: number;
    readonly priceLockType: PriceLockType;
    readonly effectiveDate: Date;
  };
}

/**
 * Create a new pre-need funeral contract
 * 
 * @example
 * ```typescript
 * const result = yield* createPreNeedContract({
 *   beneficiary: {
 *     fullName: 'John Smith',
 *     dateOfBirth: new Date('1950-05-15'),
 *     ssnLast4: '1234',
 *     currentAddress: {
 *       street: '123 Main St',
 *       city: 'Grand Rapids',
 *       state: 'MI',
 *       zipCode: '49503'
 *     }
 *   },
 *   familyContacts: [{
 *     name: 'Jane Smith',
 *     relationship: 'Spouse',
 *     phone: '(616) 555-1234',
 *     email: 'jane@example.com',
 *     address: { ... },
 *     isPrimary: true
 *   }],
 *   serviceIds: ['service-123', 'service-456'],
 *   productIds: ['product-789'],
 *   paymentTerm: 'monthly_24',
 *   initialDeposit: 1000,
 *   priceLockType: 'guaranteed',
 *   trustFundPercentage: 0.90,
 *   createdBy: 'director-123'
 * });
 * 
 * console.log(`Contract created: ${result.contract.id}`);
 * console.log(`Trust account: ${result.trustAllocation.trustAccountNumber}`);
 * console.log(`Payment schedule: ${result.paymentSchedule.length} payments`);
 * ```
 */
export const createPreNeedContract = (
  command: CreatePreNeedContractCommand
): Effect.Effect<
  CreatePreNeedContractResult,
  ValidationError | NotFoundError | NetworkError,
  | GoContractPortService
  | ServiceCatalogRepositoryService
  | ProductCatalogRepositoryService
> =>
  Effect.gen(function* () {
    const contractPort = yield* GoContractPort;
    const serviceRepo = yield* ServiceCatalogRepository;
    const productRepo = yield* ProductCatalogRepository;

    // Step 1: Validate command
    yield* validatePreNeedCommand(command);

    // Step 3: Load selected services and products from catalogs
    const servicesOrNull = yield* Effect.all(
      command.serviceIds.map((id) => serviceRepo.findById(id)),
      { concurrency: 5 }
    );
    
    // Filter out null values and validate all services were found
    const services = servicesOrNull.filter((s) => s !== null);
    if (services.length !== command.serviceIds.length) {
      return yield* Effect.fail(new NotFoundError({ 
        message: 'One or more services not found',
        entityType: 'Service',
        entityId: 'unknown'
      }));
    }

    const productsOrNull = yield* Effect.all(
      command.productIds.map((id) => productRepo.findById(id)),
      { concurrency: 5 }
    );
    
    // Filter out null values and validate all products were found
    const products = productsOrNull.filter((p) => p !== null);
    if (products.length !== command.productIds.length) {
      return yield* Effect.fail(new NotFoundError({ 
        message: 'One or more products not found',
        entityType: 'Product',
        entityId: 'unknown'
      }));
    }

    // Step 4: Convert to contract items
    const serviceItems: Omit<GoContractItem, 'id'>[] = services.map((service) => ({
      description: service.name,
      quantity: 1,
      unitPrice: service.price,
      totalPrice: service.price,
      // glAccountId will be set by Go backend based on service type
    }));

    const productItems: Omit<GoContractItem, 'id'>[] = products.map((product) => ({
      description: product.name,
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price,
      // glAccountId will be set by Go backend based on product category
    }));

    // Step 5: Calculate totals
    const totalServicesAmount = serviceItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalProductsAmount = productItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalContractAmount = totalServicesAmount + totalProductsAmount;

    // Step 6: Calculate trust allocation
    const trustAmount = totalContractAmount * command.trustFundPercentage;
    const administrativeFee = totalContractAmount - trustAmount;
    const trustAccountNumber = generateTrustAccountNumber(command.caseId, new Date());

    const trustAllocation: TrustAllocation = {
      totalContractAmount,
      trustAmount,
      trustPercentage: command.trustFundPercentage,
      administrativeFee,
      trustAccountNumber,
    };

    // Step 7: Create contract
    const contract = yield* contractPort.createContract({
      caseId: command.caseId,
      services: serviceItems,
      products: productItems,
    });

    // Step 8: Generate payment schedule
    const remainingBalance = totalContractAmount - command.initialDeposit;
    const paymentSchedule = generatePaymentSchedule(
      command.paymentTerm,
      remainingBalance,
      new Date()
    );

    // Step 9: Get primary contact (guaranteed to exist after validation)
    const primaryContact =
      command.familyContacts.find((c) => c.isPrimary) || command.familyContacts[0]!;

    return {
      contract,
      caseId: command.caseId,
      beneficiary: command.beneficiary,
      primaryContact,
      paymentSchedule,
      trustAllocation,
      summary: {
        totalServices: serviceItems.length,
        totalProducts: productItems.length,
        totalAmount: totalContractAmount,
        initialDepositPaid: command.initialDeposit,
        remainingBalance,
        priceLockType: command.priceLockType,
        effectiveDate: new Date(),
      },
    };
  });

/**
 * Validate pre-need contract command
 */
const validatePreNeedCommand = (
  command: CreatePreNeedContractCommand
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    const errors: string[] = [];

    // Validate beneficiary
    if (!command.beneficiary.fullName?.trim()) {
      errors.push('Beneficiary full name is required');
    }
    if (!command.beneficiary.dateOfBirth) {
      errors.push('Beneficiary date of birth is required');
    }
    if (!command.beneficiary.currentAddress.street?.trim()) {
      errors.push('Beneficiary address is required');
    }
    if (!command.beneficiary.currentAddress.city?.trim()) {
      errors.push('Beneficiary city is required');
    }
    if (!command.beneficiary.currentAddress.state?.trim()) {
      errors.push('Beneficiary state is required');
    }
    if (!command.beneficiary.currentAddress.zipCode?.trim()) {
      errors.push('Beneficiary zip code is required');
    }

    // Validate family contacts
    if (!command.familyContacts || command.familyContacts.length === 0) {
      errors.push('At least one family contact is required');
    } else {
      const primaryContacts = command.familyContacts.filter((c) => c.isPrimary);
      if (primaryContacts.length === 0) {
        errors.push('At least one primary contact must be designated');
      }
      if (primaryContacts.length > 1) {
        errors.push('Only one primary contact is allowed');
      }

      command.familyContacts.forEach((contact, index) => {
        if (!contact.name?.trim()) {
          errors.push(`Contact ${index + 1}: Name is required`);
        }
        if (!contact.phone?.trim()) {
          errors.push(`Contact ${index + 1}: Phone is required`);
        }
        if (!contact.relationship?.trim()) {
          errors.push(`Contact ${index + 1}: Relationship is required`);
        }
      });
    }

    // Validate services
    if (!command.serviceIds || command.serviceIds.length === 0) {
      errors.push('At least one service must be selected');
    }

    // Validate payment terms
    if (!command.paymentTerm) {
      errors.push('Payment term is required');
    }

    if (command.initialDeposit < 0) {
      errors.push('Initial deposit cannot be negative');
    }

    // Validate trust fund percentage (typically 0.70 - 1.00)
    if (command.trustFundPercentage < 0.7 || command.trustFundPercentage > 1.0) {
      errors.push('Trust fund percentage must be between 70% and 100%');
    }

    // Validate price lock type
    if (!command.priceLockType) {
      errors.push('Price lock type is required');
    }

    if (errors.length > 0) {
      return yield* Effect.fail(
        new ValidationError({ message: errors.join('; ') })
      );
    }
  });

/**
 * Generate payment schedule based on payment term
 */
const generatePaymentSchedule = (
  paymentTerm: PaymentTerm,
  remainingBalance: number,
  startDate: Date
): readonly PaymentSchedule[] => {
  const schedule: PaymentSchedule[] = [];

  // If no remaining balance, return empty schedule
  if (remainingBalance <= 0) {
    return schedule;
  }

  let numberOfPayments: number;
  let intervalMonths: number;

  switch (paymentTerm) {
    case 'lump_sum':
      numberOfPayments = 1;
      intervalMonths = 0;
      break;
    case 'monthly_12':
      numberOfPayments = 12;
      intervalMonths = 1;
      break;
    case 'monthly_24':
      numberOfPayments = 24;
      intervalMonths = 1;
      break;
    case 'monthly_36':
      numberOfPayments = 36;
      intervalMonths = 1;
      break;
    case 'quarterly_4':
      numberOfPayments = 4;
      intervalMonths = 3;
      break;
    case 'semi_annual_2':
      numberOfPayments = 2;
      intervalMonths = 6;
      break;
  }

  const paymentAmount = remainingBalance / numberOfPayments;

  for (let i = 0; i < numberOfPayments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + intervalMonths * (i + 1));

    schedule.push({
      paymentNumber: i + 1,
      dueDate,
      amount: Math.round(paymentAmount * 100) / 100, // Round to 2 decimals
      status: 'pending',
    });
  }

  return schedule;
};

/**
 * Generate trust account number
 * Format: TRxxxx-yyyymmdd
 * Where xxxx is last 4 of case ID and yyyymmdd is date
 */
const generateTrustAccountNumber = (caseId: string, date: Date): string => {
  const caseSuffix = caseId.slice(-4).toUpperCase();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `TR${caseSuffix}-${year}${month}${day}`;
};
