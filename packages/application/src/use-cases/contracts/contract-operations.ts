import { Effect } from 'effect';
import { ContractRepository } from '../../ports/contract-repository';
import { NotFoundError } from '../../ports/case-repository';
import { ValidationError } from '@dykstra/domain';

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PENDING_SIGNATURES'
  | 'FULLY_SIGNED'
  | 'CANCELLED';

export const createContract = (data: {
  caseId: string;
  templateId?: string;
  services: Array<{ id: string; name: string; quantity: number; price: number }>;
  products: Array<{ id: string; name: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  totalAmount: number;
  termsAndConditions: string;
  status: ContractStatus;
  createdBy: string;
}): Effect.Effect<any, ValidationError | NotFoundError, ContractRepository> =>
  Effect.gen(function* () {
    const contractRepo = yield* ContractRepository;
    const businessKey = `CONTRACT_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    return yield* contractRepo.create({
      businessKey,
      caseId: data.caseId,
      services: data.services,
      products: data.products,
      subtotal: data.subtotal.toString(),
      tax: data.tax.toString(),
      totalAmount: data.totalAmount.toString(),
      termsAndConditions: data.termsAndConditions,
      status: data.status,
      createdBy: data.createdBy,
    });
  });

export const listContracts = (filters: {
  status?: ContractStatus;
  caseId?: string;
  limit?: number;
  cursor?: string;
}): Effect.Effect<any, never, ContractRepository> =>
  Effect.gen(function* () {
    const contractRepo = yield* ContractRepository;
    const contracts = yield* contractRepo.findByCase(filters.caseId || '');
    
    let filtered = contracts.filter((c) => c.isCurrent);
    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
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
): Effect.Effect<any, NotFoundError, ContractRepository> =>
  Effect.gen(function* () {
    const contractRepo = yield* ContractRepository;
    const contract = yield* contractRepo.findById(contractId);
    
    if (!contract) {
      return yield* Effect.fail(new NotFoundError('Contract', contractId));
    }
    
    return contract;
  });

export const updateContractStatus = (data: {
  businessKey: string;
  status: ContractStatus;
}): Effect.Effect<{ success: true; message: string }, NotFoundError, ContractRepository> =>
  Effect.gen(function* () {
    const contractRepo = yield* ContractRepository;
    const current = yield* contractRepo.findByBusinessKey(data.businessKey);
    
    if (!current) {
      return yield* Effect.fail(new NotFoundError('Contract', data.businessKey));
    }
    
    yield* contractRepo.update({
      ...current,
      status: data.status,
    });
    
    return {
      success: true,
      message: `Contract status updated to ${data.status}`,
    };
  });
