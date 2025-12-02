import { type Effect, Context } from 'effect';

/**
 * Signature validation error
 */
export class SignatureError extends Error {
  readonly _tag = 'SignatureError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * Signature data for ESIGN Act compliance
 */
export interface SignatureData {
  readonly contractId: string;
  readonly signerId: string;
  readonly signerName: string;
  readonly signerEmail: string;
  readonly signatureData: string;       // Base64 encoded image
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly consentText: string;
  readonly timestamp: Date;
}

/**
 * Signature result
 */
export interface SignatureResult {
  readonly signatureId: string;
  readonly signatureUrl: string;
}

/**
 * Signature Port
 * Abstraction for e-signature operations (ESIGN Act compliant)
 */
export interface SignaturePort {
  /**
   * Create and store a signature
   * Returns URL to stored signature image
   */
  readonly createSignature: (
    data: SignatureData
  ) => Effect.Effect<SignatureResult, SignatureError>;
  
  /**
   * Verify a signature
   * Checks if signature exists and timestamp is valid
   */
  readonly verifySignature: (
    signatureId: string
  ) => Effect.Effect<boolean, SignatureError>;
  
  /**
   * Get signature details
   * For audit/legal purposes
   */
  readonly getSignature: (
    signatureId: string
  ) => Effect.Effect<SignatureData, SignatureError>;
}

/**
 * Signature Port service tag for dependency injection
 */
export const SignaturePort = Context.GenericTag<SignaturePort>('@dykstra/SignaturePort');
