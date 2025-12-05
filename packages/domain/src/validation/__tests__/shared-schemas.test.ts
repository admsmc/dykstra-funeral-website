import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  optionalEmailSchema,
  phoneSchema,
  optionalPhoneSchema,
  nameSchema,
  decedentNameSchema,
  currencySchema,
  optionalCurrencySchema,
  largeCurrencySchema,
  shortTextSchema,
  longTextSchema,
  dateSchema,
  pastDateSchema,
  futureDateSchema,
  uuidSchema,
  businessKeySchema,
  createRequiredSelectSchema,
} from '../shared-schemas';

describe('Email Validation', () => {
  it('validates correct email addresses', () => {
    expect(emailSchema.parse('test@example.com')).toBe('test@example.com');
    expect(emailSchema.parse('user+tag@domain.co.uk')).toBe('user+tag@domain.co.uk');
  });

  it('rejects invalid email addresses', () => {
    expect(() => emailSchema.parse('')).toThrow('Email is required');
    expect(() => emailSchema.parse('invalid')).toThrow('Please enter a valid email address');
    expect(() => emailSchema.parse('missing@domain')).toThrow();
  });

  it('enforces max length', () => {
    const longEmail = 'a'.repeat(250) + '@test.com'; // >255 chars
    expect(() => emailSchema.parse(longEmail)).toThrow('Email must be less than 255 characters');
  });

  it('allows optional emails', () => {
    expect(optionalEmailSchema.parse('')).toBe('');
    expect(optionalEmailSchema.parse(undefined)).toBeUndefined();
    expect(optionalEmailSchema.parse('test@example.com')).toBe('test@example.com');
  });
});

describe('Phone Number Validation', () => {
  it('validates correct US phone formats', () => {
    expect(phoneSchema.parse('(555) 123-4567')).toBe('(555) 123-4567');
    expect(phoneSchema.parse('555-123-4567')).toBe('555-123-4567');
    expect(phoneSchema.parse('555.123.4567')).toBe('555.123.4567');
    expect(phoneSchema.parse('5551234567')).toBe('5551234567');
  });

  it('rejects invalid phone formats', () => {
    expect(() => phoneSchema.parse('')).toThrow('Phone number is required');
    expect(() => phoneSchema.parse('123')).toThrow('Phone must be in format (555) 123-4567');
    expect(() => phoneSchema.parse('invalid')).toThrow();
  });

  it('allows optional phones', () => {
    expect(optionalPhoneSchema.parse('')).toBe('');
    expect(optionalPhoneSchema.parse(undefined)).toBeUndefined();
    expect(optionalPhoneSchema.parse('555-123-4567')).toBe('555-123-4567');
  });
});

describe('Name Validation', () => {
  it('validates correct names', () => {
    expect(nameSchema.parse('John Doe')).toBe('John Doe');
    expect(nameSchema.parse("O'Brien")).toBe("O'Brien");
    expect(nameSchema.parse('Mary-Jane')).toBe('Mary-Jane');
  });

  it('rejects invalid names', () => {
    expect(() => nameSchema.parse('')).toThrow('Name is required');
    expect(() => nameSchema.parse('A')).toThrow('Name must be at least 2 characters');
    expect(() => nameSchema.parse('John123')).toThrow('Name can only contain letters');
  });

  it('enforces max length', () => {
    const longName = 'A'.repeat(101);
    expect(() => nameSchema.parse(longName)).toThrow('Name must be less than 100 characters');
  });

  it('validates decedent names with flexibility', () => {
    expect(decedentNameSchema.parse('  John Doe  ')).toBe('John Doe'); // trims whitespace
    const longDecedentName = 'A'.repeat(150);
    expect(decedentNameSchema.parse(longDecedentName)).toHaveLength(150);
  });
});

