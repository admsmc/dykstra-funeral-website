import { Effect } from 'effect';
import { PrismaClient } from '@prisma/client';
import type {
  ProductCatalogRepository,
  ServiceCatalogRepository,
  Product,
  Service,
  ProductCategory,
  CatalogServiceType,
} from '@dykstra/application';

export class PrismaProductCatalogRepository implements ProductCatalogRepository {
  constructor(private prisma: PrismaClient) {}

  find(filters: {
    category?: ProductCategory;
    search?: string;
    availableOnly?: boolean;
  }): Effect.Effect<Product[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const where: any = {};

        if (filters.category) {
          where.category = filters.category;
        }

        if (filters.availableOnly) {
          where.isAvailable = true;
        }

        if (filters.search) {
          where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } },
          ];
        }

        const products = await this.prisma.productCatalog.findMany({
          where,
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        });

        return products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category as ProductCategory,
          sku: p.sku,
          price: Number(p.price),
          isAvailable: p.isAvailable,
          displayOrder: p.displayOrder,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));
      },
      catch: (error) => new Error(`Failed to fetch products: ${error}`),
    }).pipe(Effect.orDie);
  }

  findById(id: string): Effect.Effect<Product | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const p = await this.prisma.productCatalog.findUnique({ where: { id } });
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category as ProductCategory,
          sku: p.sku,
          price: Number(p.price),
          isAvailable: p.isAvailable,
          displayOrder: p.displayOrder,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      },
      catch: (error) => new Error(`Failed to fetch product: ${error}`),
    }).pipe(Effect.orDie);
  }
}

export class PrismaServiceCatalogRepository implements ServiceCatalogRepository {
  constructor(private prisma: PrismaClient) {}

  find(filters: {
    serviceType?: CatalogServiceType;
    availableOnly?: boolean;
  }): Effect.Effect<Service[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const where: any = {};

        if (filters.serviceType) {
          where.serviceType = filters.serviceType;
        }

        if (filters.availableOnly) {
          where.isAvailable = true;
        }

        const services = await this.prisma.serviceCatalog.findMany({
          where,
          orderBy: [{ isRequired: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
        });

        return services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          serviceType: s.serviceType as CatalogServiceType | null,
          price: Number(s.price),
          isRequired: s.isRequired,
          isAvailable: s.isAvailable,
          displayOrder: s.displayOrder,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));
      },
      catch: (error) => new Error(`Failed to fetch services: ${error}`),
    }).pipe(Effect.orDie);
  }

  findById(id: string): Effect.Effect<Service | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const s = await this.prisma.serviceCatalog.findUnique({ where: { id } });
        if (!s) return null;
        return {
          id: s.id,
          name: s.name,
          description: s.description,
          serviceType: s.serviceType as CatalogServiceType | null,
          price: Number(s.price),
          isRequired: s.isRequired,
          isAvailable: s.isAvailable,
          displayOrder: s.displayOrder,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
      },
      catch: (error) => new Error(`Failed to fetch service: ${error}`),
    }).pipe(Effect.orDie);
  }
}
