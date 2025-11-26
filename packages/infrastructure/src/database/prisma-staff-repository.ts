import { Effect } from 'effect';
import { prisma } from './prisma-client';
import type {
  StaffRepository,
} from '@dykstra/application';

/**
 * Prisma implementation of Staff Repository
 */
export const PrismaStaffRepository: StaffRepository = {
  findAll: () =>
    Effect.tryPromise({
      try: async () => {
        const staff = await prisma.user.findMany({
          where: {
            role: {
              in: ['STAFF', 'DIRECTOR', 'FUNERAL_DIRECTOR', 'ADMIN'],
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
          orderBy: {
            name: 'asc',
          },
        });

        return staff.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }));
      },
      catch: (error) => new Error(`Failed to fetch staff members: ${error}`),
    }).pipe(Effect.orDie),
};
