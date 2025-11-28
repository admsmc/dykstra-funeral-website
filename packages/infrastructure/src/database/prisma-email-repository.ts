import { Effect } from 'effect';
import { Email, type EmailId, type EmailAttachment } from '@dykstra/domain';
import { 
  type EmailRepositoryService, 
  NotFoundError, 
  PersistenceError 
} from '@dykstra/application';
import { prisma } from './prisma-client';
import type { EmailProvider as PrismaEmailProvider, EmailDirection as PrismaEmailDirection } from '@prisma/client';

/**
 * Map Prisma Email to Domain Email
 */
const toDomain = (prismaEmail: any): Email => {
  return Email.create({
    id: prismaEmail.id,
    funeralHomeId: prismaEmail.funeralHomeId,
    provider: prismaEmail.provider.toLowerCase() as 'microsoft' | 'google' | 'internal',
    externalId: prismaEmail.externalId,
    from: prismaEmail.from,
    to: prismaEmail.to || [],
    cc: prismaEmail.cc || [],
    bcc: prismaEmail.bcc || [],
    subject: prismaEmail.subject,
    body: prismaEmail.body,
    htmlBody: prismaEmail.htmlBody,
    threadId: prismaEmail.threadId,
    inReplyTo: prismaEmail.inReplyTo as EmailId | null,
    direction: prismaEmail.direction.toLowerCase() as 'inbound' | 'outbound',
    sentAt: prismaEmail.sentAt,
    receivedAt: prismaEmail.receivedAt,
    contactId: prismaEmail.contactId,
    leadId: prismaEmail.leadId,
    caseId: prismaEmail.caseId,
    attachments: Array.isArray(prismaEmail.attachments) 
      ? prismaEmail.attachments as EmailAttachment[]
      : [],
    syncedBy: prismaEmail.syncedBy,
  });
};

/**
 * Map Domain Email to Prisma data
 */
const toPrisma = (email: Email) => {
  return {
    id: email.id,
    funeralHomeId: email.funeralHomeId,
    provider: email.provider.toUpperCase() as PrismaEmailProvider,
    externalId: email.externalId,
    from: email.from,
    to: [...email.to],
    cc: [...email.cc],
    bcc: [...email.bcc],
    subject: email.subject,
    body: email.body,
    htmlBody: email.htmlBody,
    threadId: email.threadId,
    inReplyTo: email.inReplyTo,
    direction: email.direction.toUpperCase() as PrismaEmailDirection,
    sentAt: email.sentAt,
    receivedAt: email.receivedAt,
    isRead: email.isRead,
    contactId: email.contactId,
    leadId: email.leadId,
    caseId: email.caseId,
    attachments: JSON.parse(JSON.stringify(email.attachments)), // Serialize to JSON
    createdAt: email.createdAt,
    syncedBy: email.syncedBy,
  };
};

/**
 * Prisma implementation of EmailRepository (object-based)
 */
