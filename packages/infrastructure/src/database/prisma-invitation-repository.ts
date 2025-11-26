import { Effect } from 'effect';
import { prisma } from './prisma-client';
import type {
  InvitationRepository,
  InvitationWithRelations,
  InvitationStatus,
  InvitationNotFoundError,
  InvitationConflictError,
} from '@dykstra/application';

/**
 * Prisma implementation of Invitation Repository
 * Handles SCD2 (Slowly Changing Dimension Type 2) pattern
 */
export const PrismaInvitationRepository: InvitationRepository = {
  findByBusinessKey: (businessKey: string): Effect.Effect<InvitationWithRelations, InvitationNotFoundError> =>
    Effect.tryPromise({
      try: async () => {
        const invitation = await prisma.familyInvitation.findFirst({
          where: {
            businessKey,
            isCurrent: true,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            case: {
              select: {
                id: true,
                decedentName: true,
                funeralHome: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (!invitation) {
          throw new Error(`Invitation not found: ${businessKey}`);
        }

        return invitation as unknown as InvitationWithRelations;
      },
      catch: (error) => {
        const err = error as Error;
        return {
          _tag: 'InvitationNotFoundError' as const,
          businessKey,
          message: err.message,
          name: 'InvitationNotFoundError',
        };
      },
    }),

  findByCase: (caseId: string, status?: InvitationStatus) =>
    Effect.tryPromise({
      try: async () => {
        const invitations = await prisma.familyInvitation.findMany({
          where: {
            caseId,
            isCurrent: true,
            ...(status ? { status } : {}),
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            case: {
              select: {
                id: true,
                decedentName: true,
                funeralHome: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return invitations as unknown as InvitationWithRelations[];
      },
      catch: (error) => {
        throw new Error(`Failed to fetch invitations: ${error}`);
      },
    }).pipe(Effect.orDie),

  findHistory: (businessKey: string): Effect.Effect<InvitationWithRelations[], InvitationNotFoundError> =>
    Effect.tryPromise({
      try: async () => {
        const versions = await prisma.familyInvitation.findMany({
          where: {
            businessKey,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            version: 'desc',
          },
        });

        if (versions.length === 0) {
          throw new Error(`Invitation not found: ${businessKey}`);
        }

        return versions as unknown as InvitationWithRelations[];
      },
      catch: (error) => {
        const err = error as Error;
        return {
          _tag: 'InvitationNotFoundError' as const,
          businessKey,
          message: err.message,
          name: 'InvitationNotFoundError',
        };
      },
    }),

  hasActiveInvitation: (caseId: string, email: string) =>
    Effect.tryPromise({
      try: async () => {
        const existing = await prisma.familyInvitation.findFirst({
          where: {
            caseId,
            email,
            isCurrent: true,
            status: { in: ['PENDING', 'ACCEPTED'] },
          },
        });
        return !!existing;
      },
      catch: (error) => {
        throw new Error(`Failed to check invitation: ${error}`);
      },
    }).pipe(Effect.orDie),

  create: (invitation): Effect.Effect<InvitationWithRelations, InvitationConflictError> =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();

        const created = await prisma.familyInvitation.create({
          data: {
            businessKey: invitation.businessKey,
            version: 1,
            caseId: invitation.caseId,
            email: invitation.email,
            name: invitation.name,
            phone: invitation.phone,
            relationship: invitation.relationship,
            role: invitation.role,
            permissions: invitation.permissions as any,
            status: invitation.status,
            token: invitation.token,
            expiresAt: invitation.expiresAt,
            revokedAt: invitation.revokedAt,
            sentBy: invitation.sentBy,
            isCurrent: true,
            validFrom: now,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            case: {
              select: {
                id: true,
                decedentName: true,
                funeralHome: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        return created as unknown as InvitationWithRelations;
      },
      catch: (error) => {
        const err = error as Error;
        return {
          _tag: 'InvitationConflictError' as const,
          message: err.message || 'Failed to create invitation',
          name: 'InvitationConflictError',
        };
      },
    }),

  createNewVersion: (businessKey, updates): Effect.Effect<InvitationWithRelations, InvitationNotFoundError> =>
    Effect.tryPromise({
      try: async () => {
        return await prisma.$transaction(async (tx: any) => {
          // Find current version
          const current = await tx.familyInvitation.findFirst({
            where: {
              businessKey,
              isCurrent: true,
            },
          });

          if (!current) {
            throw new Error(`Invitation not found: ${businessKey}`);
          }

          const now = new Date();

          // Close current version
          await tx.familyInvitation.update({
            where: { id: current.id },
            data: {
              isCurrent: false,
              validTo: now,
            },
          });

          // Create new version
          const newVersion = await tx.familyInvitation.create({
            data: {
              businessKey: current.businessKey,
              version: current.version + 1,
              caseId: current.caseId,
              email: current.email,
              name: current.name,
              phone: current.phone,
              relationship: current.relationship,
              role: current.role,
              permissions: current.permissions,
              status: updates.status || current.status,
              token: updates.token || current.token,
              expiresAt: updates.expiresAt || current.expiresAt,
              revokedAt: updates.revokedAt || current.revokedAt,
              sentBy: updates.sentBy || current.sentBy,
              createdAt: current.createdAt, // Preserve original creation time
              isCurrent: true,
              validFrom: now,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              case: {
                select: {
                  id: true,
                  decedentName: true,
                  funeralHome: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          });

          return newVersion as unknown as InvitationWithRelations;
        });
      },
      catch: (error) => {
        const err = error as Error;
        return {
          _tag: 'InvitationNotFoundError' as const,
          businessKey,
          message: err.message,
          name: 'InvitationNotFoundError',
        };
      },
    }),
};
