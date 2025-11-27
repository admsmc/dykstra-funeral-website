import { Effect, Layer } from 'effect';
import { EmailPort, EmailError } from '@dykstra/application';

/**
 * Console Email Adapter (Development)
 * Logs emails to console instead of sending
 */
const ConsoleEmailAdapter: EmailPort = {
  sendInvitation: (to, inviteLink, funeralHomeName, decedentName) =>
    Effect.tryPromise({
      try: async () => {
        console.log('[Email] Sending invitation:', {
          to,
          subject: `Invitation from ${funeralHomeName}`,
          body: `You've been invited to collaborate on arrangements for ${decedentName}.\nClick here: ${inviteLink}`,
        });
      },
      catch: (error) => new EmailError('Failed to send invitation', error),
    }),
  
  sendContractReady: (to, contractLink, caseDetails) =>
    Effect.tryPromise({
      try: async () => {
        console.log('[Email] Sending contract ready:', {
          to,
          subject: `Contract ready for review - ${caseDetails.decedentName}`,
          body: `The contract for ${caseDetails.decedentName} is ready for your review.\nView contract: ${contractLink}`,
        });
      },
      catch: (error) => new EmailError('Failed to send contract ready email', error),
    }),
  
  sendPaymentReceipt: (to, receiptUrl, amount, caseDetails) =>
    Effect.tryPromise({
      try: async () => {
        console.log('[Email] Sending payment receipt:', {
          to,
          subject: `Payment receipt - ${caseDetails.decedentName}`,
          body: `Thank you for your payment of $${amount.toFixed(2)} for ${caseDetails.decedentName}.\nReceipt: ${receiptUrl}`,
        });
      },
      catch: (error) => new EmailError('Failed to send payment receipt', error),
    }),
  
  sendContractSigned: (to, caseDetails) =>
    Effect.tryPromise({
      try: async () => {
        console.log('[Email] Sending contract signed:', {
          to,
          subject: `Contract signed - ${caseDetails.decedentName}`,
          body: `The contract for ${caseDetails.decedentName} has been fully signed.`,
        });
      },
      catch: (error) => new EmailError('Failed to send contract signed email', error),
    }),
};

/**
 * SendGrid Email Adapter (Production)
 * 
 * To implement:
 * 1. npm install @sendgrid/mail
 * 2. Set SENDGRID_API_KEY env var
 * 3. Create email templates in SendGrid
 * 4. Uncomment implementation below
 */
const SendGridEmailAdapter: EmailPort = {
  sendInvitation: (to, _inviteLink, _funeralHomeName, _decedentName) =>
    Effect.tryPromise({
      try: async () => {
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(process.env['SENDGRID_API_KEY']!);
        // 
        // await sgMail.send({
        //   to,
        //   from: process.env.FROM_EMAIL!,
        //   templateId: 'd-invitation-template-id',
        //   dynamicTemplateData: {
        //     inviteLink,
        //     funeralHomeName,
        //     decedentName,
        //   },
        // });
        
        console.log('[SendGrid] Would send invitation to:', to);
      },
      catch: (error) => new EmailError('Failed to send invitation', error),
    }),
  
  sendContractReady: (to, _contractLink, _caseDetails) =>
    Effect.tryPromise({
      try: async () => {
        console.log('[SendGrid] Would send contract ready to:', to);
      },
      catch: (error) => new EmailError('Failed to send contract ready email', error),
    }),
  
  sendPaymentReceipt: (to, _receiptUrl, _amount, _caseDetails) =>
    Effect.tryPromise({
      try: async () => {
        console.log('[SendGrid] Would send payment receipt to:', to);
      },
      catch: (error) => new EmailError('Failed to send payment receipt', error),
    }),
  
  sendContractSigned: (to, _caseDetails) =>
    Effect.tryPromise({
      try: async () => {
        console.log('[SendGrid] Would send contract signed to:', to);
      },
      catch: (error) => new EmailError('Failed to send contract signed email', error),
    }),
};

/**
 * Get the appropriate email adapter based on environment
 */
const getEmailAdapter = (): EmailPort => {
  const env = process.env['NODE_ENV'] || 'development';
  
  if (env === 'production' && process.env['SENDGRID_API_KEY']) {
    return SendGridEmailAdapter;
  }
  
  return ConsoleEmailAdapter;
};

/**
 * Effect Layer to provide EmailPort
 */
export const EmailAdapterLive = Layer.sync(
  EmailPort,
  () => getEmailAdapter()
);
