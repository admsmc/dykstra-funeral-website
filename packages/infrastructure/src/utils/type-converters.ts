import { Prisma } from '@prisma/client';
import { Option } from 'effect';

// Alias to Prisma's Decimal type/class
export type Decimal = Prisma.Decimal;

/**
 * Type Converters for Prisma <-> Domain Type Bridging
 * 
 * These utilities handle the impedance mismatch between:
 * - Prisma's Decimal type and domain's number type
 * - Effect's Option<T> and Prisma's T | null
 */

/**
 * Convert Prisma Decimal to number
 * Used for monetary values and other decimal fields
 */
export const decimalToNumber = (d: Decimal): number => d.toNumber();

/**
 * Convert number to Prisma Decimal
 * Used when creating/updating Prisma records
 */
export const numberToDecimal = (n: number): Decimal => new Prisma.Decimal(n);

/**
 * Convert Effect Option to nullable value
 * Used when passing domain types to Prisma
 */
export const optionToNullable = <T>(opt: Option.Option<T>): T | null =>
  Option.getOrNull(opt);

/**
 * Convert nullable value to Effect Option
 * Used when converting Prisma types to domain
 */
export const nullableToOption = <T>(val: T | null | undefined): Option.Option<T> =>
  val === null || val === undefined ? Option.none() : Option.some(val);