export const PrismaEmailRepository: EmailRepositoryService = {
  save: (email: Email) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.email.create({
          data: toPrisma(email),
        });
      },
      catch: (error) => new PersistenceError('Failed to save email', error),
    }),

  findById: (id: EmailId) =>
    Effect.tryPromise({
      try: async () => {
        const email = await prisma.email.findUnique({
          where: { id },
        });
        
        if (!email) {
          throw new NotFoundError({
            message: `Email with ID ${id} not found`,
            entityType: 'Email',
            entityId: id,
          });
        }
        
        return toDomain(email);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find email', error);
      },
    }),

  findByContact: (contactId: string, options = {}) =>
    Effect.tryPromise({
      try: async () => {
        const emails = await prisma.email.findMany({
          where: { contactId },
          orderBy: [
            { sentAt: 'desc' },
            { receivedAt: 'desc' },
          ],
          take: options.limit || 50,
          skip: options.offset || 0,
        });
        
        return emails.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find emails by contact', error),
    }),

  findByLead: (leadId: string, options = {}) =>
    Effect.tryPromise({
      try: async () => {
        const emails = await prisma.email.findMany({
          where: { leadId },
          orderBy: [
            { sentAt: 'desc' },
            { receivedAt: 'desc' },
          ],
          take: options.limit || 50,
          skip: options.offset || 0,
        });
        
        return emails.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find emails by lead', error),
    }),

  findByCase: (caseId: string, options = {}) =>
    Effect.tryPromise({
      try: async () => {
        const emails = await prisma.email.findMany({
          where: { caseId },
          orderBy: [
            { sentAt: 'desc' },
            { receivedAt: 'desc' },
          ],
          take: options.limit || 50,
          skip: options.offset || 0,
        });
        
        return emails.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find emails by case', error),
    }),

  findByThread: (threadId: string) =>
    Effect.tryPromise({
      try: async () => {
        const emails = await prisma.email.findMany({
          where: { threadId },
          orderBy: { createdAt: 'asc' },
        });
        
        return emails.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find emails by thread', error),
    }),

  search: (funeralHomeId: string, filters) =>
    Effect.tryPromise({
      try: async () => {
        const where: any = { funeralHomeId };
        
        // Add filters
        if (filters.query) {
          where.OR = [
            { subject: { contains: filters.query, mode: 'insensitive' } },
            { body: { contains: filters.query, mode: 'insensitive' } },
            { from: { contains: filters.query, mode: 'insensitive' } },
          ];
        }
        
        if (filters.from) {
          where.from = { contains: filters.from, mode: 'insensitive' };
        }
        
        if (filters.to) {
          where.to = { has: filters.to };
        }
        
        if (filters.hasAttachments !== undefined) {
          where.attachments = filters.hasAttachments 
            ? { not: { equals: [] } }
            : { equals: [] };
        }
        
        if (filters.isRead !== undefined) {
          where.isRead = filters.isRead;
        }
        
        if (filters.startDate) {
          where.createdAt = { ...where.createdAt, gte: filters.startDate };
        }
        
        if (filters.endDate) {
          where.createdAt = { ...where.createdAt, lte: filters.endDate };
        }
        
        const emails = await prisma.email.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 100,
          skip: filters.offset || 0,
        });
        
        return emails.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to search emails', error),
    }),

  existsByExternalId: (externalId: string, provider: string) =>
    Effect.tryPromise({
      try: async () => {
        const count = await prisma.email.count({
          where: {
            externalId,
            provider: provider.toUpperCase() as PrismaEmailProvider,
          },
        });
        
        return count > 0;
      },
      catch: (error) => new PersistenceError('Failed to check email existence', error),
    }),

  updateLinks: (emailId: EmailId, links) =>
    Effect.tryPromise({
      try: async () => {
        const updated = await prisma.email.update({
          where: { id: emailId },
          data: {
            contactId: links.contactId !== undefined ? links.contactId : undefined,
            leadId: links.leadId !== undefined ? links.leadId : undefined,
            caseId: links.caseId !== undefined ? links.caseId : undefined,
          },
        });
        
        return toDomain(updated);
      },
      catch: (error) => {
        if ((error as any).code === 'P2025') {
          return new NotFoundError({
            message: `Email with ID ${emailId} not found`,
            entityType: 'Email',
            entityId: emailId,
          });
        }
        return new PersistenceError('Failed to update email links', error);
      },
    }),

  markAsRead: (emailId: EmailId) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.email.update({
          where: { id: emailId },
          data: { isRead: true },
        });
      },
      catch: (error) => {
        if ((error as any).code === 'P2025') {
          return new NotFoundError({
            message: `Email with ID ${emailId} not found`,
            entityType: 'Email',
            entityId: emailId,
          });
        }
        return new PersistenceError('Failed to mark email as read', error);
      },
    }),
};
