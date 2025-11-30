import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoFinancialPortService,
  GoGLAccount,
  GoJournalEntry,
  GoFinancialStatement,
  GoInvoice,
  GoPayment,
  GoARAgingReport,
  GoVendorBill,
  GoVendorPayment,
  GoThreeWayMatchStatus,
  // GoAPPaymentRun, // TODO: Uncomment when AP Payment Run endpoints are implemented
  CreateJournalEntryCommand,
  CreateInvoiceCommand,
  RecordPaymentCommand,
  CreateVendorBillCommand,
  PayVendorBillsCommand,
  CreateAPPaymentRunCommand,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Go Financial Adapter
 * 
 * Unified GL, AR, and AP with TigerBeetle integration.
 * Handles double-entry accounting, invoicing, and AP automation.
 */
export const GoFinancialAdapter: GoFinancialPortService = {
  // General Ledger Operations
  getChartOfAccounts: () =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/chart-of-accounts', {});
        
        if (res.error) {
          throw new Error(res.error.message);
        }
        
        return (res.data.accounts || []).map(mapToGoGLAccount);
      },
      catch: (error) => new NetworkError('Failed to get chart of accounts', error as Error)
    }),
  
  getGLAccount: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/gl-accounts/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'GLAccount not found', entityType: 'GLAccount', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoGLAccount(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get GL account', error as Error);
      }
    }),
  
  getGLAccountByNumber: (accountNumber: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/gl-accounts/by-number/{accountNumber}', {
          params: { path: { accountNumber } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'GLAccount not found', entityType: 'GLAccount', entityId: accountNumber });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoGLAccount(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get GL account by number', error as Error);
      }
    }),
  
  createJournalEntry: (command: CreateJournalEntryCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/financial/journal-entries', {
          body: {
            entry_date: command.entryDate.toISOString(),
            description: command.description,
            lines: command.lines.map(line => ({
              account_id: line.accountId,
              debit: line.debit,
              credit: line.credit,
              description: line.description,
            })),
          }
        });
        
        return mapToGoJournalEntry(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create journal entry', error as Error)
    }),
  
  postJournalEntry: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/financial/journal-entries/{id}/post', {
          params: { path: { id } }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to post journal entry', error as Error)
    }),
  
  reverseJournalEntry: (id: string, reversalDate: Date, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/financial/journal-entries/{id}/reverse', {
          params: { path: { id } },
          body: {
            reversal_date: reversalDate.toISOString(),
            reason,
          }
        });
        
        return mapToGoJournalEntry(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to reverse journal entry', error as Error)
    }),
  
  listJournalEntries: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/journal-entries', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.entries || []).map(mapToGoJournalEntry);
      },
      catch: (error) => new NetworkError('Failed to list journal entries', error as Error)
    }),
  
  generateFinancialStatement: (type, asOfDate) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/statements/{type}', {
          params: {
            path: { type },
            query: { as_of_date: asOfDate.toISOString() }
          }
        });
        
        const data = unwrapResponse(res);
        return mapToGoFinancialStatement(data);
      },
      catch: (error) => new NetworkError('Failed to generate financial statement', error as Error)
    }),
  
  getTrialBalance: (asOfDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/gl/trial-balance', {
          params: {
            query: {
              book: 'MAIN',
              period: asOfDate.toISOString().substring(0, 7),  // YYYY-MM format
              currency: 'USD'
            }
          }
        });
        
        const data = unwrapResponse(res);
        return {
          asOfDate: new Date(data.as_of_date),
          accounts: (data.accounts || []).map((acc: any) => ({
            accountNumber: acc.account_number,
            accountName: acc.account_name,
            debitBalance: acc.debit_balance,
            creditBalance: acc.credit_balance,
          })),
          totalDebits: data.total_debits,
          totalCredits: data.total_credits,
          balanced: data.balanced,
        };
      },
      catch: (error) => new NetworkError('Failed to get trial balance', error as Error)
    }),
  
  generateBalanceSheet: (asOfDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/gl/statements/balance-sheet', {
          params: {
            query: {
              book: 'MAIN',
              entity_id: 'ENTITY1',
              period: asOfDate.toISOString().substring(0, 7),
              currency: 'USD',
              gaap: 'US_GAAP'
            }
          }
        });
        
        const data = unwrapResponse(res);
        return mapToGoFinancialStatement(data);
      },
      catch: (error) => new NetworkError('Failed to generate balance sheet', error as Error)
    }),
  
  generateCashFlowStatement: (startDate: Date, endDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/gl/statements/cash-flow', {
          params: {
            query: {
              book: 'MAIN',
              entity_id: 'ENTITY1',
              period_from: startDate.toISOString().substring(0, 7),
              period_to: endDate.toISOString().substring(0, 7),
              currency: 'USD',
              cash_accounts: ['1010', '1020']
            }
          }
        });
        
        const data = unwrapResponse(res);
        return mapToGoFinancialStatement(data);
      },
      catch: (error) => new NetworkError('Failed to generate cash flow statement', error as Error)
    }),
  
  getAccountBalances: (accountIds: readonly string[], asOfDate?: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/accounts/balances', {
          body: {
            accounts: accountIds  // Hex IDs
          }
        });
        
        const data = unwrapResponse(res);
        // Response format: { balances: { [hex_id: string]: string } }
        return Object.entries(data.balances || {}).map(([accountId, balance]) => ({
          accountId,
          accountNumber: accountId,  // Hex ID used as account number
          accountName: '',  // Not provided by /accounts/balances endpoint
          balance: parseInt(balance as string, 10),
          asOfDate: asOfDate || new Date(),
        }));
      },
      catch: (error) => new NetworkError('Failed to get account balances', error as Error)
    }),
  
  // Accounts Receivable Operations
  createInvoice: (command: CreateInvoiceCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/financial/invoices', {
          body: {
            case_id: command.caseId,
            contract_id: command.contractId,
            customer_id: command.customerId,
            invoice_date: command.invoiceDate.toISOString(),
            due_date: command.dueDate.toISOString(),
            line_items: command.lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total_price: item.totalPrice,
              gl_account_id: item.glAccountId,
            })),
          }
        });
        
        return mapToGoInvoice(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create invoice', error as Error)
    }),
  
  getInvoice: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/invoices/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Invoice not found', entityType: 'Invoice', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoInvoice(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get invoice', error as Error);
      }
    }),
  
  listInvoices: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/invoices', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.invoices || []).map(mapToGoInvoice);
      },
      catch: (error) => new NetworkError('Failed to list invoices', error as Error)
    }),
  
  recordPayment: (command: RecordPaymentCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/financial/payments', {
          body: {
            invoice_id: command.invoiceId,
            payment_date: command.paymentDate.toISOString(),
            payment_method: command.paymentMethod,
            amount: command.amount,
            reference_number: command.referenceNumber,
          }
        });
        
        return mapToGoPayment(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to record payment', error as Error)
    }),
  
  getARAgingReport: (asOfDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/ar-aging', {
          params: { query: { as_of_date: asOfDate.toISOString() } }
        });
        
        const data = unwrapResponse(res);
        return mapToGoARAgingReport(data);
      },
      catch: (error) => new NetworkError('Failed to get AR aging report', error as Error)
    }),
  
  getCustomerPayments: (customerId: string, startDate?: Date, endDate?: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/payments', {
          params: {
            query: {
              customer_id: customerId,
              start_date: startDate?.toISOString(),
              end_date: endDate?.toISOString(),
            }
          }
        });
        
        const data = unwrapResponse(res);
        return (data.payments || []).map(mapToGoPayment);
      },
      catch: (error) => new NetworkError('Failed to get customer payments', error as Error)
    }),
  
  // Accounts Payable Operations
  createVendorBill: (command: CreateVendorBillCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/financial/vendor-bills', {
          body: {
            vendor_id: command.vendorId,
            bill_date: command.billDate.toISOString(),
            due_date: command.dueDate.toISOString(),
            bill_number: command.billNumber,
            line_items: command.lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total_price: item.totalPrice,
              gl_account_id: item.glAccountId,
            })),
            purchase_order_id: command.purchaseOrderId,
          }
        });
        
        return mapToGoVendorBill(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create vendor bill', error as Error)
    }),
  
  uploadAndScanBill: (vendorId: string, fileUrl: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/financial/vendor-bills/scan', {
          body: {
            vendor_id: vendorId,
            file_url: fileUrl,
          }
        });
        
        return mapToGoVendorBill(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to upload and scan bill', error as Error)
    }),
  
  getVendorBill: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/vendor-bills/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'VendorBill not found', entityType: 'VendorBill', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoVendorBill(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get vendor bill', error as Error);
      }
    }),
  
  listVendorBills: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/vendor-bills', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.bills || []).map(mapToGoVendorBill);
      },
      catch: (error) => new NetworkError('Failed to list vendor bills', error as Error)
    }),
  
  approveVendorBill: (id: string, approvedBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/financial/vendor-bills/{id}/approve', {
          params: { path: { id } },
          body: { approved_by: approvedBy }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve vendor bill', error as Error)
    }),
  
  payVendorBills: (command: PayVendorBillsCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/financial/vendor-payments', {
          body: {
            vendor_id: command.vendorId,
            bill_ids: command.billIds,
            payment_date: command.paymentDate.toISOString(),
            payment_method: command.paymentMethod,
          }
        });
        
        return mapToGoVendorPayment(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to pay vendor bills', error as Error)
    }),
  
  getVendorPayments: (vendorId: string, startDate?: Date, endDate?: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/vendor-payments', {
          params: {
            query: {
              vendor_id: vendorId,
              start_date: startDate?.toISOString(),
              end_date: endDate?.toISOString(),
            }
          }
        });
        
        const data = unwrapResponse(res);
        return (data.payments || []).map(mapToGoVendorPayment);
      },
      catch: (error) => new NetworkError('Failed to get vendor payments', error as Error)
    }),
  
  getThreeWayMatchStatus: (billId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/financial/vendor-bills/{id}/match-status', {
          params: { path: { id: billId } }
        });
        
        const data = unwrapResponse(res);
        return mapToGoThreeWayMatchStatus(data);
      },
      catch: (error) => new NetworkError('Failed to get three-way match status', error as Error)
    }),
  
  createAPPaymentRun: (command: CreateAPPaymentRunCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/ap/payment-runs', {
          body: {
            tenant: command.tenant || 'default',
            legal_entity: command.legalEntity || 'default',
            currency: command.currency || 'USD',
            // Automatically scans approved AP invoices
          }
        });
        
        const data = unwrapResponse(res);
        return {
          id: data.payment_run_id,
          runNumber: data.payment_run_id,
          runDate: new Date(),
          status: 'draft',
          billIds: [],
          totalAmount: 0,
          paymentMethod: command.paymentMethod,
          createdBy: command.createdBy,
          createdAt: new Date(),
        };
      },
      catch: (error) => new NetworkError('Failed to create AP payment run', error as Error)
    }),
  
  getAPPaymentRun: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/ap/payment-runs/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({
              message: 'Payment run not found',
              entityType: 'APPaymentRun',
              entityId: id
            });
          }
          throw new Error(res.error.message);
        }
        
        const data = res.data;
        return {
          id: data.payment_run_id,
          runNumber: data.payment_run_id,
          runDate: new Date(data.created_at),
          status: data.status,
          billIds: data.items?.map((i: any) => i.invoice_id) || [],
          totalAmount: data.items?.reduce((sum: number, i: any) => sum + i.amount_cents, 0) || 0,
          paymentMethod: 'ach',  // Determined by export format
          createdBy: data.created_by || 'system',
          createdAt: new Date(data.created_at),
          approvedBy: data.approved_by,
          approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
        };
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get AP payment run', error as Error);
      }
    }),
};

