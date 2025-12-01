import { Effect, Context } from 'effect';
import { NoteManagementPolicy } from '@dykstra/domain';

export interface NoteManagementPolicyRepositoryService {
  readonly findCurrentByFuneralHome: (
    funeralHomeId: string
  ) => Effect.Effect<NoteManagementPolicy, NotFoundError | PersistenceError>;

  readonly getHistory: (
    funeralHomeId: string
  ) => Effect.Effect<NoteManagementPolicy[], PersistenceError>;

  readonly getByVersion: (
    businessKey: string,
    version: number
  ) => Effect.Effect<NoteManagementPolicy, NotFoundError | PersistenceError>;

  readonly save: (policy: NoteManagementPolicy) => Effect.Effect<void, PersistenceError>;

  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

export class NotFoundError extends Error {
  readonly _tag = 'NotFoundError';
  constructor(
    override readonly message: string,
    readonly entityType: string = 'NoteManagementPolicy',
    readonly entityId: string = ''
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class PersistenceError extends Error {
  readonly _tag = 'PersistenceError';
  constructor(
    override readonly message: string,
    override readonly cause?: unknown
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

export const NoteManagementPolicyRepository = Context.GenericTag<NoteManagementPolicyRepositoryService>(
  '@dykstra/NoteManagementPolicyRepository'
);
