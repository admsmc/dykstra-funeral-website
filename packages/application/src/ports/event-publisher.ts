import { type Effect, Context } from 'effect';
import type {
  CaseCreated,
  CaseActivated,
  FamilyMemberInvited,
  ContractSigned,
  PaymentReceived,
  PhotoUploaded,
  PhotoDeleted,
} from '@dykstra/domain';

/**
 * Domain event types
 */
export type DomainEvent =
  | CaseCreated
  | CaseActivated
  | FamilyMemberInvited
  | ContractSigned
  | PaymentReceived
  | PhotoUploaded
  | PhotoDeleted;

/**
 * Event publishing error
 */
export class EventPublishError extends Error {
  readonly _tag = 'EventPublishError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * Event Publisher port
 * Publishes domain events to event bus
 */
export interface EventPublisher {
  /**
   * Publish a single event
   */
  readonly publish: (event: DomainEvent) => Effect.Effect<void, EventPublishError>;
  
  /**
   * Publish multiple events
   */
  readonly publishMany: (events: readonly DomainEvent[]) => Effect.Effect<void, EventPublishError>;
}

/**
 * Event Publisher service tag for dependency injection
 */
export const EventPublisher = Context.GenericTag<EventPublisher>('@dykstra/EventPublisher');
