import { Effect } from 'effect';
import { CalendarEvent, type CalendarProvider, type Attendee, type Reminder, type RecurrenceRule } from '@dykstra/domain';
import { 
  type CalendarEventRepositoryService, 
  PersistenceError 
} from '@dykstra/application';
import { prisma } from './prisma-client';
import type { CalendarProvider as PrismaCalendarProvider } from '@prisma/client';

/**
 * Map Prisma CalendarEvent to Domain CalendarEvent
 */
const toDomain = (prismaEvent: any): Effect.Effect<CalendarEvent, Error> => {
  // Parse JSON fields
  const attendees: Attendee[] = Array.isArray(prismaEvent.attendees) 
    ? prismaEvent.attendees 
    : [];
  
  const reminders: Reminder[] = Array.isArray(prismaEvent.reminders) 
    ? prismaEvent.reminders 
    : [];

  const recurrenceRule: RecurrenceRule | null = prismaEvent.recurrenceRule
    ? JSON.parse(prismaEvent.recurrenceRule)
    : null;

  return CalendarEvent.create({
    id: prismaEvent.id,
    funeralHomeId: prismaEvent.funeralHomeId,
    interactionId: prismaEvent.interactionId,
    provider: prismaEvent.provider.toLowerCase() as CalendarProvider,
    externalId: prismaEvent.externalId,
    title: prismaEvent.title,
    description: prismaEvent.description,
    startTime: prismaEvent.startTime,
    endTime: prismaEvent.endTime,
    location: prismaEvent.location,
    attendees,
    reminders,
    recurrenceRule,
    createdBy: prismaEvent.createdBy,
  });
};

/**
 * Map Domain CalendarEvent to Prisma data
 */
const toPrisma = (event: CalendarEvent) => {
  return {
    id: event.id,
    funeralHomeId: event.funeralHomeId,
    interactionId: event.interactionId,
    provider: event.provider.toUpperCase() as PrismaCalendarProvider,
    externalId: event.externalId,
    title: event.title,
    description: event.description,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    attendees: JSON.parse(JSON.stringify(event.attendees)), // Serialize to JSON
    reminders: JSON.parse(JSON.stringify(event.reminders)),
    recurrenceRule: event.recurrenceRule 
      ? JSON.stringify(event.recurrenceRule)
      : null,
    isCancelled: event.isCancelled,
    createdBy: event.createdBy,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};

/**
 * Prisma implementation of CalendarEventRepository (object-based)
 */
export const PrismaCalendarEventRepository: CalendarEventRepositoryService = {
  save: (event: CalendarEvent) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.calendarEvent.upsert({
          where: { id: event.id },
          create: toPrisma(event),
          update: toPrisma(event),
        });
        return event;
      },
      catch: (error) => new PersistenceError('Failed to save calendar event', error),
    }),

  findById: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const event = await prisma.calendarEvent.findUnique({
          where: { id },
        });
        
        if (!event) {
          return null;
        }
        
        return Effect.runSync(toDomain(event));
      },
      catch: (error) => new PersistenceError('Failed to find calendar event', error),
    }),

  findByInteraction: (interactionId: string) =>
    Effect.tryPromise({
      try: async () => {
        const event = await prisma.calendarEvent.findUnique({
          where: { interactionId },
        });
        
        if (!event) {
          return null;
        }
        
        return Effect.runSync(toDomain(event));
      },
      catch: (error) => new PersistenceError('Failed to find calendar event by interaction', error),
    }),

  findByDateRange: (params) =>
    Effect.tryPromise({
      try: async () => {
        const where: any = {
          funeralHomeId: params.funeralHomeId,
          startTime: {
            gte: params.startDate,
            lte: params.endDate,
          },
        };

        if (params.userId) {
          where.createdBy = params.userId;
        }

        if (!params.includesCancelled) {
          where.isCancelled = false;
        }

        const events = await prisma.calendarEvent.findMany({
          where,
          orderBy: { startTime: 'asc' },
        });

        const domainEvents = events.map(e => Effect.runSync(toDomain(e)));
        return domainEvents;
      },
      catch: (error) => new PersistenceError('Failed to find calendar events by date range', error),
    }),

  existsByExternalId: (params) =>
    Effect.tryPromise({
      try: async () => {
        const count = await prisma.calendarEvent.count({
          where: {
            provider: params.provider.toUpperCase() as PrismaCalendarProvider,
            externalId: params.externalId,
          },
        });
        
        return count > 0;
      },
      catch: (error) => new PersistenceError('Failed to check calendar event existence', error),
    }),

  findByExternalId: (params) =>
    Effect.tryPromise({
      try: async () => {
        const event = await prisma.calendarEvent.findUnique({
          where: {
            provider_externalId: {
              provider: params.provider.toUpperCase() as PrismaCalendarProvider,
              externalId: params.externalId,
            },
          },
        });
        
        if (!event) {
          return null;
        }
        
        return Effect.runSync(toDomain(event));
      },
      catch: (error) => new PersistenceError('Failed to find calendar event by external ID', error),
    }),

  delete: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        // Soft delete by marking as cancelled
        await prisma.calendarEvent.update({
          where: { id },
          data: { 
            isCancelled: true,
            updatedAt: new Date(),
          },
        });
      },
      catch: (error) => new PersistenceError('Failed to delete calendar event', error),
    }),

  hardDelete: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.calendarEvent.delete({
          where: { id },
        });
      },
      catch: (error) => new PersistenceError('Failed to hard delete calendar event', error),
    }),

  findUpcoming: (params) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const events = await prisma.calendarEvent.findMany({
          where: {
            funeralHomeId: params.funeralHomeId,
            createdBy: params.userId,
            startTime: { gte: now },
            isCancelled: false,
          },
          orderBy: { startTime: 'asc' },
          take: params.limit || 10,
        });

        const domainEvents = events.map(e => Effect.runSync(toDomain(e)));
        return domainEvents;
      },
      catch: (error) => new PersistenceError('Failed to find upcoming calendar events', error),
    }),

  findByAttendee: (params) =>
    Effect.tryPromise({
      try: async () => {
        // Note: Prisma doesn't natively support JSON queries, so we fetch all
        // events and filter in memory. For production, consider using raw SQL
        // or PostgreSQL's JSON operators.
        const where: any = {
          funeralHomeId: params.funeralHomeId,
          isCancelled: false,
        };

        if (params.startDate && params.endDate) {
          where.startTime = {
            gte: params.startDate,
            lte: params.endDate,
          };
        }

        const events = await prisma.calendarEvent.findMany({
          where,
          orderBy: { startTime: 'asc' },
        });

        // Filter by attendee email in memory
        const filteredEvents = events.filter(event => {
          const attendees = Array.isArray(event.attendees) 
            ? event.attendees as any[]
            : [];
          return attendees.some((a: any) => 
            a.email.toLowerCase() === params.attendeeEmail.toLowerCase()
          );
        });

        const domainEvents = filteredEvents.map(e => Effect.runSync(toDomain(e)));
        return domainEvents;
      },
      catch: (error) => new PersistenceError('Failed to find calendar events by attendee', error),
    }),
};