// Mappers
function mapToGoGLAccount(data: any): GoGLAccount {
  return {
    id: data.id,
    accountNumber: data.account_number,
    name: data.name,
    type: data.type,
    subtype: data.subtype,
    normalBalance: data.normal_balance,
    isActive: data.is_active,
    parentAccountId: data.parent_account_id,
    balance: data.balance,
  };
}

function mapToGoJournalEntry(data: any): GoJournalEntry {
  return {
    id: data.id,
    entryNumber: data.entry_number,
    entryDate: new Date(data.entry_date),
    description: data.description,
    status: data.status,
    lines: (data.lines || []).map((line: any) => ({
      id: line.id,
      accountId: line.account_id,
      accountNumber: line.account_number,
      accountName: line.account_name,
      debit: line.debit,
      credit: line.credit,
      description: line.description,
    })),
    totalDebit: data.total_debit,
    totalCredit: data.total_credit,
    postedAt: data.posted_at ? new Date(data.posted_at) : undefined,
    postedBy: data.posted_by,
    reversedAt: data.reversed_at ? new Date(data.reversed_at) : undefined,
    reversalEntryId: data.reversal_entry_id,
  };
}

function mapToGoFinancialStatement(data: any): GoFinancialStatement {
  return {
    type: data.type,
    asOfDate: new Date(data.as_of_date),
    sections: (data.sections || []).map((section: any) => ({
      name: section.name,
      subtotal: section.subtotal,
      accounts: (section.accounts || []).map((acc: any) => ({
        accountNumber: acc.account_number,
        accountName: acc.account_name,
        amount: acc.amount,
      })),
    })),
    totalAssets: data.total_assets,
    totalLiabilities: data.total_liabilities,
    totalEquity: data.total_equity,
    netIncome: data.net_income,
  };
}

