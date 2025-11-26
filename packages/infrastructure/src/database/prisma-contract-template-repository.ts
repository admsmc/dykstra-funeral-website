import { Effect } from 'effect';
import { PrismaClient } from '@prisma/client';
import {
  ContractTemplateRepository,
  ContractTemplate,
  ContractTemplateWithCreator,
  TemplateNotFoundError,
} from '@dykstra/application/ports/contract-template-repository';
import { CatalogServiceType } from '@dykstra/application/ports/catalog-repository';

export class PrismaContractTemplateRepository implements ContractTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  find(filters: {
    serviceType?: CatalogServiceType;
    activeOnly?: boolean;
  }): Effect.Effect<ContractTemplateWithCreator[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const where: any = {};
        if (filters.serviceType) where.serviceType = filters.serviceType;
        if (filters.activeOnly) where.isActive = true;

        const templates = await this.prisma.contractTemplate.findMany({
          where,
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });

        return templates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          serviceType: t.serviceType as CatalogServiceType | null,
          content: t.content,
          variables: t.variables as string[],
          isDefault: t.isDefault,
          isActive: t.isActive,
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          creator: t.creator,
        }));
      },
      catch: (error) => new Error(`Failed to fetch templates: ${error}`),
    }).pipe(Effect.orDie);
  }

  findDefault(
    serviceType: CatalogServiceType
  ): Effect.Effect<ContractTemplateWithCreator | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const t = await this.prisma.contractTemplate.findFirst({
          where: { serviceType, isDefault: true, isActive: true },
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        if (!t) return null;

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          serviceType: t.serviceType as CatalogServiceType | null,
          content: t.content,
          variables: t.variables as string[],
          isDefault: t.isDefault,
          isActive: t.isActive,
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          creator: t.creator,
        };
      },
      catch: (error) => new Error(`Failed to fetch default template: ${error}`),
    }).pipe(Effect.orDie);
  }

  findById(id: string): Effect.Effect<ContractTemplate | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const t = await this.prisma.contractTemplate.findUnique({ where: { id } });
        if (!t) return null;
        return {
          id: t.id,
          name: t.name,
          description: t.description,
          serviceType: t.serviceType as CatalogServiceType | null,
          content: t.content,
          variables: t.variables as string[],
          isDefault: t.isDefault,
          isActive: t.isActive,
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      },
      catch: (error) => new Error(`Failed to fetch template: ${error}`),
    }).pipe(Effect.orDie);
  }

  create(data: {
    name: string;
    description: string | null;
    serviceType: CatalogServiceType | null;
    content: string;
    variables: string[];
    isDefault: boolean;
    createdBy: string;
  }): Effect.Effect<ContractTemplateWithCreator, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const t = await this.prisma.contractTemplate.create({
          data: {
            name: data.name,
            description: data.description,
            serviceType: data.serviceType,
            content: data.content,
            variables: data.variables,
            isDefault: data.isDefault,
            createdBy: data.createdBy,
          },
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          serviceType: t.serviceType as CatalogServiceType | null,
          content: t.content,
          variables: t.variables as string[],
          isDefault: t.isDefault,
          isActive: t.isActive,
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          creator: t.creator,
        };
      },
      catch: (error) => new Error(`Failed to create template: ${error}`),
    }).pipe(Effect.orDie);
  }

  update(
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      variables?: string[];
      isDefault?: boolean;
      isActive?: boolean;
    }
  ): Effect.Effect<ContractTemplateWithCreator, TemplateNotFoundError, never> {
    return Effect.tryPromise({
      try: async () => {
        const t = await this.prisma.contractTemplate.update({
          where: { id },
          data,
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          serviceType: t.serviceType as CatalogServiceType | null,
          content: t.content,
          variables: t.variables as string[],
          isDefault: t.isDefault,
          isActive: t.isActive,
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          creator: t.creator,
        };
      },
      catch: (error: any) => {
        if (error?.code === 'P2025') {
          return new TemplateNotFoundError(id);
        }
        throw new Error(`Failed to update template: ${error}`);
      },
    }).pipe(
      Effect.flatMap((result) =>
        result instanceof TemplateNotFoundError
          ? Effect.fail(result)
          : Effect.succeed(result)
      )
    );
  }

  delete(id: string): Effect.Effect<void, TemplateNotFoundError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.prisma.contractTemplate.delete({ where: { id } });
      },
      catch: (error: any) => {
        if (error?.code === 'P2025') {
          return new TemplateNotFoundError(id);
        }
        throw new Error(`Failed to delete template: ${error}`);
      },
    }).pipe(
      Effect.flatMap((result) =>
        result instanceof TemplateNotFoundError
          ? Effect.fail(result)
          : Effect.succeed(undefined)
      )
    );
  }

  unsetDefaultsForServiceType(
    serviceType: CatalogServiceType
  ): Effect.Effect<void, never, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.prisma.contractTemplate.updateMany({
          where: { serviceType, isDefault: true },
          data: { isDefault: false },
        });
      },
      catch: (error) => new Error(`Failed to unset defaults: ${error}`),
    }).pipe(Effect.orDie);
  }
}
