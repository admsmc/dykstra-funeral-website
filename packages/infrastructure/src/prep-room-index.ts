/**
 * Preparation Room Feature - Public API
 * 
 * Exports all prep-room related components for use in:
 * - tRPC routers
 * - API endpoints
 * - Server-side business logic
 * - Testing utilities
 * 
 * Does NOT export internal implementation details like Prisma models.
 */

/**
 * Domain Exports
 * (from @dykstra/domain)
 */
export type {
  PrepRoom,
  PrepRoomReservation,
  PrepRoomId,
  ReservationId,
  PrepRoomStatus,
  ReservationStatus,
  ReservationPriority,
  PrepRoomCapacity,
} from '@dykstra/domain';

export {
  createPrepRoomId,
  createReservationId,
  createPrepRoom,
  createPrepRoomReservation,
  confirmReservation,
  checkInReservation,
  checkOutReservation,
  autoReleaseReservation,
  cancelReservation,
  hasAutoReleaseTimeout,
  hasTimeOverlap,
  getDurationWithBuffer,
  isValidDuration,
  isTerminalStatus,
} from '@dykstra/domain';

/**
 * Application Layer Exports
 * (from @dykstra/application)
 */
export type {
  ReserveRoomCommand,
  ReserveRoomResult,
  ConflictResult,
  ReserveRoomResponse,
  CheckAvailabilityQuery,
  CheckAvailabilityResult,
  CheckInCommand,
  CheckInResult,
  CheckOutCommand,
  CheckOutResult,
  AutoReleaseResult,
  ListScheduleQuery,
  ListScheduleResult,
  OverrideConflictCommand,
  OverrideConflictResult,
} from '@dykstra/application';

export {
  reserveRoom,
  checkAvailability,
  checkIn,
  checkOut,
  autoReleaseReservations,
  listSchedule,
  overrideConflict,
  PrepRoomRepositoryPort,
} from '@dykstra/application';

export type {
  PrepRoomRepositoryService,
  AvailableSlot,
  ConflictInfo,
  FindAvailableSlotsQuery,
  RoomUtilization,
} from '@dykstra/application';

export {
  PrepRoomRepositoryError,
  PrepRoomNotFoundError,
  ReservationNotFoundError,
} from '@dykstra/application';

/**
 * Infrastructure Layer Exports
 * (from this package)
 */
export { PrepRoomAdapter } from './adapters/prep-room/prep-room-adapter';
export { prepRoomRouter } from './routers/prep-room-router';
export type { PrepRoomRouter } from './routers/prep-room-router';

export type {
  ReserveRoomInput,
  CheckAvailabilityInput,
  CheckInInput,
  CheckOutInput,
  ListScheduleInput,
  OverrideConflictInput,
} from './routers/prep-room-router';

export { PrepRoomLayer, createPrepRoomLayer } from './layers/prep-room-layer';
