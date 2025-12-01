import { Effect, Context } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  ContractTemplateRepository,
  type ContractTemplateRepository as ContractTemplateRepositoryService,
  type ContractTemplateWithCreator,
} from '../../ports/contract-template-repository';
import {
  ServiceCatalogRepository,
  type ServiceCatalogRepository as ServiceCatalogRepositoryService,
  type Service,
  type CatalogServiceType,
} from '../../ports/catalog-repository';
import {
  ProductCatalogRepository,
  type ProductCatalogRepository as ProductCatalogRepositoryService,
  type Product,
} from '../../ports/catalog-repository';

/**
 * Use Case 6.7: Service Arrangement Recommendations
 * 
 * Provides personalized service arrangement recommendations to families based on their
 * preferences, needs, and the type of service they're considering. Uses the term
 * "service arrangements" rather than "packages" to maintain a compassionate, personal tone.
 * 
 * Business Rules:
 * 1. Recommendations based on service type (traditional burial, cremation, memorial, etc.)
 * 2. Includes required services automatically
 * 3. Suggests commonly paired products (caskets, urns, flowers)
 * 4. Respects family's budget preferences when provided
 * 5. Presents arrangements as suggestions, not rigid packages
 * 6. Allows full customization of any recommendation
 * 
 * Workflow:
 * 1. Validate request parameters
 * 2. Retrieve service template for the requested type
 * 3. Load available services for that arrangement type
 * 4. Load suggested products based on service type and budget
 * 5. Calculate total estimated cost
 * 6. Return personalized recommendations
 * 
 * Integration:
 * - Uses ContractTemplateRepository (verified exists)
 * - Uses ServiceCatalogRepository (verified exists)
 * - Uses ProductCatalogRepository (verified exists)
 * 
 * @see Implementation Plan: docs/Implementation Plan_ Remaining 20 Critical Use Cases.md
 */

/**
 * Service Arrangement Recommendations
 *
 * Policy Type: Type C
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface GetServiceRecommendationsCommand {
  /**
   * Type of service the family is considering
   */
  readonly serviceType: CatalogServiceType;
  
  /**
   * Optional budget guidance for recommendations
   */
  readonly budgetRange?: {
    readonly min?: number;
    readonly max?: number;
  };
  
  /**
   * Optional preferences to refine recommendations
   */
  readonly preferences?: {
    readonly includeFlowers?: boolean;
    readonly includeMemorialCards?: boolean;
    readonly preferSimpleArrangement?: boolean; // Minimal, essential services only
  };
  
  /**
   * User requesting recommendations (for audit trail)
   */
  readonly requestedBy: string;
}

export interface ServiceArrangement {
  /**
   * Descriptive name for this arrangement
   * (e.g., "Traditional Burial Service", "Simple Cremation Service")
   */
  readonly name: string;
  
  /**
   * Description of what this arrangement includes
   */
  readonly description: string;
  
  /**
   * Service type this arrangement is for
   */
  readonly serviceType: CatalogServiceType;
  
  /**
   * Required services included in this arrangement
   */
  readonly requiredServices: readonly Service[];
  
  /**
   * Optional but commonly chosen services
   */
  readonly recommendedServices: readonly Service[];
  
  /**
   * Suggested products for this arrangement
   */
  readonly suggestedProducts: {
    readonly caskets?: readonly Product[];
    readonly urns?: readonly Product[];
    readonly flowers?: readonly Product[];
    readonly memorialCards?: readonly Product[];
    readonly other?: readonly Product[];
  };
  
  /**
   * Estimated cost breakdown
   */
  readonly costEstimate: {
    readonly requiredServicesTotal: number;
    readonly recommendedServicesTotal: number;
    readonly suggestedProductsTotal: number;
    readonly estimatedTotal: number;
  };
  
  /**
   * Contract template associated with this arrangement
   */
  readonly contractTemplate?: ContractTemplateWithCreator;
}

export interface GetServiceRecommendationsResult {
  /**
   * Primary recommendation based on service type
   */
  readonly primaryArrangement: ServiceArrangement;
  
  /**
   * Alternative arrangements the family might consider
   */
  readonly alternativeArrangements: readonly ServiceArrangement[];
  
  /**
   * Service type requested
   */
  readonly requestedServiceType: CatalogServiceType;
  