describe('Currency Validation', () => {
  it('validates correct currency amounts', () => {
    expect(currencySchema.parse(100.50)).toBe(100.50);
    expect(currencySchema.parse(0.01)).toBe(0.01);
    expect(currencySchema.parse(999999.99)).toBe(999999.99);
  });

  it('rejects invalid currency amounts', () => {
    expect(() => currencySchema.parse(0)).toThrow('Amount must be greater than zero');
    expect(() => currencySchema.parse(-10)).toThrow('Amount must be greater than zero');
    expect(() => currencySchema.parse(1000000)).toThrow('Amount cannot exceed $999,999.99');
  });

  it('validates decimal precision', () => {
    expect(() => currencySchema.parse(100.123)).toThrow('Amount must be a valid currency amount');
    expect(currencySchema.parse(100.12)).toBe(100.12);
  });

  it('allows optional currency', () => {
    expect(optionalCurrencySchema.parse(undefined)).toBeUndefined();
    expect(optionalCurrencySchema.parse(100.50)).toBe(100.50);
  });

  it('validates large currency amounts', () => {
    expect(largeCurrencySchema.parse(5000000.00)).toBe(5000000.00);
    expect(() => largeCurrencySchema.parse(10000000)).toThrow('Amount cannot exceed $9,999,999.99');
  });
});

describe('Text Field Validation', () => {
  it('validates short text fields', () => {
    expect(shortTextSchema.parse('Hello')).toBe('Hello');
    expect(shortTextSchema.parse('  Trimmed  ')).toBe('Trimmed');
  });

  it('enforces short text max length', () => {
    const longText = 'A'.repeat(256);
    expect(() => shortTextSchema.parse(longText)).toThrow('Must be less than 255 characters');
  });

  it('validates long text fields', () => {
    const longMessage = 'A'.repeat(2000);
    expect(longTextSchema.parse(longMessage)).toHaveLength(2000);
  });

  it('rejects too long text', () => {
    const tooLong = 'A'.repeat(2001);
    expect(() => longTextSchema.parse(tooLong)).toThrow('Must be less than 2000 characters');
  });
});

describe('Date Validation', () => {
  it('validates dates', () => {
    const today = new Date();
    expect(dateSchema.parse(today)).toEqual(today);
  });

  it('validates past dates', () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(pastDateSchema.parse(yesterday)).toEqual(yesterday);
  });

  it('rejects future dates for past date schema', () => {
    const tomorrow = new Date(Date.now() + 86400000);
    expect(() => pastDateSchema.parse(tomorrow)).toThrow('Date must be in the past');
  });

  it('validates future dates', () => {
    const tomorrow = new Date(Date.now() + 86400000);
    expect(futureDateSchema.parse(tomorrow)).toEqual(tomorrow);
  });

  it('rejects past dates for future date schema', () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(() => futureDateSchema.parse(yesterday)).toThrow('Date must be in the future');
  });
});

describe('ID Validation', () => {
  it('validates UUID format', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    expect(uuidSchema.parse(validUUID)).toBe(validUUID);
  });

  it('rejects invalid UUID', () => {
    expect(() => uuidSchema.parse('invalid-uuid')).toThrow('Invalid ID format');
  });

  it('validates business keys', () => {
    expect(businessKeySchema.parse('case-123-abc')).toBe('case-123-abc');
    expect(businessKeySchema.parse('PAYMENT2024')).toBe('PAYMENT2024');
  });

  it('rejects invalid business keys', () => {
    expect(() => businessKeySchema.parse('')).toThrow('ID is required');
    expect(() => businessKeySchema.parse('invalid_key')).toThrow('Invalid ID format');
  });
});

describe('Helper Functions', () => {
  it('creates required select schemas', () => {
    const statusSchema = createRequiredSelectSchema(['active', 'inactive'], 'Choose status');
    expect(statusSchema.parse('active')).toBe('active');
    expect(() => statusSchema.parse('invalid')).toThrow('Choose status');
  });
});
