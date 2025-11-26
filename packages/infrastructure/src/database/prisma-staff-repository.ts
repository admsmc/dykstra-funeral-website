import { Effect } from 'effect';
import { PrismaClient } from '@prisma/client';
import {
  StaffRepository,
  StaffMember,
} from '@dykstra/application/use-cases/staff/list-staff-members';

export class PrismaStaffRepository implements StaffRepository {
  constructor(private prisma: PrismaClient) {}

  findAll(): Effect.Effect<StaffMember[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const staff = await this.prisma.user.findMany({
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

        return staff.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }));
      },
      catch: (error) => new Error(`Failed to fetch staff members: ${error}`),
    }).pipe(Effect.orDie);
  }
}