  /**
   * Budget range used for recommendations (if provided)
   */
  readonly budgetRange?: {
    readonly min?: number;
    readonly max?: number;
  };
  
  /**
   * Personalization notes
   */
  readonly personalization: {
    readonly budgetGuidanceUsed: boolean;
    readonly preferencesApplied: boolean;
    readonly message: string;
  };
}

/**
 * Get personalized service arrangement recommendations for a family
 * 
 * @example
 * ```typescript
 * const result = yield* getServiceRecommendations({
 *   serviceType: 'TRADITIONAL_BURIAL',
 *   budgetRange: { max: 8000 },
 *   preferences: {
 *     includeFlowers: true,
 *     preferSimpleArrangement: false
 *   },
 *   requestedBy: 'family-member-123'
 * });
 * 
 * console.log(result.primaryArrangement.name);
 * // "Traditional Burial Service"
 * console.log(result.primaryArrangement.costEstimate.estimatedTotal);
 * // 7500
 * ```
 */
export const getServiceRecommendations = (
  command: GetServiceRecommendationsCommand
): Effect.Effect<
  GetServiceRecommendationsResult,
  ValidationError,
  | ContractTemplateRepositoryService
  | ServiceCatalogRepositoryService
  | ProductCatalogRepositoryService
> =>
  Effect.gen(function* () {
    const templateRepo = yield* ContractTemplateRepository;
    const serviceRepo = yield* ServiceCatalogRepository;
    const productRepo = yield* ProductCatalogRepository;

    // Validate command
    yield* validateRecommendationsCommand(command);

    // Step 1: Get contract template for service type
    const contractTemplate = yield* templateRepo.findDefault(command.serviceType);

    // Step 2: Load available services
    const allServices = yield* serviceRepo.find({
      serviceType: command.serviceType,
      availableOnly: true,
    });

    // Separate required and recommended services
    const requiredServices = allServices.filter((s) => s.isRequired);
    const recommendedServices = allServices.filter((s) => !s.isRequired);

    // Step 3: Load suggested products based on service type and preferences
    const suggestedProducts = yield* loadSuggestedProducts(
      command.serviceType,
      command.budgetRange,
      command.preferences,
      productRepo
    );

    // Step 4: Calculate cost estimates
    const costEstimate = calculateCostEstimate(
      requiredServices,
      recommendedServices,
      suggestedProducts
    );

    // Step 5: Build primary arrangement
    const primaryArrangement: ServiceArrangement = {
      name: getArrangementName(command.serviceType, false),
      description: getArrangementDescription(command.serviceType),
      serviceType: command.serviceType,
      requiredServices,
      recommendedServices: command.preferences?.preferSimpleArrangement
        ? [] // Minimal arrangement - only required services
        : recommendedServices,
      suggestedProducts,
      costEstimate,
      contractTemplate: contractTemplate ?? undefined,
    };

    // Step 6: Generate alternative arrangements
    const alternativeArrangements = yield* generateAlternativeArrangements(
      command.serviceType,
      allServices,
      productRepo,
      command.budgetRange
    );

    // Step 7: Build personalization message
    const personalization = buildPersonalizationMessage(
      command.budgetRange,
      command.preferences
    );

    return {
      primaryArrangement,
      alternativeArrangements,
      requestedServiceType: command.serviceType,
      budgetRange: command.budgetRange,
      personalization,
    };
  });

/**
 * Validate recommendations command
 */
const validateRecommendationsCommand = (
  command: GetServiceRecommendationsCommand
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    // Validate service type
    if (!command.serviceType) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Service type is required',
        })
      );
    }

    // Validate requested by
    if (!command.requestedBy || command.requestedBy.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Requested by (user ID) is required',
        })
      );
    }

    // Validate budget range if provided
    if (command.budgetRange) {
      if (
        command.budgetRange.min !== undefined &&
        command.budgetRange.min < 0
      ) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Budget minimum cannot be negative',
          })
        );
      }

      if (
        command.budgetRange.max !== undefined &&
        command.budgetRange.max < 0
      ) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Budget maximum cannot be negative',
          })
        );
      }

      if (
        command.budgetRange.min !== undefined &&
        command.budgetRange.max !== undefined &&
        command.budgetRange.min > command.budgetRange.max
      ) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Budget minimum cannot exceed maximum',
          })
        );
      }
    }
  });

/**
 * Load suggested products based on service type and preferences
 */
