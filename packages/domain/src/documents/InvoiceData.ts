/**
 * Invoice domain entity
 * Pure business logic with zero external dependencies
 * 
 * Design Note: This entity receives pre-calculated amounts from the Go ERP backend.
 * Financial calculations (subtotal, tax, total) are the backend's responsibility.
 * This entity focuses on display logic, validation, and UI concerns.
 */

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type InvoiceDeliveryMethod = 'electronic' | 'printed';

export interface InvoiceLineItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number; // Backend-calculated line total
  readonly glAccountId: string;
}

export interface InvoiceAddress {
  readonly name: string;
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
}

export interface InvoiceMetadata {
  readonly id: string; // Invoice ID from Go backend
  readonly invoiceNumber: string;
  readonly invoiceDate: Date;
  readonly dueDate: Date;
  readonly status: InvoiceStatus;
  readonly caseId: string; // Link to funeral case
  readonly contractId: string; // Link to contract
  readonly customerId: string;
  readonly customerName: string;
  readonly paymentUrl?: string; // Stripe payment link
  readonly createdAt: Date;
}

export interface InvoiceParties {
  readonly billTo: InvoiceAddress;
  readonly billFrom: InvoiceAddress;
}

/**
 * Pre-calculated financial amounts from Go ERP backend
 */
export interface InvoiceAmounts {
  readonly subtotal: number;    // Backend-calculated
  readonly taxAmount: number;   // Backend-calculated
  readonly totalAmount: number; // Backend-calculated
  readonly amountPaid: number;  // Backend-calculated
  readonly amountDue: number;   // Backend-calculated
}

/**
 * Invoice domain entity
 * Contains all data needed to generate an invoice plus display/UI business rules
 * 
 * Financial calculations are performed by the Go ERP backend.
 */
export class InvoiceData {
  private constructor(
    public readonly metadata: InvoiceMetadata,
    public readonly parties: InvoiceParties,
    public readonly amounts: InvoiceAmounts,
    public readonly lineItems: ReadonlyArray<InvoiceLineItem>,
    public readonly notes?: string
  ) {
    this.validate();
  }

  /**
   * Factory method for creating invoices from Go backend data
   */
  static create(
    metadata: InvoiceMetadata,
    parties: InvoiceParties,
    amounts: InvoiceAmounts,
    lineItems: ReadonlyArray<InvoiceLineItem>,
    notes?: string
  ): InvoiceData {
    return new InvoiceData(metadata, parties, amounts, lineItems, notes);
  }

  /**
   * Business rule: Validate invoice data integrity
   * 
   * Defense-in-depth validation to catch backend bugs or data corruption.
   * Does NOT recalculate amounts - only validates them.
   * 
   * @throws Error if validation fails
   */
  private validate(): void {
    // Validate required data
    if (this.lineItems.length === 0) {
      throw new Error('Invoice must have at least one line item');
    }

    // Validate dates
    if (this.metadata.dueDate < this.metadata.invoiceDate) {
      throw new Error('Due date cannot be before invoice date');
    }

    // Validate financial amounts (defense against backend bugs)
    if (this.amounts.subtotal < 0) {
      throw new Error('Subtotal cannot be negative');
    }
    if (this.amounts.taxAmount < 0) {
      throw new Error('Tax amount cannot be negative');
    }
    if (this.amounts.totalAmount < 0) {
      throw new Error('Total amount cannot be negative');
    }
    if (this.amounts.amountPaid < 0) {
      throw new Error('Amount paid cannot be negative');
    }
    if (this.amounts.amountDue < 0) {
      throw new Error('Amount due cannot be negative');
    }

    // Validate line items
    this.lineItems.forEach((item, index) => {
      if (item.quantity <= 0) {
        throw new Error(`Line item ${index + 1}: quantity must be positive`);
      }
      if (item.unitPrice < 0) {
        throw new Error(`Line item ${index + 1}: unit price cannot be negative`);
      }
      if (item.totalPrice < 0) {
        throw new Error(`Line item ${index + 1}: total price cannot be negative`);
      }
    });

    // Sanity check: totalAmount should equal subtotal + taxAmount
    const expectedTotal = this.amounts.subtotal + this.amounts.taxAmount;
    if (Math.abs(this.amounts.totalAmount - expectedTotal) > 0.01) {
      throw new Error(
        `Total amount (${this.amounts.totalAmount}) does not match subtotal + tax (${expectedTotal})`
      );
    }

    // Sanity check: amountDue should equal totalAmount - amountPaid
    const expectedDue = this.amounts.totalAmount - this.amounts.amountPaid;
    if (Math.abs(this.amounts.amountDue - expectedDue) > 0.01) {
      throw new Error(
        `Amount due (${this.amounts.amountDue}) does not match total - paid (${expectedDue})`
      );
    }
  }

  /**
   * Business rule: Should show payment link?
   * Only show for electronic delivery of unpaid invoices
   */
  shouldShowPaymentLink(deliveryMethod: InvoiceDeliveryMethod): boolean {
    const unpaidStatuses: InvoiceStatus[] = ['draft', 'sent', 'partial', 'overdue'];
    return (
      deliveryMethod === 'electronic' &&
      unpaidStatuses.includes(this.metadata.status) &&
      !!this.metadata.paymentUrl
    );
  }

  /**
   * Business rule: Get status display color
   * Used for visual status indicators
   */
  getStatusColor(): string {
    switch (this.metadata.status) {
      case 'draft':
        return '#6B7280'; // Gray
      case 'sent':
        return '#3B82F6'; // Blue
      case 'partial':
        return '#F59E0B'; // Amber (partially paid)
      case 'paid':
        return '#10B981'; // Green
      case 'overdue':
        return '#EF4444'; // Red
      case 'cancelled':
        return '#6B7280'; // Gray
    }
  }

  /**
   * Get subtotal (backend-calculated)
   */
  getSubtotal(): number {
    return this.amounts.subtotal;
  }

  /**
   * Get tax amount (backend-calculated)
   */
  getTaxAmount(): number {
    return this.amounts.taxAmount;
  }

  /**
   * Get total amount (backend-calculated)
   */
  getTotalAmount(): number {
    return this.amounts.totalAmount;
  }

  /**
   * Get amount paid (backend-calculated)
   */
  getAmountPaid(): number {
    return this.amounts.amountPaid;
  }

  /**
   * Get amount due (backend-calculated)
   */
  getAmountDue(): number {
    return this.amounts.amountDue;
  }

  /**
   * Business rule: Is invoice fully paid?
   */
  isFullyPaid(): boolean {
    return this.metadata.status === 'paid' || this.amounts.amountDue === 0;
  }

  /**
   * Business rule: Is invoice partially paid?
   */
  isPartiallyPaid(): boolean {
    return this.amounts.amountPaid > 0 && this.amounts.amountDue > 0;
  }

  /**
   * Business rule: Is invoice overdue?
   */
  isOverdue(currentDate: Date = new Date()): boolean {
    return (
      this.metadata.status !== 'paid' &&
      this.metadata.status !== 'cancelled' &&
      currentDate > this.metadata.dueDate
    );
  }

  /**
   * Business rule: Get number of days until/past due
   */
  getDaysUntilDue(currentDate: Date = new Date()): number {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const timeDiff = this.metadata.dueDate.getTime() - currentDate.getTime();
    return Math.floor(timeDiff / millisecondsPerDay);
  }

  /**
   * Business rule: Format currency
   * Always 2 decimal places, no currency symbol (template decides presentation)
   */
  static formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }
}
