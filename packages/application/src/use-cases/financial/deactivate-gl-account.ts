import { Effect, type Context } from 'effect';
import { GoFinancialPort, type NotFoundError } from '../../ports/go-financial-port';
import { NetworkError } from '../../ports/go-contract-port';
import { ValidationError } from '@dykstra/domain';

/**
 * Deactivate GL Account
 * 
 * Deactivates (soft deletes) a GL account.
 * Validates account exists and has zero balance before deactivating.
 */
export const deactivateGLAccount = (params: {
  accountId: string;
  reason: string;
}): Effect.Effect<{
  accountId: string;
  deactivatedAt: Date;
  reason: string;
}, NotFoundError | ValidationError | NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    // Validation
    if (params.reason.length < 1 || params.reason.length > 500) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Reason must be between 1-500 characters' })
      );
    }
    
    const goFinancial = yield* GoFinancialPort;
    
    // Delegate to Go backend which handles:
    // 1. Account existence check
    // 2. Zero balance validation
    // 3. Account deactivation
    yield* goFinancial.deactivateGLAccount(
      params.accountId,
      params.reason
    );
    
    return {
      accountId: params.accountId,
      deactivatedAt: new Date(),
      reason: params.reason,
    };
  });
