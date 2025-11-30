import { Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NotFoundError, NetworkError };

/**
 * Go Financial domain types
 * Combines General Ledger, Accounts Receivable, and Accounts Payable
 */

// General Ledger Types
export interface GoGLAccount {
  readonly id: string;
  readonly accountNumber: string;
  readonly name: string;
  readonly type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  readonly subtype: string;
  readonly normalBalance: 'debit' | 'credit';
  readonly isActive: boolean;
  readonly parentAccountId?: string;
  readonly balance: number;
}

export interface GoJournalEntry {
  readonly id: string;
  readonly entryNumber: string;
  readonly entryDate: Date;
  readonly description: string;
  readonly status: 'draft' | 'posted' | 'reversed';
  readonly lines: readonly GoJournalEntryLine[];
  readonly totalDebit: number;
  readonly totalCredit: number;
  readonly postedAt?: Date;
  readonly postedBy?: string;
  readonly reversedAt?: Date;
  readonly reversalEntryId?: string;
}

export interface GoJournalEntryLine {
  readonly id: string;
  readonly accountId: string;
  readonly accountNumber: string;
  readonly accountName: string;
  readonly debit: number;
  readonly credit: number;
  readonly description?: string;
}

export interface GoFinancialStatement {
  readonly type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  readonly asOfDate: Date;
  readonly sections: readonly GoFinancialSection[];
  readonly totalAssets?: number;
  readonly totalLiabilities?: number;
  readonly totalEquity?: number;
  readonly netIncome?: number;
}

export interface GoFinancialSection {
  readonly name: string;
  readonly accounts: readonly GoFinancialLineItem[];
  readonly subtotal: number;
}

export interface GoFinancialLineItem {
  readonly accountNumber: string;
  readonly accountName: string;
  readonly amount: number;
}

// Accounts Receivable Types
export interface GoInvoice {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly caseId: string;
  readonly contractId: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly invoiceDate: Date;
  readonly dueDate: Date;
  readonly status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  readonly lineItems: readonly GoInvoiceLineItem[];
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly amountPaid: number;
  readonly amountDue: number;
  readonly createdAt: Date;
}

export interface GoInvoiceLineItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly glAccountId: string;
}

export interface GoPayment {
  readonly id: string;
  readonly paymentNumber: string;
  readonly invoiceId: string;
  readonly customerId: string;
  readonly paymentDate: Date;
  readonly paymentMethod: 'cash' | 'check' | 'credit_card' | 'ach' | 'wire';
  readonly amount: number;
  readonly referenceNumber?: string;
  readonly status: 'pending' | 'cleared' | 'failed' | 'reversed';
  readonly postedToGL: boolean;
  readonly createdAt: Date;
}

export interface GoARAgingBucket {
  readonly category: 'current' | '1-30' | '31-60' | '61-90' | '90+';
  readonly invoiceCount: number;
  readonly totalAmount: number;
}

export interface GoARAgingReport {
  readonly asOfDate: Date;
  readonly customers: readonly GoCustomerAging[];
  readonly buckets: readonly GoARAgingBucket[];
  readonly totalOutstanding: number;
}

export interface GoCustomerAging {
  readonly customerId: string;
  readonly customerName: string;
  readonly current: number;
  readonly days1to30: number;
  readonly days31to60: number;
  readonly days61to90: number;
  readonly days90Plus: number;
  readonly totalOutstanding: number;
}

// Accounts Payable Types
export interface GoVendorBill {
  readonly id: string;
  readonly billNumber: string;
  readonly vendorId: string;
  readonly vendorName: string;
  readonly billDate: Date;
  readonly dueDate: Date;
  readonly status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'paid' | 'cancelled';
  readonly lineItems: readonly GoBillLineItem[];
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly amountPaid: number;
  readonly amountDue: number;
  readonly purchaseOrderId?: string;
  readonly ocrExtracted: boolean;
  readonly createdAt: Date;
}

export interface GoBillLineItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly glAccountId: string;
  readonly matchedToPO: boolean;
}

export interface GoVendorPayment {
  readonly id: string;
  readonly paymentNumber: string;
  readonly vendorId: string;
  readonly vendorName: string;
  readonly paymentDate: Date;
  readonly paymentMethod: 'check' | 'ach' | 'wire';
  readonly amount: number;
  readonly billIds: readonly string[];
  readonly status: 'draft' | 'scheduled' | 'sent' | 'cleared' | 'failed';
  readonly nachaFileId?: string;
  readonly checkNumber?: string;
  readonly createdAt: Date;
}

