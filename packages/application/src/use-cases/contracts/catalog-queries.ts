import { Effect } from 'effect';
import {
  ProductCatalogRepository,
  ServiceCatalogRepository,
  type Product,
  type Service,
  type ProductCategory,
  type CatalogServiceType,
} from '../../ports/catalog-repository';

/**
 * Get product catalog with optional filters
 */
/**
 * Catalog Queries
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

export const getProductCatalog = (filters: {
  category?: ProductCategory;
  search?: string;
  availableOnly?: boolean;
}): Effect.Effect<Product[], never, ProductCatalogRepository> =>
  Effect.gen(function* () {
    const repo = yield* ProductCatalogRepository;
    return yield* repo.find(filters);
  });

/**
 * Get service catalog with optional filters
 */
export const getServiceCatalog = (filters: {
  serviceType?: CatalogServiceType;
  availableOnly?: boolean;
}): Effect.Effect<Service[], never, ServiceCatalogRepository> =>
  Effect.gen(function* () {
    const repo = yield* ServiceCatalogRepository;
    return yield* repo.find(filters);
  });
