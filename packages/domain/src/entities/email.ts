import { Data } from 'effect';

/**
 * Email ID branded type
 */
export type EmailId = string & { readonly _brand: 'EmailId' };

/**
 * Email direction
 */
export type EmailDirection = 'inbound' | 'outbound';

/**
 * Email provider
 */
export type EmailProvider = 'microsoft' | 'google' | 'internal';

/**
 * Email attachment
 */
export interface EmailAttachment {
  readonly id: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly size: number;
  readonly url: string | null;
}

/**
 * Email entity
 * Immutable event log - no SCD2 (emails don't change once sent)
 * Tracks all email communication with contacts/leads/cases
 */
export class Email extends Data.Class<{
  readonly id: EmailId;
  readonly funeralHomeId: string;
  readonly provider: EmailProvider;
  readonly externalId: string | null; // Provider's message ID
  readonly from: string;
  readonly to: readonly string[];
  readonly cc: readonly string[];
  readonly bcc: readonly string[];
  readonly subject: string;
  readonly body: string; // Plain text
  readonly htmlBody: string | null;
  readonly threadId: string | null; // For conversation threading
  readonly inReplyTo: EmailId | null; // Parent email ID
  readonly direction: EmailDirection;
  readonly sentAt: Date | null; // When sent (for outbound)
  readonly receivedAt: Date | null; // When received (for inbound)
  readonly isRead: boolean;
  readonly contactId: string | null; // Matched contact
  readonly leadId: string | null; // Matched lead
  readonly caseId: string | null; // Matched case
  readonly attachments: readonly EmailAttachment[];
  readonly createdAt: Date;
  readonly syncedBy: string | null; // User who triggered sync
}> {
  /**
   * Create a new Email (from sync)
   */
  static create(params: {
    id: string;
    funeralHomeId: string;
    provider: EmailProvider;
    externalId: string | null;
    from: string;
    to: readonly string[];
    cc?: readonly string[];
    bcc?: readonly string[];
    subject: string;
    body: string;
    htmlBody?: string | null;
    threadId?: string | null;
    inReplyTo?: EmailId | null;
    direction: EmailDirection;
    sentAt?: Date | null;
    receivedAt?: Date | null;
    contactId?: string | null;
    leadId?: string | null;
    caseId?: string | null;
    attachments?: readonly EmailAttachment[];
    syncedBy?: string | null;
  }): Email {
    const now = new Date();

    return new Email({
      id: params.id as EmailId,
      funeralHomeId: params.funeralHomeId,
      provider: params.provider,
      externalId: params.externalId,
      from: params.from,
      to: params.to,
      cc: params.cc ?? [],
      bcc: params.bcc ?? [],
      subject: params.subject,
      body: params.body,
      htmlBody: params.htmlBody ?? null,
      threadId: params.threadId ?? null,
      inReplyTo: params.inReplyTo ?? null,
      direction: params.direction,
      sentAt: params.sentAt ?? null,
      receivedAt: params.receivedAt ?? null,
      isRead: params.direction === 'outbound', // Outbound emails are "read"
      contactId: params.contactId ?? null,
      leadId: params.leadId ?? null,
      caseId: params.caseId ?? null,
      attachments: params.attachments ?? [],
      createdAt: now,
      syncedBy: params.syncedBy ?? null,
    });
  }

  /**
   * Mark email as read
   */
  markAsRead(): Email {
    return new Email({
      ...this,
      isRead: true,
    });
  }

  /**
   * Link email to contact
   */
  linkToContact(contactId: string): Email {
    return new Email({
      ...this,
      contactId,
    });
  }

  /**
   * Link email to lead
   */
  linkToLead(leadId: string): Email {
    return new Email({
      ...this,
      leadId,
    });
  }

  /**
   * Link email to case
   */
  linkToCase(caseId: string): Email {
    return new Email({
      ...this,
      caseId,
    });
  }

  /**
   * Check if email is part of a thread
   */
  get isThreaded(): boolean {
    return !!this.threadId || !!this.inReplyTo;
  }

  /**
   * Check if email has attachments
   */
  get hasAttachments(): boolean {
    return this.attachments.length > 0;
  }

  /**
   * Get total attachment size in bytes
   */
  get totalAttachmentSize(): number {
    return this.attachments.reduce((sum, att) => sum + att.size, 0);
  }

  /**
   * Check if email is linked to any entity
   */
  get isLinked(): boolean {
    return !!this.contactId || !!this.leadId || !!this.caseId;
  }

  /**
   * Get primary recipient (first 'to' address)
   */
  get primaryRecipient(): string | null {
    return this.to[0] ?? null;
  }

  /**
   * Get all recipients (to + cc + bcc)
   */
  get allRecipients(): readonly string[] {
    return [...this.to, ...this.cc, ...this.bcc];
  }

  /**
   * Extract email domain
   */
  get fromDomain(): string {
    const match = this.from.match(/@(.+)$/);
    return match?.[1] ?? '';
  }

  /**
   * Check if email is sent
   */
  get isSent(): boolean {
    return this.direction === 'outbound' && !!this.sentAt;
  }

  /**
   * Check if email is received
   */
  get isReceived(): boolean {
    return this.direction === 'inbound' && !!this.receivedAt;
  }
}
