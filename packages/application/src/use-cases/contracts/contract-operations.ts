import { Effect } from 'effect';
import { ContractRepository, PersistenceError } from '../../ports/contract-repository';
import { NotFoundError } from '../../ports/case-repository';
import { Contract, ValidationError, InvalidStateTransitionError, BusinessRuleViolationError } from '@dykstra/domain';
import type { ContractStatus } from '@dykstra/shared';

export const createContract = (data: {
  caseId: string;
  templateId?: string;
  services: Array<{ id: string; name: string; quantity: number; price: number }>;
  products: Array<{ id: string; name: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  totalAmount: number;
  termsAndConditions: string;
  createdBy: string;
}): Effect.Effect<Contract, ValidationError | PersistenceError, ContractRepository> =>
  Effect.gen(function* () {
    const contractRepo = yield* ContractRepository;
    const businessKey = `CONTRACT_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const id = `contract_${Date.now()}`;
    
    // Create Contract entity using domain logic
    const contract = yield* Contract.create({
      id,
      businessKey,
      caseId: data.caseId,
      services: data.services,
      products: data.products,
      termsAndConditions: data.termsAndConditions,
      createdBy: data.createdBy,
    });
    
    // Persist via repository
    return yield* contractRepo.create(contract);
  });

export const listContracts = (filters: {
  status?: ContractStatus;
  caseId?: string;
  limit?: number;
  cursor?: string;
}): Effect.Effect<{ contracts: readonly Contract[]; nextCursor: string | undefined }, PersistenceError, ContractRepository> =>
  Effect.gen(function* () {
    const contractRepo = yield* ContractRepository;
    const contracts = yield* contractRepo.findByCase(filters.caseId || '');
    
    // Contracts from repo are already current versions only
    let filtered = contracts;
    if (filters.status) {
      filtered = contracts.filter((c) => c.status === filters.status);
    }
    
    const limit = filters.limit || 50;
    const result = filtered.slice(0, limit + 1);
    let nextCursor: string | undefined;
    
    if (result.length > limit) {
      result.pop();
      nextCursor = result[result.length - 1]?.id;
    }
    
    return { contracts: result, nextCursor };
  });

export const getContractDetails = (
  contractId: string
): Effect.Effect<Contract, NotFoundError | PersistenceError, ContractRepository> =>
  Effect.gen(function* () {
    const contractRepo = yield* ContractRepository;
    const contract = yield* contractRepo.findById(contractId as any);
    
    if (!contract) {
      return yield* Effect.fail(new NotFoundError({
        message: `Contract not found: ${contractId}`,
        entityType: 'Contract',
        entityId: contractId
      }));
    }
    
    return contract;
  });

export const updateContractStatus = (data: {
  businessKey: string;
  status: ContractStatus;
}): Effect.Effect<{ success: true; message: string }, NotFoundError | InvalidStateTransitionError | BusinessRuleViolationError | PersistenceError, ContractRepository> =>
  Effect.gen(function* () {
    const contractRepo = yield* ContractRepository;
    const current = yield* contractRepo.findByBusinessKey(data.businessKey);
    
    if (!current) {
      return yield* Effect.fail(new NotFoundError({
        message: `Contract not found: ${data.businessKey}`,
        entityType: 'Contract',
        entityId: data.businessKey
      }));
    }
    
    // Use Contract entity's transitionStatus method for validation
    const updatedContract = yield* current.transitionStatus(data.status);
    yield* contractRepo.update(updatedContract);
    
    return {
      success: true,
      message: `Contract status updated to ${data.status}`,
    };
  });
