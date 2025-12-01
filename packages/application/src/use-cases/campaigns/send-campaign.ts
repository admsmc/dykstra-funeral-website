import { Effect } from 'effect';
import { Campaign, InvalidStateTransitionError } from '@dykstra/domain';
import { CampaignRepository, type CampaignRepositoryService, NotFoundError, PersistenceError } from '../../ports/campaign-repository';
import { ContactRepository, type ContactRepositoryService } from '../../ports/contact-repository';
import { EmailMarketingService, type EmailMarketingServicePort, EmailError } from '../../ports/email-marketing-port';
import { SMSService, type SMSServicePort, SMSError } from '../../ports/sms-port';

/**
 * Send Campaign
 *
 * Policy Type: Type A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface SendCampaignCommand {
  readonly campaignBusinessKey: string;
}

/**
 * Send campaign to target audience
 * Transitions campaign through sending states and records metrics
 */
export const sendCampaign = (
  command: SendCampaignCommand
): Effect.Effect<
  Campaign,
  NotFoundError | InvalidStateTransitionError | EmailError | SMSError | PersistenceError,
  CampaignRepositoryService | ContactRepositoryService | EmailMarketingServicePort | SMSServicePort
> =>
  Effect.gen(function* () {
    const campaignRepo = yield* CampaignRepository;
    const contactRepo = yield* ContactRepository;
    const emailService = yield* EmailMarketingService;
    const smsService = yield* SMSService;
    
    const campaign = yield* campaignRepo.findByBusinessKey(command.campaignBusinessKey);
    
    if (!campaign) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Campaign not found',
          entityType: 'Campaign',
          entityId: command.campaignBusinessKey,
        })
      );
    }
    
    // Transition to sending
    const sendingCampaign = yield* campaign.transitionStatus('sending');
    yield* campaignRepo.update(sendingCampaign);
    
    // Get target contacts based on segment tags
    const contacts = yield* contactRepo.findByFuneralHome(
      campaign.funeralHomeId,
      {
        tags: campaign.segmentTags,
        canEmail: campaign.type === 'email' || campaign.type === 'mixed',
        canSMS: campaign.type === 'sms' || campaign.type === 'mixed',
      }
    );
    
    let successCount = 0;
    
    // Send via appropriate channel(s)
    if (campaign.type === 'email' || campaign.type === 'mixed') {
      const emailRecipients = contacts.map(c => c.email).filter((e): e is string => !!e);
      
      if (emailRecipients.length > 0) {
        const emailResult = yield* emailService.sendBulkEmail({
          recipients: emailRecipients,
          subject: campaign.subject || '',
          htmlBody: campaign.content || '',
        });
        successCount += emailResult.successCount;
      }
    }
    
    if (campaign.type === 'sms' || campaign.type === 'mixed') {
      const smsRecipients = contacts.map(c => c.phone).filter((p): p is string => !!p);
      
      if (smsRecipients.length > 0) {
        const smsResult = yield* smsService.sendBulkSMS({
          recipients: smsRecipients,
          body: campaign.content || '',
        });
        successCount += smsResult.successCount;
      }
    }
    
    // Record sent metrics
    const sentCampaign = sendingCampaign.recordSent(successCount);
    
    // Transition to sent
    const completedCampaign = yield* sentCampaign.transitionStatus('sent');
    yield* campaignRepo.update(completedCampaign);
    
    return completedCampaign;
  });
