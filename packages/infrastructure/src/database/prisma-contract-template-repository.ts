import { Effect } from 'effect';
import { prisma } from './prisma-client';
import type {
  ContractTemplateRepository,
  ContractTemplateWithCreator,
  TemplateNotFoundError,
  CatalogServiceType,
} from '@dykstra/application';

/**
 * Prisma implementation of Contract Template Repository
 */
export const PrismaContractTemplateRepository: ContractTemplateRepository = {
  find: (filters: {
    serviceType?: CatalogServiceType;
    activeOnly?: boolean;
  }) =>
    Effect.tryPromise({
      try: async () => {
        const where: any = {};
        if (filters.serviceType) where.serviceType = filters.serviceType;
        if (filters.activeOnly) where.isActive = true;

        const templates = await prisma.contractTemplate.findMany({
          where,
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });

        return templates.map((t: any) => ({
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
    }).pipe(Effect.orDie),

  findDefault: (
    serviceType: CatalogServiceType
  ) =>
    Effect.tryPromise({
      try: async () => {
        const t = await prisma.contractTemplate.findFirst({
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
    }).pipe(Effect.orDie),

  findById: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const t = await prisma.contractTemplate.findUnique({ where: { id } });
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
    }).pipe(Effect.orDie),

  create: (data: {
    name: string;
    description: string | null;
    serviceType: CatalogServiceType | null;
    content: string;
    variables: string[];
    isDefault: boolean;
    createdBy: string;
  }) =>
    Effect.tryPromise({
      try: async () => {
        const t = await prisma.contractTemplate.create({
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
    }).pipe(Effect.orDie),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      variables?: string[];
      isDefault?: boolean;
      isActive?: boolean;
    }
  ) =>
    Effect.tryPromise({
      try: async () => {
        const t = await prisma.contractTemplate.update({
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
          return { _tag: 'TemplateNotFoundError', id } as unknown as TemplateNotFoundError;
        }
        throw new Error(`Failed to update template: ${error}`);
      },
    }).pipe(
      Effect.flatMap((result: any) =>
        typeof result === 'object' && result !== null && '_tag' in result && result._tag === 'TemplateNotFoundError'
          ? Effect.fail(result as TemplateNotFoundError)
          : Effect.succeed(result as ContractTemplateWithCreator)
      )
    ),

  delete: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.contractTemplate.delete({ where: { id } });
      },
      catch: (error: any) => {
        if (error?.code === 'P2025') {
          return { _tag: 'TemplateNotFoundError', id } as unknown as TemplateNotFoundError;
        }
        throw new Error(`Failed to delete template: ${error}`);
      },
    }).pipe(
      Effect.flatMap((result: any) =>
        typeof result === 'object' && result !== null && '_tag' in result && result._tag === 'TemplateNotFoundError'
          ? Effect.fail(result as TemplateNotFoundError)
          : Effect.succeed(undefined)
      )
    ),

  unsetDefaultsForServiceType: (
    serviceType: CatalogServiceType
  ) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.contractTemplate.updateMany({
          where: { serviceType, isDefault: true },
          data: { isDefault: false },
        });
      },
      catch: (error) => new Error(`Failed to unset defaults: ${error}`),
    }).pipe(Effect.orDie),
};