function mapToGoInvoice(data: any): GoInvoice {
  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    caseId: data.case_id,
    contractId: data.contract_id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    invoiceDate: new Date(data.invoice_date),
    dueDate: new Date(data.due_date),
    status: data.status,
    lineItems: (data.line_items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      glAccountId: item.gl_account_id,
    })),
    subtotal: data.subtotal,
    taxAmount: data.tax_amount,
    totalAmount: data.total_amount,
    amountPaid: data.amount_paid,
    amountDue: data.amount_due,
    createdAt: new Date(data.created_at),
  };
}

function mapToGoPayment(data: any): GoPayment {
  return {
    id: data.id,
    paymentNumber: data.payment_number,
    invoiceId: data.invoice_id,
    customerId: data.customer_id,
    paymentDate: new Date(data.payment_date),
    paymentMethod: data.payment_method,
    amount: data.amount,
    referenceNumber: data.reference_number,
    status: data.status,
    postedToGL: data.posted_to_gl,
    createdAt: new Date(data.created_at),
  };
}

function mapToGoARAgingReport(data: any): GoARAgingReport {
  return {
    asOfDate: new Date(data.as_of_date),
    customers: (data.customers || []).map((customer: any) => ({
      customerId: customer.customer_id,
      customerName: customer.customer_name,
      current: customer.current,
      days1to30: customer.days_1_to_30,
      days31to60: customer.days_31_to_60,
      days61to90: customer.days_61_to_90,
      days90Plus: customer.days_90_plus,
      totalOutstanding: customer.total_outstanding,
    })),
    buckets: (data.buckets || []).map((bucket: any) => ({
      category: bucket.category,
      invoiceCount: bucket.invoice_count,
      totalAmount: bucket.total_amount,
    })),
    totalOutstanding: data.total_outstanding,
  };
}

