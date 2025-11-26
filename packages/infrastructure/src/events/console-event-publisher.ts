import { Effect, Layer } from 'effect';
import type { EventPublisher, DomainEvent } from '@dykstra/application';
import { EventPublishError } from '@dykstra/application';

/**
 * Console-based event publisher
 * Logs events to console - useful for development
 * In production, replace with real event bus (e.g., EventStore, Kafka, AWS EventBridge)
 */
export const ConsoleEventPublisher: EventPublisher = {
  publish: (event: DomainEvent) =>
    Effect.try({
      try: () => {
        console.log('[EVENT PUBLISHED]', {
          type: event._tag,
          aggregateId: event.aggregateId,
          occurredAt: event.occurredAt,
          payload: event,
        });
      },
      catch: (error) => new EventPublishError('Failed to publish event', error),
    }),

  publishMany: (events: readonly DomainEvent[]) =>
    Effect.try({
      try: () => {
        console.log(`[EVENTS PUBLISHED] ${events.length} events:`);
        events.forEach((event) => {
          console.log('  -', {
            type: event._tag,
            aggregateId: event.aggregateId,
            occurredAt: event.occurredAt,
          });
        });
      },
      catch: (error) => new EventPublishError('Failed to publish events', error),
    }),
};

/**
 * Effect Layer to provide EventPublisher
 */
export const ConsoleEventPublisherLive = Layer.succeed(
  (await import('@dykstra/application')).EventPublisher,
  ConsoleEventPublisher
);
