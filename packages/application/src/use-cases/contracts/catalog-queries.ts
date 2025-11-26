import { Effect } from 'effect';
import {
  ProductCatalogRepository,
  ServiceCatalogRepository,
  Product,
  Service,
  ProductCategory,
  CatalogServiceType,
} from '../../ports/catalog-repository';

/**
 * Get product catalog with optional filters
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
