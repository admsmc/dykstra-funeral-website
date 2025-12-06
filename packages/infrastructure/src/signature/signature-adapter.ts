import { Effect, Layer } from 'effect';
import { SignaturePort, type SignaturePortService, StoragePort, type SignatureData, type SignatureResult, SignatureError } from '@dykstra/application';
import { prisma } from '../database/prisma-client';
import { randomBytes } from 'crypto';

/**
 * Signature adapter implementation
 * Stores signature images via StoragePort and metadata in database
 */
const SignatureAdapterImpl = Effect.gen(function* (_) {
  const storage = yield* _(StoragePort);
  
  return {
    createSignature: (data: SignatureData) =>
      Effect.gen(function* (_) {
        // Validate signature data format (base64)
        if (!isValidBase64(data.signatureData)) {
          return yield* _(Effect.fail(
            new SignatureError('Invalid signature data format')
          ));
        }
        
        // Generate unique signature ID
        const signatureId = `sig_${randomBytes(16).toString('hex')}`;
        
        // Convert base64 to buffer
        const buffer = Buffer.from(data.signatureData, 'base64');
        
        // Upload signature image to storage
        const uploadResult = yield* _(
          storage.upload({
            data: buffer,
            name: `${signatureId}.png`,
            folder: 'signatures',
            mimeType: 'image/png',
          }).pipe(
            Effect.mapError((storageError) => 
              new SignatureError('Failed to upload signature image', storageError)
            )
          )
        );
        
        // Store signature metadata in database
        yield* _(Effect.tryPromise({
          try: () => prisma.signature.create({
            data: {
              id: signatureId,
              businessKey: signatureId,
              version: 1,
              validFrom: data.timestamp,
              validTo: null,
              isCurrent: true,
              contractId: data.contractId,
              signerId: data.signerId,
              signerName: data.signerName,
              signerEmail: data.signerEmail,
              signedAt: data.timestamp,
              ipAddress: data.ipAddress,
              userAgent: data.userAgent,
              signatureData: uploadResult.url,
              consentText: data.consentText,
              consentAccepted: true,
            },
          }),
          catch: (error) => new SignatureError('Failed to store signature', error),
        }));
        
        return {
          signatureId,
          signatureUrl: uploadResult.url,
        } as SignatureResult;
      }),
    
    verifySignature: (signatureId: string) =>
      Effect.tryPromise({
        try: async () => {
          const signature = await prisma.signature.findUnique({
            where: { id: signatureId },
          });
          
          if (!signature) {
            return false;
          }
          
          // Verify signature is not too old (e.g., within 7 years for legal retention)
          const sevenYearsAgo = new Date();
          sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
          
          return signature.signedAt > sevenYearsAgo;
        },
        catch: (error) => new SignatureError('Failed to verify signature', error),
      }),
    
    getSignature: (signatureId: string) =>
      Effect.tryPromise({
        try: async () => {
          const signature = await prisma.signature.findUnique({
            where: { id: signatureId },
          });
          
          if (!signature) {
            throw new SignatureError(`Signature ${signatureId} not found`);
          }
          
          return {
            contractId: signature.contractId,
            signerId: signature.signerId,
            signerName: signature.signerName,
            signerEmail: signature.signerEmail,
            signatureData: signature.signatureData,
            ipAddress: signature.ipAddress,
            userAgent: signature.userAgent,
            consentText: signature.consentText,
            timestamp: signature.signedAt,
          } as SignatureData;
        },
        catch: (error) => {
          if (error instanceof SignatureError) {
            return error;
          }
          return new SignatureError('Failed to get signature', error);
        },
      }),
  } satisfies SignaturePortService;
});

/**
 * Validate base64 string
 */
function isValidBase64(str: string): boolean {
  try {
    const decoded = Buffer.from(str, 'base64').toString('base64');
    return decoded === str;
  } catch {
    return false;
  }
}

/**
 * Effect Layer to provide SignaturePort
 */
export const SignatureAdapterLive = Layer.effect(
  SignaturePort,
  SignatureAdapterImpl
);