export interface GoTrialBalance {
  readonly asOfDate: Date;
  readonly accounts: readonly GoTrialBalanceAccount[];
  readonly totalDebits: number;
  readonly totalCredits: number;
  readonly balanced: boolean;
}

export interface GoTrialBalanceAccount {
  readonly accountNumber: string;
  readonly accountName: string;
  readonly debitBalance: number;
  readonly creditBalance: number;
}

export interface GoAccountBalance {
  readonly accountId: string;
  readonly accountNumber: string;
  readonly accountName: string;
  readonly balance: number;
  readonly asOfDate: Date;
}

export interface GoAPPaymentRun {
  readonly id: string;
  readonly runNumber: string;
  readonly runDate: Date;
  readonly status: 'draft' | 'approved' | 'processing' | 'completed' | 'failed';
  readonly billIds: readonly string[];
  readonly totalAmount: number;
  readonly paymentMethod: 'check' | 'ach' | 'wire';
  readonly nachaFileId?: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly approvedBy?: string;
  readonly approvedAt?: Date;
}

export interface GoAPPaymentRunExecution {
  readonly paymentRunId: string;
  readonly status: string;
  readonly executed: number;
  readonly glJournalId?: string;
  readonly executedAt: Date;
}

// Commands
export interface CreateJournalEntryCommand {
  readonly entryDate: Date;
  readonly description: string;
  readonly lines: readonly Omit<GoJournalEntryLine, 'id' | 'accountNumber' | 'accountName'>[];
}

export interface CreateInvoiceCommand {
  readonly caseId: string;
  readonly contractId: string;
  readonly customerId: string;
  readonly invoiceDate: Date;
  readonly dueDate: Date;
  readonly lineItems: readonly Omit<GoInvoiceLineItem, 'id'>[];
}

export interface RecordPaymentCommand {
  readonly invoiceId: string;
  readonly paymentDate: Date;
  readonly paymentMethod: GoPayment['paymentMethod'];
  readonly amount: number;
  readonly referenceNumber?: string;
}

export interface CreateVendorBillCommand {
  readonly vendorId: string;
  readonly billDate: Date;
  readonly dueDate: Date;
  readonly billNumber?: string;
  readonly lineItems: readonly Omit<GoBillLineItem, 'id' | 'matchedToPO'>[];
  readonly purchaseOrderId?: string;
}

export interface PayVendorBillsCommand {
  readonly vendorId: string;
  readonly billIds: readonly string[];
  readonly paymentDate: Date;
  readonly paymentMethod: GoVendorPayment['paymentMethod'];
}

export interface CreateAPPaymentRunCommand {
  readonly runDate: Date;
  readonly billIds: readonly string[];
  readonly paymentMethod: 'check' | 'ach' | 'wire';
  readonly createdBy: string;
  readonly tenant?: string;
  readonly legalEntity?: string;
  readonly currency?: string;
}

/**
 * Go Financial Port
 * 
 * Unified interface for General Ledger, Accounts Receivable, and Accounts Payable.
 * Integrates with TigerBeetle for double-entry accounting and event sourcing.
 * 
 * Features:
 * - Chart of accounts management
 * - Journal entry posting
 * - Financial statement generation
 * - AR invoicing and payment tracking
 * - AR aging reports
 * - AP vendor bill management
 * - AP OCR invoice scanning
 * - AP 3-way match (PO, receipt, invoice)
 * - ACH payment generation (NACHA)
 * 
 * Backend: Go ERP with EventStoreDB and TigerBeetle
 */
export interface GoFinancialPortService {
  // General Ledger Operations
  
  /**
   * Get chart of accounts
   */
  readonly getChartOfAccounts: () => 
    Effect.Effect<readonly GoGLAccount[], NetworkError>;
  
  /**
   * Get GL account by ID
   */
  readonly getGLAccount: (
    id: string
  ) => Effect.Effect<GoGLAccount, NotFoundError | NetworkError>;
  
  /**
   * Get GL account by account number
   */
  readonly getGLAccountByNumber: (
    accountNumber: string
  ) => Effect.Effect<GoGLAccount, NotFoundError | NetworkError>;
  
  /**
   * Create journal entry
   * 
   * Backend operation:
   * 1. Validates debits = credits
   * 2. Creates journal entry
   * 3. Emits JournalEntryCreated event
   * 4. Status: draft (not yet posted)
   */
  readonly createJournalEntry: (
    command: CreateJournalEntryCommand
  ) => Effect.Effect<GoJournalEntry, NetworkError>;
  
