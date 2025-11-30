/**
 * General Ledger Account Number Constants
 * 
 * Standard chart of accounts for funeral home operations.
 * These account numbers match the Go backend's GL configuration.
 * 
 * **Account Numbering Scheme**:
 * - 1xxx: Assets
 * - 2xxx: Liabilities
 * - 3xxx: Equity
 * - 4xxx: Revenue
 * - 5xxx: Expenses
 */

/**
 * Asset account numbers (1xxx)
 */
export const ASSET_ACCOUNTS = {
  /** Cash and Cash Equivalents (1010) */
  CASH: '1010',
  
  /** Accounts Receivable - Trade (1200) */
  ACCOUNTS_RECEIVABLE: '1200',
  
  /** Inventory - Caskets (1300) */
  INVENTORY_CASKETS: '1300',
  
  /** Inventory - Urns (1310) */
  INVENTORY_URNS: '1310',
  
  /** Inventory - Supplies (1320) */
  INVENTORY_SUPPLIES: '1320',
  
  /** Prepaid Expenses (1400) */
  PREPAID_EXPENSES: '1400',
} as const;

/**
 * Liability account numbers (2xxx)
 */
export const LIABILITY_ACCOUNTS = {
  /** Accounts Payable - Trade (2100) */
  ACCOUNTS_PAYABLE: '2100',
  
  /** Accrued Payroll (2200) */
  ACCRUED_PAYROLL: '2200',
  
  /** Payroll Taxes Payable (2210) */
  PAYROLL_TAXES_PAYABLE: '2210',
  
  /** Pre-Need Trust Liability (2300) */
  PRE_NEED_TRUST_LIABILITY: '2300',
} as const;

/**
 * Equity account numbers (3xxx)
 */
export const EQUITY_ACCOUNTS = {
  /** Owner's Equity (3000) */
  OWNERS_EQUITY: '3000',
  
  /** Retained Earnings (3100) */
  RETAINED_EARNINGS: '3100',
} as const;

/**
 * Revenue account numbers (4xxx)
 */
export const REVENUE_ACCOUNTS = {
  /** Revenue - Professional Services (4100) */
  PROFESSIONAL_SERVICES: '4100',
  
  /** Revenue - Merchandise (4200) */
  MERCHANDISE: '4200',
  
  /** Revenue - Facilities & Equipment (4300) */
  FACILITIES: '4300',
  
  /** Revenue - Pre-Need Sales (4400) */
  PRE_NEED_SALES: '4400',
  
  /** Interest Income (4900) */
  INTEREST_INCOME: '4900',
} as const;

/**
 * Expense account numbers (5xxx)
 */
export const EXPENSE_ACCOUNTS = {
  /** Cost of Goods Sold - Merchandise (5100) */
  COGS_MERCHANDISE: '5100',
  
  /** Cost of Goods Sold - Professional Services (5110) */
  COGS_PROFESSIONAL_SERVICES: '5110',
  
  /** Cost of Goods Sold - Facilities (5120) */
  COGS_FACILITIES: '5120',
  
  /** Cost of Goods Sold - Transportation (5130) */
  COGS_TRANSPORTATION: '5130',
  
  /** Payroll Expense (5200) */
  PAYROLL_EXPENSE: '5200',
  
  /** Payroll Tax Expense (5210) */
  PAYROLL_TAX_EXPENSE: '5210',
  
  /** Bank Fees & Charges (5300) */
  BANK_FEES: '5300',
  
  /** Depreciation Expense (5400) */
  DEPRECIATION_EXPENSE: '5400',
  
  /** Rent Expense (5500) */
  RENT_EXPENSE: '5500',
  
  /** Utilities Expense (5510) */
  UTILITIES_EXPENSE: '5510',
  
  /** Insurance Expense (5520) */
  INSURANCE_EXPENSE: '5520',
  
  /** Marketing & Advertising (5600) */
  MARKETING_EXPENSE: '5600',
  
  /** Professional Fees (5700) */
  PROFESSIONAL_FEES: '5700',
} as const;

/**
 * All GL account numbers grouped by type
 */
export const GL_ACCOUNTS = {
  ASSETS: ASSET_ACCOUNTS,
  LIABILITIES: LIABILITY_ACCOUNTS,
  EQUITY: EQUITY_ACCOUNTS,
  REVENUE: REVENUE_ACCOUNTS,
  EXPENSES: EXPENSE_ACCOUNTS,
} as const;

/**
 * Type helper to get all valid GL account numbers
 */
export type GLAccountNumber = 
  | typeof ASSET_ACCOUNTS[keyof typeof ASSET_ACCOUNTS]
  | typeof LIABILITY_ACCOUNTS[keyof typeof LIABILITY_ACCOUNTS]
  | typeof EQUITY_ACCOUNTS[keyof typeof EQUITY_ACCOUNTS]
  | typeof REVENUE_ACCOUNTS[keyof typeof REVENUE_ACCOUNTS]
  | typeof EXPENSE_ACCOUNTS[keyof typeof EXPENSE_ACCOUNTS];

/**
 * Revenue recognition account mapping for case finalization
 * Maps revenue categories to their GL account numbers
 */
export const REVENUE_RECOGNITION_ACCOUNTS = {
  professionalServices: REVENUE_ACCOUNTS.PROFESSIONAL_SERVICES,
  merchandise: REVENUE_ACCOUNTS.MERCHANDISE,
  facilities: REVENUE_ACCOUNTS.FACILITIES,
  accountsReceivable: ASSET_ACCOUNTS.ACCOUNTS_RECEIVABLE,
} as const;

/**
 * Expense recognition account mapping for inventory COGS
 */
export const COGS_ACCOUNTS = {
  merchandise: EXPENSE_ACCOUNTS.COGS_MERCHANDISE,
  professionalServices: EXPENSE_ACCOUNTS.COGS_PROFESSIONAL_SERVICES,
  facilities: EXPENSE_ACCOUNTS.COGS_FACILITIES,
  transportation: EXPENSE_ACCOUNTS.COGS_TRANSPORTATION,
  inventory: ASSET_ACCOUNTS.INVENTORY_CASKETS, // Default inventory account
} as const;

/**
 * Inventory and COGS account grouping for use case convenience
 */
export const INVENTORY_ACCOUNTS = {
  ASSET: ASSET_ACCOUNTS.INVENTORY_CASKETS,
  COGS: {
    MERCHANDISE: EXPENSE_ACCOUNTS.COGS_MERCHANDISE,
    PROFESSIONAL_SERVICES: EXPENSE_ACCOUNTS.COGS_PROFESSIONAL_SERVICES,
    FACILITIES: EXPENSE_ACCOUNTS.COGS_FACILITIES,
    TRANSPORTATION: EXPENSE_ACCOUNTS.COGS_TRANSPORTATION,
  },
} as const;

/**
 * Payroll expense account grouping for payroll use cases
 */
export const PAYROLL_EXPENSE_ACCOUNTS = {
  /** Wages Expense account (5200) */
  WAGES_EXPENSE: EXPENSE_ACCOUNTS.PAYROLL_EXPENSE,
  
  /** Cash account for payroll payment (1010) */
  CASH: ASSET_ACCOUNTS.CASH,
  
  /** Payroll Liabilities - Accrued Payroll (2200) */
  PAYROLL_LIABILITIES: LIABILITY_ACCOUNTS.ACCRUED_PAYROLL,
} as const;
