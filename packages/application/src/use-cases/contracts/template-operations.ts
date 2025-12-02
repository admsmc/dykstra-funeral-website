import { Effect } from 'effect';
import {
  ContractTemplateRepository,
  type ContractTemplateWithCreator,
  TemplateNotFoundError,
} from '../../ports/contract-template-repository';
import { type CatalogServiceType } from '../../ports/catalog-repository';
import { ValidationError } from '@dykstra/domain';

/**
 * Template Operations
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

export const getTemplates = (filters: {
  serviceType?: CatalogServiceType;
  activeOnly?: boolean;
}): Effect.Effect<ContractTemplateWithCreator[], never, ContractTemplateRepository> =>
  Effect.gen(function* () {
    const repo = yield* ContractTemplateRepository;
    return yield* repo.find(filters);
  });

export const getDefaultTemplate = (
  serviceType: CatalogServiceType
): Effect.Effect<
  ContractTemplateWithCreator,
  TemplateNotFoundError,
  ContractTemplateRepository
> =>
  Effect.gen(function* () {
    const repo = yield* ContractTemplateRepository;
    const template = yield* repo.findDefault(serviceType);
    if (!template) {
      return yield* Effect.fail(new TemplateNotFoundError(`${serviceType}`));
    }
    return template;
  });

export const saveTemplate = (data: {
  name: string;
  description?: string;
  serviceType?: CatalogServiceType;
  content: string;
  variables?: string[];
  isDefault?: boolean;
  createdBy: string;
}): Effect.Effect<
  ContractTemplateWithCreator,
  ValidationError,
  ContractTemplateRepository
> =>
  Effect.gen(function* () {
    if (!data.name?.trim()) {
      return yield* Effect.fail(new ValidationError({ message: 'Template name required', field: 'name' }));
    }
    if (!data.content?.trim()) {
      return yield* Effect.fail(new ValidationError({ message: 'Template content required', field: 'content' }));
    }
    const repo = yield* ContractTemplateRepository;
    if (data.isDefault && data.serviceType) {
      yield* repo.unsetDefaultsForServiceType(data.serviceType);
    }
    return yield* repo.create({
      name: data.name,
      description: data.description || null,
      serviceType: data.serviceType || null,
      content: data.content,
      variables: data.variables || [],
      isDefault: data.isDefault || false,
      createdBy: data.createdBy,
    });
  });

export const updateTemplate = (
  id: string,
  data: {
    name?: string;
    description?: string;
    content?: string;
    variables?: string[];
    isDefault?: boolean;
    isActive?: boolean;
  }
): Effect.Effect<ContractTemplateWithCreator, TemplateNotFoundError, ContractTemplateRepository> =>
  Effect.gen(function* () {
    const repo = yield* ContractTemplateRepository;
    return yield* repo.update(id, data);
  });

export const deleteTemplate = (
  id: string
): Effect.Effect<void, TemplateNotFoundError, ContractTemplateRepository> =>
  Effect.gen(function* () {
    const repo = yield* ContractTemplateRepository;
    return yield* repo.delete(id);
  });

export const calculateContractTotal = (data: {
  services: Array<{ id: string; quantity: number; price: number }>;
  products: Array<{ id: string; quantity: number; price: number }>;
  taxRate: number;
}) => {
  const servicesSubtotal = data.services.reduce((s, i) => s + i.price * i.quantity, 0);
  const productsSubtotal = data.products.reduce((s, i) => s + i.price * i.quantity, 0);
  const subtotal = servicesSubtotal + productsSubtotal;
  const tax = subtotal * data.taxRate;
  const total = subtotal + tax;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    breakdown: {
      services: Math.round(servicesSubtotal * 100) / 100,
      products: Math.round(productsSubtotal * 100) / 100,
    },
  };
};

export const substituteVariables = (
  content: string,
  variables: Record<string, string>
): string => {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
};
