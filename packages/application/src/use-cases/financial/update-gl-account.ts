import { Effect, type Context } from 'effect';
import { GoFinancialPort, type NotFoundError } from '../../ports/go-financial-port';
import { NetworkError } from '../../ports/go-contract-port';
import { ValidationError } from '@dykstra/domain';

/**
 * Update GL Account
 * 
 * Updates an existing GL account's details.
 * Validates account exists before updating.
 */
export const updateGLAccount = (params: {
  accountId: string;
  name?: string;
  accountType?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentAccountId?: string | null;
}): Effect.Effect<{
  accountId: string;
  accountNumber: string;
  name: string;
  type: string;
  updatedAt: Date;
}, NotFoundError | ValidationError | NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    // Validation
    if (params.name && params.name.length < 3) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Account name must be at least 3 characters' })
      );
    }
    
    const goFinancial = yield* GoFinancialPort;
    
    // Delegate to Go backend which handles:
    // 1. Account existence check
    // 2. Parent account validation (if changing)
    // 3. Account update
    const account = yield* goFinancial.updateGLAccount(
      params.accountId,
      {
        name: params.name,
        accountType: params.accountType,
        parentAccountId: params.parentAccountId,
      }
    );
    
    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      name: account.name,
      type: account.type,
      updatedAt: new Date(),
    };
  });
