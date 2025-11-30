import { Effect } from 'effect';
import { Lead, Case, InvalidStateTransitionError, ValidationError } from '@dykstra/domain';
import { 
  LeadRepository, 
  type LeadRepositoryService, 
  NotFoundError, 
  PersistenceError 
} from '../../ports/lead-repository';
import { 
  CaseRepository, 
  type CaseRepository as CaseRepositoryService,
} from '../../ports/case-repository';
import {
  GoContractPort,
  type GoContractPortService,
  type CreateContractCommand,
  type GoContract,
  NetworkError,
} from '../../ports/go-contract-port';

/**
 * Command for converting a lead to a case with contract
 */
export interface ConvertLeadToCaseWithContractCommand {
  readonly leadBusinessKey: string;
  readonly decedentName?: string;  // If different from lead name
  readonly caseType: 'at_need' | 'pre_need';
  readonly createdBy: string;
  readonly services: readonly {
    readonly description: string;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly glAccountId?: string;
  }[];
  readonly products: readonly {
    readonly description: string;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly glAccountId?: string;
  }[];
}

/**
 * Result of lead-to-case-with-contract conversion
 */
export interface ConvertLeadToCaseWithContractResult {
  readonly lead: Lead;
  readonly case: Case;
  readonly contract: GoContract;
}

/**
 * Convert Lead to Case with Contract (Cross-Domain Orchestration)
 * 
 * This use case orchestrates across TypeScript and Go domains:
 * 1. TypeScript Domain: Load and validate lead
 * 2. TypeScript Domain: Create case from lead
 * 3. Go Domain: Create contract for case (via GoContractPort)
 * 4. TypeScript Domain: Link case to contract
 * 5. TypeScript Domain: Mark lead as converted
 * 
 * This demonstrates the boundary between TypeScript CRM (leads, cases)
 * and Go ERP (contracts, financials) with proper error handling.
 * 
 * @example
 * ```typescript
 * const result = pipe(
 *   convertLeadToCaseWithContract({
 *     leadBusinessKey: 'lead-123',
 *     caseType: 'at_need',
 *     createdBy: 'staff-user-1',
 *     services: [
 *       { description: 'Funeral Director Services', quantity: 1, unitPrice: 350000 }
 *     ],
 *     products: [
 *       { description: 'Oak Casket', quantity: 1, unitPrice: 450000 }
 *     ]
 *   }),
 *   Effect.provide(InfrastructureLayer),
 *   Effect.runPromise
 * );
 * ```
 */
export const convertLeadToCaseWithContract = (
  command: ConvertLeadToCaseWithContractCommand
): Effect.Effect<
  ConvertLeadToCaseWithContractResult,
  NotFoundError | InvalidStateTransitionError | ValidationError | PersistenceError | NetworkError,
  LeadRepositoryService | CaseRepositoryService | GoContractPortService
> =>
  Effect.gen(function* () {
    const leadRepo = yield* LeadRepository;
    const caseRepo = yield* CaseRepository;
    const goContractPort = yield* GoContractPort;
    
    // Step 1: Load and validate lead (TypeScript domain)
    const lead = yield* leadRepo.findByBusinessKey(command.leadBusinessKey);
    
    if (!lead) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Lead not found',
          entityType: 'Lead',
          entityId: command.leadBusinessKey,
        })
      );
    }
    
    // Validate lead is qualified
    if (lead.status !== 'qualified') {
      return yield* Effect.fail(
        new ValidationError({
          message: `Lead must be qualified before conversion to case with contract (current status: ${lead.status})`,
          field: 'status',
        })
      );
    }
    
    // Validate at least one service or product
    if (command.services.length === 0 && command.products.length === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'At least one service or product is required for contract',
          field: 'services',
        })
      );
    }
    
    // Step 2: Create case from lead (TypeScript domain)
    const decedentName = command.decedentName || `${lead.firstName} ${lead.lastName}`;
    
    const newCase = yield* Case.create({
      id: crypto.randomUUID(),
      businessKey: crypto.randomUUID(),
      funeralHomeId: lead.funeralHomeId,
      decedentName,
      type: command.caseType,
      createdBy: command.createdBy,
    });
    
    yield* caseRepo.save(newCase);
    
    // Step 3: Create contract in Go ERP (Go domain via port)
    const contractCommand: CreateContractCommand = {
      caseId: newCase.businessKey,
      services: command.services.map(s => ({
        description: s.description,
        quantity: s.quantity,
        unitPrice: s.unitPrice,
        totalPrice: s.quantity * s.unitPrice,
        glAccountId: s.glAccountId,
      })),
      products: command.products.map(p => ({
        description: p.description,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.quantity * p.unitPrice,
        glAccountId: p.glAccountId,
      })),
    };
    
    const contract = yield* goContractPort.createContract(contractCommand);
    
    // Step 4: Link case to contract (TypeScript domain)
    // Note: Since Case entity doesn't have metadata, we just use the new case
    // In production, you'd store the contract link in a separate table or extend Case entity
    
    yield* caseRepo.save(newCase);
    
    // Step 5: Mark lead as converted (TypeScript domain)
    const convertedLead = yield* lead.convertToCase(newCase.id);
    yield* leadRepo.update(convertedLead);
    
    return {
      lead: convertedLead,
      case: newCase,
      contract,
    };
  });
