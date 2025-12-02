import { type Effect, Context } from 'effect';
import { type NoteManagementPolicy, type NotFoundError } from '@dykstra/domain';
import { type PersistenceError } from '../errors';

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

export const NoteManagementPolicyRepository = Context.GenericTag<NoteManagementPolicyRepositoryService>(
  '@dykstra/NoteManagementPolicyRepository'
);