function mapToGoVendorBill(data: any): GoVendorBill {
  return {
    id: data.id,
    billNumber: data.bill_number,
    vendorId: data.vendor_id,
    vendorName: data.vendor_name,
    billDate: new Date(data.bill_date),
    dueDate: new Date(data.due_date),
    status: data.status,
    lineItems: (data.line_items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      glAccountId: item.gl_account_id,
      matchedToPO: item.matched_to_po,
    })),
    subtotal: data.subtotal,
    taxAmount: data.tax_amount,
    totalAmount: data.total_amount,
    amountPaid: data.amount_paid,
    amountDue: data.amount_due,
    purchaseOrderId: data.purchase_order_id,
    ocrExtracted: data.ocr_extracted,
    createdAt: new Date(data.created_at),
  };
}

function mapToGoVendorPayment(data: any): GoVendorPayment {
  return {
    id: data.id,
    paymentNumber: data.payment_number,
    vendorId: data.vendor_id,
    vendorName: data.vendor_name,
    paymentDate: new Date(data.payment_date),
    paymentMethod: data.payment_method,
    amount: data.amount,
    billIds: data.bill_ids || [],
    status: data.status,
    nachaFileId: data.nacha_file_id,
    checkNumber: data.check_number,
    createdAt: new Date(data.created_at),
  };
}

function mapToGoThreeWayMatchStatus(data: any): GoThreeWayMatchStatus {
  return {
    billId: data.bill_id,
    purchaseOrderId: data.purchase_order_id,
    receiptId: data.receipt_id,
    poMatched: data.po_matched,
    receiptMatched: data.receipt_matched,
    fullyMatched: data.fully_matched,
    variances: (data.variances || []).map((v: any) => ({
      type: v.type,
      description: v.description,
      expected: v.expected,
      actual: v.actual,
    })),
  };
}

// TODO: Implement AP Payment Run endpoints when Go backend adds them
// function mapToGoAPPaymentRun(data: any): GoAPPaymentRun {
//   return {
//     id: data.id,
//     runNumber: data.run_number,
//     runDate: new Date(data.run_date),
//     status: data.status,
//     billIds: data.bill_ids || [],
//     totalAmount: data.total_amount,
//     paymentMethod: data.payment_method,
//     nachaFileId: data.nacha_file_id,
//     createdBy: data.created_by,
//     createdAt: new Date(data.created_at),
//     approvedBy: data.approved_by,
//     approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
//   };
// }
