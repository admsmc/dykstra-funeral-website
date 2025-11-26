// Database
export * from './database/prisma-client';
export * from './database/prisma-case-repository';
export * from './database/prisma-contract-repository';
export * from './database/prisma-payment-repository';
export * from './database/prisma-photo-repository';
export * from './database/prisma-tribute-repository';
export * from './database/prisma-guestbook-repository';
export * from './database/prisma-invitation-repository';
export * from './database/prisma-note-repository';
export * from './database/prisma-task-repository';
export * from './database/prisma-audit-log-repository';
export * from './database/prisma-staff-repository';
export * from './database/prisma-catalog-repositories';
export * from './database/prisma-contract-template-repository';

// Events
export * from './events/console-event-publisher';

// Adapters
export * from './storage/storage-adapter';
export * from './adapters/storage/s3-storage-adapter';
export * from './adapters/payment/stripe-payment-adapter';
export * from './adapters/payment/prisma-payment-plan-adapter';
export * from './adapters/user/prisma-user-adapter';
export * from './adapters/insurance/prisma-insurance-adapter';
export * from './payment/stripe-adapter';
export * from './signature/signature-adapter';
export * from './email/email-adapter';

// Combined infrastructure layer
import { Layer } from 'effect';
import { PrismaCaseRepository } from './database/prisma-case-repository';
import { PrismaContractRepository } from './database/prisma-contract-repository';
import { PrismaPaymentRepository } from './database/prisma-payment-repository';
import { PrismaPhotoRepository } from './database/prisma-photo-repository';
import { PrismaTributeRepository } from './database/prisma-tribute-repository';
import { PrismaGuestbookRepository } from './database/prisma-guestbook-repository';
import { PrismaInvitationRepository } from './database/prisma-invitation-repository';
import { PrismaNoteRepository } from './database/prisma-note-repository';
import { PrismaTaskRepository } from './database/prisma-task-repository';
import { PrismaAuditLogRepository } from './database/prisma-audit-log-repository';
import { PrismaStaffRepository } from './database/prisma-staff-repository';
import { PrismaProductCatalogRepository, PrismaServiceCatalogRepository } from './database/prisma-catalog-repositories';
import { PrismaContractTemplateRepository } from './database/prisma-contract-template-repository';
import { StorageAdapterLive } from './storage/storage-adapter';
import { createS3StorageAdapter } from './adapters/storage/s3-storage-adapter';
import {
  CaseRepository,
  ContractRepository,
  PaymentRepository,
  PhotoRepository,
  TributeRepository,
  GuestbookRepository,
  InvitationRepository,
  NoteRepository,
  TaskRepository,
  AuditLogRepository,
  StaffRepository,
  ProductCatalogRepository,
  ServiceCatalogRepository,
  ContractTemplateRepository,
  StoragePort,
} from '@dykstra/application';
import { StripeAdapterLive } from './payment/stripe-adapter';
import { SignatureAdapterLive } from './signature/signature-adapter';
import { EmailAdapterLive } from './email/email-adapter';
import { ConsoleEventPublisherLive } from './events/console-event-publisher';

/**
 * S3 Storage Layer (production)
 */
export const S3StorageAdapterLive = Layer.succeed(
  StoragePort,
  createS3StorageAdapter()
);

/**
 * Get appropriate storage layer based on environment
 */
const getStorageLayer = () => {
  // Use S3 in production if bucket is configured
  if (process.env['NODE_ENV'] === 'production' && process.env['AWS_S3_BUCKET']) {
    return S3StorageAdapterLive;
  }
  // Fall back to local storage for development
  return StorageAdapterLive;
};

/**
 * Complete infrastructure layer
 * Combines all adapters and repositories for dependency injection
 */
export const InfrastructureLayer = Layer.mergeAll(
  // Repositories
  Layer.succeed(CaseRepository, PrismaCaseRepository),
  Layer.succeed(ContractRepository, PrismaContractRepository),
  Layer.succeed(PaymentRepository, PrismaPaymentRepository),
  Layer.succeed(PhotoRepository, PrismaPhotoRepository),
  Layer.succeed(TributeRepository, PrismaTributeRepository),
  Layer.succeed(GuestbookRepository, PrismaGuestbookRepository),
  Layer.succeed(InvitationRepository, PrismaInvitationRepository),
  Layer.succeed(NoteRepository, PrismaNoteRepository),
  Layer.succeed(TaskRepository, PrismaTaskRepository),
  Layer.succeed(AuditLogRepository, PrismaAuditLogRepository),
  Layer.succeed(StaffRepository, PrismaStaffRepository),
  Layer.succeed(ProductCatalogRepository, PrismaProductCatalogRepository),
  Layer.succeed(ServiceCatalogRepository, PrismaServiceCatalogRepository),
  Layer.succeed(ContractTemplateRepository, PrismaContractTemplateRepository),
  
  // External service adapters
  getStorageLayer(),
  StripeAdapterLive,
  SignatureAdapterLive,
  EmailAdapterLive,
  
  // Event publisher
  ConsoleEventPublisherLive,
);
