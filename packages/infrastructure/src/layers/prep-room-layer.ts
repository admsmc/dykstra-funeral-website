/**
 * Preparation Room Dependency Injection Layer
 * 
 * Wires together all components for the prep room feature:
 * - Repository adapter (Prisma)
 * - Use cases (application layer)
 * - All business logic
 * 
 * Usage:
 * ```typescript
 * const effect = reserveRoom(command);
 * const result = await Effect.runPromise(
 *   effect.pipe(Effect.provide(PrepRoomLayer))
 * );
 * ```
 */

import { Layer } from 'effect';
import {
  PrepRoomRepositoryPort,
  type PrepRoomRepositoryService,
} from '@dykstra/application';
import { PrepRoomAdapter } from '../adapters/prep-room/prep-room-adapter';

/**
 * Prep Room Layer
 * 
 * Provides the PrepRoomRepository service to all dependent effects.
 * Uses the Prisma adapter for database operations.
 * 
 * All operations are Effect-based for proper error handling and
 * composability.
 */
export const PrepRoomLayer = Layer.succeed(
  PrepRoomRepositoryPort,
  PrepRoomAdapter
);

/**
 * Minimal Layer - for testing with mock repository
 * 
 * Allows injection of a custom repository implementation
 * for testing or alternative persistence backends.
 */
export const createPrepRoomLayer = (
  repository: PrepRoomRepositoryService
): Layer.Layer<never, never, typeof PrepRoomRepositoryPort> =>
  Layer.succeed(PrepRoomRepositoryPort, repository);

/**
 * Composed Layer - all infrastructure services
 * 
 * For future expansion when multiple services are needed.
 * Example: combining with other features like scheduling, payroll, etc.
 */
export const InfrastructureLayer = PrepRoomLayer;

/**
 * Export for use in root application layer
 */
export { PrepRoomLayer as default };
