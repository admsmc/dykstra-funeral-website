import { Effect, type Context } from 'effect';
import { GoFinancialPort, type GoVendorBill } from '../../ports/go-financial-port';
import { type NetworkError } from '../../ports/go-contract-port';

/**
 * List Vendor Bills
 * 
 * Retrieves vendor bills with optional filters (status, date range).
 * Delegates to Go backend which queries the financial system.
 */
export const listVendorBills = (params: {
  vendorId?: string;
  status?: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'paid' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  funeralHomeId: string;
}): Effect.Effect<readonly GoVendorBill[], NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    const goFinancial = yield* GoFinancialPort;
    
    // Delegate to Go backend with filters
    const bills = yield* goFinancial.listVendorBills({
      vendorId: params.vendorId,
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
    });
    
    return bills;
  });

/**
 * Group Vendor Bills by Vendor
 * 
 * Takes a list of vendor bills and groups them by vendor for UI display.
 * Returns vendor-grouped payables with totals.
 */
export interface VendorPayables {
  vendorId: string;
  vendorName: string;
  bills: readonly GoVendorBill[];
  totalAmount: number;
  totalDue: number;
}

export const groupVendorBillsByVendor = (
  bills: readonly GoVendorBill[]
): readonly VendorPayables[] => {
  // Group bills by vendor
  const vendorMap = new Map<string, GoVendorBill[]>();
  
  for (const bill of bills) {
    if (!vendorMap.has(bill.vendorId)) {
      vendorMap.set(bill.vendorId, []);
    }
    vendorMap.get(bill.vendorId)!.push(bill);
  }
  
  // Create VendorPayables objects
  return Array.from(vendorMap.entries()).map(([vendorId, vendorBills]) => {
    const firstBill = vendorBills[0]!; // Safe: vendorMap only contains non-empty arrays
    const totalAmount = vendorBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalDue = vendorBills.reduce((sum, b) => sum + b.amountDue, 0);
    
    return {
      vendorId,
      vendorName: firstBill.vendorName,
      bills: vendorBills,
      totalAmount,
      totalDue,
    };
  });
};
