import { Data } from 'effect';
import type { CaseId } from '../entities/case';

/**
 * Base domain event
 */
export abstract class DomainEvent extends Data.Class<{
  readonly occurredAt: Date;
  readonly aggregateId: string;
}> {}

/**
 * Case created event
 */
export class CaseCreated extends Data.TaggedClass('CaseCreated')<{
  readonly occurredAt: Date;
  readonly aggregateId: CaseId;
  readonly funeralHomeId: string;
  readonly decedentName: string;
  readonly caseType: string;
  readonly createdBy: string;
}> {}

/**
 * Case activated event
 */
export class CaseActivated extends Data.TaggedClass('CaseActivated')<{
  readonly occurredAt: Date;
  readonly aggregateId: CaseId;
  readonly activatedBy: string;
}> {}

/**
 * Case completed event
 */
export class CaseCompleted extends Data.TaggedClass('CaseCompleted')<{
  readonly occurredAt: Date;
  readonly aggregateId: CaseId;
  readonly completedBy: string;
}> {}

/**
 * Family member invited event
 */
export class FamilyMemberInvited extends Data.TaggedClass('FamilyMemberInvited')<{
  readonly occurredAt: Date;
  readonly aggregateId: CaseId;
  readonly inviteeEmail: string;
  readonly inviteeName: string;
  readonly invitedBy: string;
  readonly role: string;
}> {}

/**
 * Contract created event
 */
export class ContractCreated extends Data.TaggedClass('ContractCreated')<{
  readonly occurredAt: Date;
  readonly aggregateId: string; // contractId
  readonly caseId: CaseId;
  readonly totalAmount: number;
  readonly createdBy: string;
}> {}

/**
 * Contract signed event
 */
export class ContractSigned extends Data.TaggedClass('ContractSigned')<{
  readonly occurredAt: Date;
  readonly aggregateId: string; // contractId
  readonly caseId: CaseId;
  readonly signerId: string;
  readonly signerName: string;
  readonly signerEmail: string;
  readonly ipAddress: string;
}> {}

/**
 * Contract fully signed event (all required signatures collected)
 */
export class ContractFullySigned extends Data.TaggedClass('ContractFullySigned')<{
  readonly occurredAt: Date;
  readonly aggregateId: string; // contractId
  readonly caseId: CaseId;
  readonly totalSignatures: number;
}> {}

/**
 * Payment received event
 */
export class PaymentReceived extends Data.TaggedClass('PaymentReceived')<{
  readonly occurredAt: Date;
  readonly aggregateId: string; // paymentId
  readonly caseId: CaseId;
  readonly amount: number;
  readonly paymentMethod: string;
  readonly paidBy: string;
}> {}

/**
 * Payment failed event
 */
export class PaymentFailed extends Data.TaggedClass('PaymentFailed')<{
  readonly occurredAt: Date;
  readonly aggregateId: string; // paymentId
  readonly caseId: CaseId;
  readonly amount: number;
  readonly failureReason: string;
}> {}

/**
 * Photo uploaded event
 */
export class PhotoUploaded extends Data.TaggedClass('PhotoUploaded')<{
  readonly occurredAt: Date;
  readonly aggregateId: string; // photoId
  readonly memorialId: string;
  readonly caseId: CaseId;
  readonly uploadedBy: string;
  readonly uploadedByName: string;
}> {}

/**
 * Tribute added event
 */
export class TributeAdded extends Data.TaggedClass('TributeAdded')<{
  readonly occurredAt: Date;
  readonly aggregateId: string; // tributeId
  readonly memorialId: string;
  readonly caseId: CaseId;
  readonly authorName: string;
}> {}

/**
 * Photo deleted event
 */
export class PhotoDeleted extends Data.TaggedClass('PhotoDeleted')<{
  readonly occurredAt: Date;
  readonly aggregateId: string; // photoId
  readonly memorialId: string;
  readonly caseId: CaseId;
  readonly deletedBy: string;
}> {}
