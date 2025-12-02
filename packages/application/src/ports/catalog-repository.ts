import { type Effect, Context } from 'effect';

/**
 * Product Category enum
 */
export type ProductCategory =
  | 'CASKET'
  | 'URN'
  | 'VAULT'
  | 'FLOWERS'
  | 'MEMORIAL_CARDS'
  | 'GUEST_BOOK'
  | 'JEWELRY'
  | 'KEEPSAKE'
  | 'MISCELLANEOUS';

/**
 * Service Type enum
 */
export type CatalogServiceType =
  | 'TRADITIONAL_BURIAL'
  | 'TRADITIONAL_CREMATION'
  | 'MEMORIAL_SERVICE'
  | 'DIRECT_BURIAL'
  | 'DIRECT_CREMATION'
  | 'CELEBRATION_OF_LIFE';

/**
 * Product from catalog
 */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  sku: string;
  price: number;
  isAvailable: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service from catalog
 */
export interface Service {
  id: string;
  name: string;
  description: string | null;
  serviceType: CatalogServiceType | null;
  price: number;
  isRequired: boolean;
  isAvailable: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Catalog Repository Port
 */
export interface ProductCatalogRepository {
  /**
   * Find products with optional filters
   */
  find(filters: {
    category?: ProductCategory;
    search?: string;
    availableOnly?: boolean;
  }): Effect.Effect<Product[], never, never>;

  /**
   * Find product by ID
   */
  findById(id: string): Effect.Effect<Product | null, never, never>;
}

export const ProductCatalogRepository = Context.GenericTag<ProductCatalogRepository>(
  '@dykstra/ProductCatalogRepository'
);

/**
 * Service Catalog Repository Port
 */
export interface ServiceCatalogRepository {
  /**
   * Find services with optional filters
   */
  find(filters: {
    serviceType?: CatalogServiceType;
    availableOnly?: boolean;
  }): Effect.Effect<Service[], never, never>;

  /**
   * Find service by ID
   */
  findById(id: string): Effect.Effect<Service | null, never, never>;
}

export const ServiceCatalogRepository = Context.GenericTag<ServiceCatalogRepository>(
  '@dykstra/ServiceCatalogRepository'
);