const loadSuggestedProducts = (
  serviceType: CatalogServiceType,
  budgetRange: GetServiceRecommendationsCommand['budgetRange'],
  preferences: GetServiceRecommendationsCommand['preferences'],
  productRepo: ProductCatalogRepositoryService
): Effect.Effect<
  ServiceArrangement['suggestedProducts'],
  never,
  ProductCatalogRepositoryService
> =>
  Effect.gen(function* () {
    const maxBudget = budgetRange?.max;

    // Load products by category based on service type
    const needsCasket = serviceType.includes('BURIAL');
    const needsUrn = serviceType.includes('CREMATION');

    const caskets = needsCasket
      ? yield* productRepo.find({ category: 'CASKET', availableOnly: true })
      : [];

    const urns = needsUrn
      ? yield* productRepo.find({ category: 'URN', availableOnly: true })
      : [];

    const flowers =
      preferences?.includeFlowers !== false
        ? yield* productRepo.find({ category: 'FLOWERS', availableOnly: true })
        : [];

    const memorialCards =
      preferences?.includeMemorialCards !== false
        ? yield* productRepo.find({
            category: 'MEMORIAL_CARDS',
            availableOnly: true,
          })
        : [];

    const other = yield* productRepo.find({
      category: 'KEEPSAKE',
      availableOnly: true,
    });

    // Filter by budget if provided
    const filterByBudget = (products: Product[]) =>
      maxBudget ? products.filter((p) => p.price <= maxBudget * 0.3) : products; // Products shouldn't exceed 30% of total budget

    return {
      caskets: caskets.length > 0 ? filterByBudget(caskets).slice(0, 3) : undefined,
      urns: urns.length > 0 ? filterByBudget(urns).slice(0, 3) : undefined,
      flowers: flowers.length > 0 ? filterByBudget(flowers).slice(0, 2) : undefined,
      memorialCards:
        memorialCards.length > 0
          ? filterByBudget(memorialCards).slice(0, 2)
          : undefined,
      other: other.length > 0 ? filterByBudget(other).slice(0, 2) : undefined,
    };
  });

/**
 * Calculate cost estimate for arrangement
 */
const calculateCostEstimate = (
  requiredServices: readonly Service[],
  recommendedServices: readonly Service[],
  suggestedProducts: ServiceArrangement['suggestedProducts']
): ServiceArrangement['costEstimate'] => {
  const requiredServicesTotal = requiredServices.reduce(
    (sum, s) => sum + s.price,
    0
  );
  const recommendedServicesTotal = recommendedServices.reduce(
    (sum, s) => sum + s.price,
    0
  );

  // For products, use lowest price in each category as estimate
  const productCategories = [
    suggestedProducts.caskets,
    suggestedProducts.urns,
    suggestedProducts.flowers,
    suggestedProducts.memorialCards,
    suggestedProducts.other,
  ];

  const suggestedProductsTotal = productCategories.reduce((sum, products) => {
    if (!products || products.length === 0) return sum;
    const lowestPrice = Math.min(...products.map((p) => p.price));
    return sum + lowestPrice;
  }, 0);

  const estimatedTotal =
    requiredServicesTotal + recommendedServicesTotal + suggestedProductsTotal;

  return {
    requiredServicesTotal,
    recommendedServicesTotal,
    suggestedProductsTotal,
    estimatedTotal,
  };
};

/**
 * Generate alternative arrangements (e.g., simpler or more comprehensive options)
 */
