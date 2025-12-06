import { Effect, type Context } from 'effect';
import { GoFinancialPort } from '../../ports/go-financial-port';
import { NetworkError } from '../../ports/go-contract-port';
import { ValidationError } from '@dykstra/domain';

/**
 * Create GL Account
 * 
 * Creates a new general ledger account with validation.
 * Validates account number format and uniqueness.
 */
export const createGLAccount = (params: {
  accountNumber: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentAccountId?: string;
  funeralHomeId: string;
}): Effect.Effect<{
  accountId: string;
  accountNumber: string;
  name: string;
  type: string;
  createdAt: Date;
}, ValidationError | NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    // Validation
    if (!params.accountNumber.match(/^\d{4,}$/)) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Account number must be 4+ digits' })
      );
    }
    
    if (params.name.length < 3) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Account name must be at least 3 characters' })
      );
    }
    
    const goFinancial = yield* GoFinancialPort;
    
    // Delegate to Go backend which handles:
    // 1. Account number uniqueness check
    // 2. Parent account validation
    // 3. Account creation
    const account = yield* goFinancial.createGLAccount({
      accountNumber: params.accountNumber,
      name: params.name,
      accountType: params.accountType,
      parentAccountId: params.parentAccountId,
      funeralHomeId: params.funeralHomeId,
    });
    
    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      name: account.name,
      type: account.type,
      createdAt: new Date(),
    };
  });
