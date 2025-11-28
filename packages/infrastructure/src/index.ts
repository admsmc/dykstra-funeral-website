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

// CRM Repositories
export * from './database/prisma-lead-repository';
export * from './database/prisma-contact-repository';
export * from './database/prisma-campaign-repository';
export * from './database/prisma-referral-source-repository';
export * from './database/prisma-interaction-repository';
export * from './database/prisma-family-relationship-repository';
export * from './database/prisma-email-repository';

// CRM Adapters
export * from './adapters/email/sendgrid-marketing-adapter';
export * from './adapters/sms/twilio-sms-adapter';

// Email Sync Adapters (provider-specific, not in main layer)
export * from './adapters/email-sync/microsoft-graph-adapter';
export * from './adapters/email-sync/gmail-adapter';

// CRM Enhancement Adapters
export * from './adapters/validation/google-places-adapter';
export * from './adapters/validation/twilio-phone-adapter';
export * from './adapters/enrichment/clearbit-enrichment-adapter';

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
import { PrismaLeadRepository } from './database/prisma-lead-repository';
import { PrismaContactRepository } from './database/prisma-contact-repository';
import { PrismaCampaignRepository } from './database/prisma-campaign-repository';
import { PrismaReferralSourceRepository } from './database/prisma-referral-source-repository';
import { PrismaInteractionRepository } from './database/prisma-interaction-repository';
import { PrismaFamilyRelationshipRepository } from './database/prisma-family-relationship-repository';
import { PrismaEmailRepository } from './database/prisma-email-repository';
import { SendGridMarketingAdapter } from './adapters/email/sendgrid-marketing-adapter';
import { TwilioSMSAdapter } from './adapters/sms/twilio-sms-adapter';
import { GooglePlacesAdapter } from './adapters/validation/google-places-adapter';
import { TwilioPhoneAdapter } from './adapters/validation/twilio-phone-adapter';
import { ClearbitEnrichmentAdapter } from './adapters/enrichment/clearbit-enrichment-adapter';
import { StorageAdapterLive } from './storage/storage-adapter';
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
  LeadRepository,
  ContactRepository,
  CampaignRepository,
  ReferralSourceRepository,
  InteractionRepository,
  FamilyRelationshipRepository,
  EmailRepository,
  EmailMarketingService,
  SMSService,
  AddressValidation,
  PhoneValidation,
  ContactEnrichment,
} from '@dykstra/application';
import { StripeAdapterLive } from './payment/stripe-adapter';
import { SignatureAdapterLive } from './signature/signature-adapter';
import { EmailAdapterLive } from './email/email-adapter';
import { ConsoleEventPublisherLive } from './events/console-event-publisher';

// Note: Always use local storage for now since S3StorageAdapter
// in adapters/storage/s3-storage-adapter.ts requires AWS credentials
// and throws on initialization. The StorageAdapterLive provides a
// working implementation for development.

/**
 * Complete infrastructure layer
 * Combines all adapters and repositories for dependency injection
 */
/**
 * Infrastructure Layer
 * 
 * SignatureAdapterLive depends on StoragePort, so we provide StorageAdapterLive to it
 * before merging into the main layer.
 */
const SignatureWithStorage = SignatureAdapterLive.pipe(
  Layer.provide(StorageAdapterLive)
);

export const InfrastructureLayer = Layer.mergeAll(
  // Base service adapters
  StorageAdapterLive,
  StripeAdapterLive,
  EmailAdapterLive,
  
  // Signature adapter with its StoragePort dependency provided
  SignatureWithStorage,
  
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
  
  // CRM Repositories
  Layer.succeed(LeadRepository, PrismaLeadRepository),
  Layer.succeed(ContactRepository, PrismaContactRepository),
  Layer.succeed(CampaignRepository, PrismaCampaignRepository),
  Layer.succeed(ReferralSourceRepository, PrismaReferralSourceRepository),
  Layer.succeed(InteractionRepository, PrismaInteractionRepository),
  Layer.succeed(FamilyRelationshipRepository, PrismaFamilyRelationshipRepository),
  Layer.succeed(EmailRepository, PrismaEmailRepository),
  
  // CRM Adapters
  Layer.succeed(EmailMarketingService, SendGridMarketingAdapter),
  Layer.succeed(SMSService, TwilioSMSAdapter),
  
  // CRM Enhancement Adapters
  Layer.succeed(AddressValidation, GooglePlacesAdapter),
  Layer.succeed(PhoneValidation, TwilioPhoneAdapter),
  Layer.succeed(ContactEnrichment, ClearbitEnrichmentAdapter),
  
  // Event publisher
  ConsoleEventPublisherLive,
);
