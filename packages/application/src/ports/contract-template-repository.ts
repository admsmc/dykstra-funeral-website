import { type Effect, Context } from 'effect';
import { type CatalogServiceType } from './catalog-repository';

/**
 * Contract Template - Domain Model
 */
export interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  serviceType: CatalogServiceType | null;
  content: string;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contract Template with creator details
 */
export interface ContractTemplateWithCreator extends ContractTemplate {
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Custom errors for Contract Template operations
 */
export class TemplateNotFoundError {
  readonly _tag = 'TemplateNotFoundError';
  constructor(readonly identifier: string) {}
}

export class TemplateValidationError {
  readonly _tag = 'TemplateValidationError';
  constructor(readonly message: string) {}
}

/**
 * Contract Template Repository Port
 */
export interface ContractTemplateRepository {
  /**
   * Find templates with optional filters
   */
  find(filters: {
    serviceType?: CatalogServiceType;
    activeOnly?: boolean;
  }): Effect.Effect<ContractTemplateWithCreator[], never, never>;

  /**
   * Find default template for service type
   */
  findDefault(
    serviceType: CatalogServiceType
  ): Effect.Effect<ContractTemplateWithCreator | null, never, never>;

  /**
   * Find template by ID
   */
  findById(id: string): Effect.Effect<ContractTemplate | null, never, never>;

  /**
   * Create a new template
   */
  create(data: {
    name: string;
    description: string | null;
    serviceType: CatalogServiceType | null;
    content: string;
    variables: string[];
    isDefault: boolean;
    createdBy: string;
  }): Effect.Effect<ContractTemplateWithCreator, never, never>;

  /**
   * Update existing template
   */
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
  ): Effect.Effect<ContractTemplateWithCreator, TemplateNotFoundError, never>;

  /**
   * Delete template
   */
  delete(id: string): Effect.Effect<void, TemplateNotFoundError, never>;

  /**
   * Unset other defaults for a service type
   */
  unsetDefaultsForServiceType(
    serviceType: CatalogServiceType
  ): Effect.Effect<void, never, never>;
}

export const ContractTemplateRepository = Context.GenericTag<ContractTemplateRepository>(
  '@dykstra/ContractTemplateRepository'
);