const generateAlternativeArrangements = (
  primaryServiceType: CatalogServiceType,
  allServices: readonly Service[],
  productRepo: ProductCatalogRepositoryService,
  budgetRange: GetServiceRecommendationsCommand['budgetRange']
): Effect.Effect<readonly ServiceArrangement[], never, ProductCatalogRepositoryService> =>
  Effect.gen(function* () {
    const alternatives: ServiceArrangement[] = [];

    // Alternative 1: Simple arrangement (required services only)
    const requiredServices = allServices.filter((s) => s.isRequired);
    const simpleProducts = yield* loadSuggestedProducts(
      primaryServiceType,
      budgetRange,
      { preferSimpleArrangement: true, includeFlowers: false },
      productRepo
    );

    alternatives.push({
      name: getArrangementName(primaryServiceType, true),
      description: `A simple, dignified ${primaryServiceType.toLowerCase().replace(/_/g, ' ')} with essential services.`,
      serviceType: primaryServiceType,
      requiredServices,
      recommendedServices: [],
      suggestedProducts: simpleProducts,
      costEstimate: calculateCostEstimate(requiredServices, [], simpleProducts),
    });

    // Alternative 2: Comprehensive arrangement (all available services)
    if (allServices.length > requiredServices.length) {
      const comprehensiveProducts = yield* loadSuggestedProducts(
        primaryServiceType,
        budgetRange,
        {
          includeFlowers: true,
          includeMemorialCards: true,
          preferSimpleArrangement: false,
        },
        productRepo
      );

      const recommendedServices = allServices.filter((s) => !s.isRequired);

      alternatives.push({
        name: `Complete ${getArrangementName(primaryServiceType, false)}`,
        description: `A comprehensive ${primaryServiceType.toLowerCase().replace(/_/g, ' ')} with all available services and options.`,
        serviceType: primaryServiceType,
        requiredServices,
        recommendedServices,
        suggestedProducts: comprehensiveProducts,
        costEstimate: calculateCostEstimate(
          requiredServices,
          recommendedServices,
          comprehensiveProducts
        ),
      });
    }

    return alternatives;
  });

/**
 * Get arrangement name based on service type
 */
const getArrangementName = (serviceType: CatalogServiceType, isSimple: boolean): string => {
  const prefix = isSimple ? 'Simple' : '';
  
  const names: Record<CatalogServiceType, string> = {
    TRADITIONAL_BURIAL: `${prefix} Traditional Burial Service`,
    TRADITIONAL_CREMATION: `${prefix} Traditional Cremation Service`,
    MEMORIAL_SERVICE: `${prefix} Memorial Service`,
    DIRECT_BURIAL: `${prefix} Direct Burial Service`,
    DIRECT_CREMATION: `${prefix} Direct Cremation Service`,
    CELEBRATION_OF_LIFE: `${prefix} Celebration of Life Service`,
  };

  return names[serviceType].trim();
};

/**
 * Get arrangement description based on service type
 */
const getArrangementDescription = (serviceType: CatalogServiceType): string => {
  const descriptions: Record<CatalogServiceType, string> = {
    TRADITIONAL_BURIAL: 'A traditional funeral service with viewing, ceremony, and burial. Includes professional services, facility use, and essential preparations.',
    TRADITIONAL_CREMATION: 'A full funeral service with viewing and ceremony, followed by cremation. Includes professional services, facility use, and cremation process.',
    MEMORIAL_SERVICE: 'A memorial service held after final disposition, focusing on celebrating the life of your loved one. Includes facility use and professional guidance.',
    DIRECT_BURIAL: 'A simple, dignified burial without a formal viewing or ceremony. Includes essential professional services and burial arrangements.',
    DIRECT_CREMATION: 'A simple cremation without formal viewing or ceremony. Includes essential professional services and cremation process.',
    CELEBRATION_OF_LIFE: 'A personalized gathering focused on celebrating memories and honoring your loved one. Includes facility use and professional coordination.',
  };

  return descriptions[serviceType];
};

/**
 * Build personalization message
 */
const buildPersonalizationMessage = (
  budgetRange: GetServiceRecommendationsCommand['budgetRange'],
  preferences: GetServiceRecommendationsCommand['preferences']
): GetServiceRecommendationsResult['personalization'] => {
  const budgetGuidanceUsed = !!budgetRange?.max;
  const preferencesApplied = !!preferences && Object.keys(preferences).length > 0;

  let message = 'These arrangements are personalized suggestions. ';

  if (budgetGuidanceUsed) {
    message += `We've considered your budget preferences. `;
  }

  if (preferencesApplied) {
    message += `Your preferences have been applied. `;
  }

  message +=
    'Feel free to customize any arrangement - add or remove services, choose different products, or create your own unique arrangement. Our funeral directors are here to help you create meaningful services that honor your loved one.';

  return {
    budgetGuidanceUsed,
    preferencesApplied,
    message,
  };
};

/**
 * Service tag for dependency injection
 */
export interface GetServiceRecommendationsService {
  readonly getServiceRecommendations: typeof getServiceRecommendations;
}

export const GetServiceRecommendationsService = Context.GenericTag<GetServiceRecommendationsService>(
  '@dykstra/GetServiceRecommendationsService'
);
