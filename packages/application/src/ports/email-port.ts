import { type Effect, Context } from 'effect';

/**
 * Email sending error
 */
export class EmailError extends Error {
  readonly _tag = 'EmailError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * Email Port
 * Abstraction for email sending (SendGrid, Postmark, etc.)
 */
export interface EmailPort {
  /**
   * Send invitation email to family member
   */
  readonly sendInvitation: (
    to: string,
    inviteLink: string,
    funeralHomeName: string,
    decedentName: string
  ) => Effect.Effect<void, EmailError>;
  
  /**
   * Send contract ready notification
   */
  readonly sendContractReady: (
    to: string,
    contractLink: string,
    caseDetails: {
      decedentName: string;
      funeralHomeName: string;
    }
  ) => Effect.Effect<void, EmailError>;
  
  /**
   * Send payment receipt
   */
  readonly sendPaymentReceipt: (
    to: string,
    receiptUrl: string,
    amount: number,
    caseDetails: {
      decedentName: string;
      funeralHomeName: string;
    }
  ) => Effect.Effect<void, EmailError>;
  
  /**
   * Send contract signed notification
   */
  readonly sendContractSigned: (
    to: string,
    caseDetails: {
      decedentName: string;
      funeralHomeName: string;
    }
  ) => Effect.Effect<void, EmailError>;
}

/**
 * Email Port service tag for dependency injection
 */
export const EmailPort = Context.GenericTag<EmailPort>('@dykstra/EmailPort');