  /**
   * Post journal entry to GL
   * 
   * Backend operation:
   * 1. Validates entry is in draft status
   * 2. Posts to TigerBeetle ledger
   * 3. Updates account balances
   * 4. Emits JournalEntryPosted event
   */
  readonly postJournalEntry: (
    id: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Reverse journal entry
   */
  readonly reverseJournalEntry: (
    id: string,
    reversalDate: Date,
    reason: string
  ) => Effect.Effect<GoJournalEntry, NetworkError>;
  
  /**
   * Get journal entries with filters
   */
  readonly listJournalEntries: (
    filters?: {
      startDate?: Date;
      endDate?: Date;
      accountId?: string;
      status?: GoJournalEntry['status'];
    }
  ) => Effect.Effect<readonly GoJournalEntry[], NetworkError>;
  
  /**
   * Generate financial statements
   * 
   * Backend operation:
   * 1. Queries TigerBeetle account balances
   * 2. Applies period filters
   * 3. Generates P&L, Balance Sheet, or Cash Flow
   */
  readonly generateFinancialStatement: (
    type: GoFinancialStatement['type'],
    asOfDate: Date
  ) => Effect.Effect<GoFinancialStatement, NetworkError>;
  
  /**
   * Get trial balance report
   * 
   * Backend operation:
   * 1. Queries all GL accounts
   * 2. Calculates debit and credit totals
   * 3. Validates debits = credits
   */
  readonly getTrialBalance: (
    asOfDate: Date
  ) => Effect.Effect<GoTrialBalance, NetworkError>;
  
  /**
   * Generate balance sheet
   * Convenience method that calls generateFinancialStatement with type='balance_sheet'
   */
  readonly generateBalanceSheet: (
    asOfDate: Date
  ) => Effect.Effect<GoFinancialStatement, NetworkError>;
  
  /**
   * Generate cash flow statement
   * Convenience method that calls generateFinancialStatement with type='cash_flow'
   */
  readonly generateCashFlowStatement: (
    startDate: Date,
    endDate: Date
  ) => Effect.Effect<GoFinancialStatement, NetworkError>;
  
  /**
   * Get account balances (batch lookup)
   * 
   * Backend operation:
   * 1. Queries multiple account balances in single request
   * 2. Returns current balances as of date
   */
  readonly getAccountBalances: (
    accountIds: readonly string[],
    asOfDate?: Date
  ) => Effect.Effect<readonly GoAccountBalance[], NetworkError>;
  
  // Accounts Receivable Operations
  
  /**
   * Create invoice from contract
   * 
   * Backend operation:
   * 1. Fetches contract line items
   * 2. Creates invoice
   * 3. Emits InvoiceCreated event
   * 4. Posts AR debit to TigerBeetle
   */
  readonly createInvoice: (
    command: CreateInvoiceCommand
  ) => Effect.Effect<GoInvoice, NetworkError>;
  
  /**
   * Get invoice by ID
   */
  readonly getInvoice: (
    id: string
  ) => Effect.Effect<GoInvoice, NotFoundError | NetworkError>;
  
  /**
   * List invoices with filters
   */
  readonly listInvoices: (
    filters?: {
      caseId?: string;
      customerId?: string;
      status?: GoInvoice['status'];
      startDate?: Date;
      endDate?: Date;
    }
  ) => Effect.Effect<readonly GoInvoice[], NetworkError>;
  
  /**
   * Record payment against invoice
   * 
   * Backend operation:
   * 1. Validates invoice exists and is unpaid
   * 2. Records payment
   * 3. Emits PaymentReceived event
   * 4. Posts cash debit / AR credit to TigerBeetle
   * 5. Updates invoice status (partial/paid)
   */
  readonly recordPayment: (
    command: RecordPaymentCommand
  ) => Effect.Effect<GoPayment, NetworkError>;
  
  /**
   * Get AR aging report
   * 
   * Backend operation:
   * 1. Queries all unpaid invoices
   * 2. Calculates days outstanding
   * 3. Groups into aging buckets
   */
  readonly getARAgingReport: (
    asOfDate: Date
  ) => Effect.Effect<GoARAgingReport, NetworkError>;
  
  /**
   * Get customer payment history
   */
  readonly getCustomerPayments: (
    customerId: string,
    startDate?: Date,
    endDate?: Date
  ) => Effect.Effect<readonly GoPayment[], NetworkError>;
  
  // Accounts Payable Operations
  
  /**
   * Create vendor bill
   * 
   * Backend operation:
   * 1. Creates bill
   * 2. Optionally matches to PO (3-way match)
   * 3. Emits VendorBillCreated event
   * 4. Status: pending_approval
   */
  readonly createVendorBill: (
    command: CreateVendorBillCommand
  ) => Effect.Effect<GoVendorBill, NetworkError>;
  
  /**
   * Upload and OCR scan vendor bill
   * 
   * Backend operation:
   * 1. Uploads PDF/image to storage
   * 2. Extracts data via Azure Form Recognizer
   * 3. Creates draft bill with extracted data
   * 4. Returns for staff review/correction
   */
  readonly uploadAndScanBill: (
    vendorId: string,
    fileUrl: string
  ) => Effect.Effect<GoVendorBill, NetworkError>;
  
  /**
   * Get vendor bill by ID
   */
  readonly getVendorBill: (
    id: string
  ) => Effect.Effect<GoVendorBill, NotFoundError | NetworkError>;
  
  /**
   * List vendor bills with filters
   */
  readonly listVendorBills: (
    filters?: {
      vendorId?: string;
      status?: GoVendorBill['status'];
      startDate?: Date;
      endDate?: Date;
    }
  ) => Effect.Effect<readonly GoVendorBill[], NetworkError>;
  
  /**
   * Approve vendor bill
   * 
   * Backend operation:
   * 1. Validates bill is pending approval
   * 2. Records approval
   * 3. Emits VendorBillApproved event
   * 4. Posts AP credit to TigerBeetle
   */
  readonly approveVendorBill: (
    id: string,
    approvedBy: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Pay vendor bills (batch)
   * 
   * Backend operation:
   * 1. Validates all bills are approved
   * 2. Creates vendor payment
   * 3. Generates NACHA file (ACH) or check
   * 4. Emits VendorPaymentCreated event
   * 5. Posts cash credit / AP debit to TigerBeetle
   */
  readonly payVendorBills: (
    command: PayVendorBillsCommand
  ) => Effect.Effect<GoVendorPayment, NetworkError>;
  
  /**
   * Get vendor payment history
   */
  readonly getVendorPayments: (
    vendorId: string,
    startDate?: Date,
    endDate?: Date
  ) => Effect.Effect<readonly GoVendorPayment[], NetworkError>;
  
  /**
   * Get 3-way match status for bill
   * Returns matching status against PO and receipt
   */
  readonly getThreeWayMatchStatus: (
    billId: string
  ) => Effect.Effect<GoThreeWayMatchStatus, NetworkError>;
  
  /**
   * Create AP payment run (batch)
   * 
   * Backend operation:
   * 1. Creates payment run aggregate
   * 2. Validates all bills are approved
   * 3. Generates payment instructions
   * 4. Status: draft (ready for approval)
   */
  readonly createAPPaymentRun: (
    command: CreateAPPaymentRunCommand
  ) => Effect.Effect<GoAPPaymentRun, NetworkError>;
  
  /**
   * Get AP payment run by ID
   * Returns payment run with list of bills to be paid
   */
  readonly getAPPaymentRun: (
    id: string
  ) => Effect.Effect<GoAPPaymentRun, NotFoundError | NetworkError>;
  
  /**
   * Approve AP payment run
   * 
   * Backend operation:
   * 1. Validates payment run is in draft/submitted status
   * 2. Records approval
   * 3. Emits PaymentRunApproved event
   * 4. Status: approved (ready for execution)
   */
  readonly approveAPPaymentRun: (
    id: string,
    approvedBy?: string
  ) => Effect.Effect<GoAPPaymentRun, NetworkError>;
  
  /**
   * Execute AP payment run
   * 
   * Backend operation:
   * 1. Validates payment run is approved
   * 2. Marks all bills as paid
   * 3. Posts GL entries (DR: AP, CR: Cash)
   * 4. Generates payment file (ACH/wire/check)
   * 5. Emits PaymentRunExecuted event
   * 6. Status: completed
   */
  readonly executeAPPaymentRun: (
    params: {
      id: string;
      bankId?: string;
    }
  ) => Effect.Effect<GoAPPaymentRunExecution, NetworkError>;
}

export interface GoThreeWayMatchStatus {
  readonly billId: string;
  readonly purchaseOrderId?: string;
  readonly receiptId?: string;
  readonly poMatched: boolean;
  readonly receiptMatched: boolean;
  readonly fullyMatched: boolean;
  readonly variances: readonly GoMatchVariance[];
}

export interface GoMatchVariance {
  readonly type: 'quantity' | 'price' | 'item';
  readonly description: string;
  readonly expected: string;
  readonly actual: string;
}

/**
 * Go Financial Port service tag for dependency injection
 */
export const GoFinancialPort = Context.GenericTag<GoFinancialPortService>(
  '@dykstra/GoFinancialPort'
);
