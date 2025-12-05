# Document Generation System - Week 4 Implementation Guide

**Status**: Ready to implement  
**Phase**: Infrastructure Layer - React-PDF Adapter  
**Estimated Time**: 12-16 hours

## Overview

Week 4 implements the React-PDF adapter for generating business documents (invoices, purchase orders, receipts). This adapter will consume the `DocumentGeneratorPort` interface created in Week 3 and produce PDF buffers using React components.

## Prerequisites (Already Complete)

- ✅ Week 1: Dependencies installed (`@react-pdf/renderer` v4.3.1)
- ✅ Week 2: Domain entities (`InvoiceData`, etc.)
- ✅ Week 3: Port interfaces (`DocumentGeneratorPort`)

## Architecture Alignment

### Key Principles
- **Object-based adapter** (NOT class) - follows existing pattern
- **Effect-TS integration** - all methods return `Effect.Effect<Result, Error>`
- **Zero business logic** - delegates to domain entities
- **Smart conditional rendering** - electronic vs. printed context

### File Structure
```
packages/infrastructure/src/adapters/documents/
├── react-pdf-adapter.ts                    # Main adapter (object-based)
└── templates/
    └── business/
        ├── invoice-template.tsx            # Invoice React component
        ├── purchase-order-template.tsx     # PO React component
        ├── receipt-template.tsx            # Receipt React component
        └── shared/
            ├── document-header.tsx         # Reusable header
            └── document-footer.tsx         # Reusable footer
```

## Deliverable 1: React-PDF Adapter

**File**: `packages/infrastructure/src/adapters/documents/react-pdf-adapter.ts`

### Implementation Pattern

```typescript
import { pdf } from '@react-pdf/renderer';
import { Effect } from 'effect';
import { DocumentGenerationError } from '@dykstra/application';
import type { 
  DocumentGeneratorPortService,
  PurchaseOrderData,
  ReceiptData 
} from '@dykstra/application';
import type { InvoiceData } from '@dykstra/domain';
import { InvoiceTemplate } from './templates/business/invoice-template';
import { PurchaseOrderTemplate } from './templates/business/purchase-order-template';
import { ReceiptTemplate } from './templates/business/receipt-template';

/**
 * React-PDF Adapter
 * 
 * Object-based implementation of DocumentGeneratorPort for business documents.
 * Uses React-PDF to generate PDFs from React components.
 * 
 * Performance target: <200ms per document
 */
export const ReactPDFAdapter: Pick<
  DocumentGeneratorPortService,
  'generateInvoice' | 'generatePurchaseOrder' | 'generateReceipt'
> = {
  /**
   * Generate invoice PDF
   * 
   * Backend operation:
   * 1. Creates React component with InvoiceData
   * 2. Renders to PDF via @react-pdf/renderer
   * 3. Converts blob to Buffer
   * 4. Returns Buffer for storage/delivery
   */
  generateInvoice: (data: InvoiceData) =>
    Effect.tryPromise({
      try: async () => {
        const doc = <InvoiceTemplate data={data} />;
        const blob = await pdf(doc).toBlob();
        return Buffer.from(await blob.arrayBuffer());
      },
      catch: (error) =>
        new DocumentGenerationError({
          message: 'Invoice PDF generation failed',
          cause: error,
        }),
    }),

  /**
   * Generate purchase order PDF
   */
  generatePurchaseOrder: (data: PurchaseOrderData) =>
    Effect.tryPromise({
      try: async () => {
        const doc = <PurchaseOrderTemplate data={data} />;
        const blob = await pdf(doc).toBlob();
        return Buffer.from(await blob.arrayBuffer());
      },
      catch: (error) =>
        new DocumentGenerationError({
          message: 'Purchase order PDF generation failed',
          cause: error,
        }),
    }),

  /**
   * Generate receipt PDF
   */
  generateReceipt: (data: ReceiptData) =>
    Effect.tryPromise({
      try: async () => {
        const doc = <ReceiptTemplate data={data} />;
        const blob = await pdf(doc).toBlob();
        return Buffer.from(await blob.arrayBuffer());
      },
      catch: (error) =>
        new DocumentGenerationError({
          message: 'Receipt PDF generation failed',
          cause: error,
        }),
    }),
};
```

### Key Implementation Notes

1. **Object-based** - Uses `const` object, not `class`
2. **Partial implementation** - Only implements 3 of 5 methods (memorial docs in Week 8)
3. **Effect.tryPromise** - Wraps async PDF generation
4. **Error wrapping** - All errors converted to `DocumentGenerationError`
5. **Buffer conversion** - Blob → ArrayBuffer → Buffer for Node.js compatibility

## Deliverable 2: Invoice Template

**File**: `packages/infrastructure/src/adapters/documents/templates/business/invoice-template.tsx`

### Implementation Pattern

```typescript
import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
} from '@react-pdf/renderer';
import type { InvoiceData } from '@dykstra/domain';
import { DocumentHeader } from './shared/document-header';
import { DocumentFooter } from './shared/document-footer';

/**
 * React-PDF styles for invoice
 * Follows Dykstra brand guidelines (navy, sage, cream, gold)
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    color: '#1e3a5f', // Navy
    fontWeight: 'bold',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  metadataSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f3ed', // Cream
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  metadataLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  lineItemsTable: {
    marginTop: 20,
    marginBottom: 20,
  },
  lineItemHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
    paddingBottom: 5,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  lineItem: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  description: {
    flex: 3,
  },
  quantity: {
    flex: 1,
    textAlign: 'center',
  },
  unitPrice: {
    flex: 1,
    textAlign: 'right',
  },
  totalPrice: {
    flex: 1,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: 250,
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  grandTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#1e3a5f',
  },
  paymentLink: {
    color: '#1976d2',
    textDecoration: 'underline',
    marginTop: 20,
    fontSize: 12,
  },
  paymentInstructions: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f5f3ed',
    fontSize: 10,
    color: '#666',
  },
});

/**
 * Invoice Template React Component
 * 
 * Smart rendering:
 * - Shows payment link only for electronic delivery of unpaid invoices
 * - Shows payment instructions only for printed invoices
 * - Uses domain entity methods for business rules
 */
export const InvoiceTemplate: React.FC<{ data: InvoiceData }> = ({ data }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <DocumentHeader funeralHomeName="Dykstra Funeral Home" />

      {/* Invoice Title */}
      <View style={styles.header}>
        <Text>Invoice</Text>
      </View>
      <Text style={styles.invoiceNumber}>Invoice #{data.metadata.invoiceNumber}</Text>

      {/* Metadata Section */}
      <View style={styles.metadataSection}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Bill To:</Text>
          <Text>{data.parties.billTo.name}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Invoice Date:</Text>
          <Text>{data.metadata.invoiceDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Due Date:</Text>
          <Text>{data.metadata.dueDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Status:</Text>
          <Text style={{ color: data.getStatusColor() }}>
            {data.metadata.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Line Items Table */}
      <View style={styles.lineItemsTable}>
        <View style={styles.lineItemHeader}>
          <Text style={styles.description}>Description</Text>
          <Text style={styles.quantity}>Qty</Text>
          <Text style={styles.unitPrice}>Unit Price</Text>
          <Text style={styles.totalPrice}>Total</Text>
        </View>

        {data.lineItems.map((item, idx) => (
          <View key={idx} style={styles.lineItem}>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <Text style={styles.unitPrice}>
              ${InvoiceData.formatCurrency(item.unitPrice)}
            </Text>
            <Text style={styles.totalPrice}>
              ${InvoiceData.formatCurrency(item.totalPrice)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text>Subtotal:</Text>
          <Text>${InvoiceData.formatCurrency(data.getSubtotal())}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>Tax:</Text>
          <Text>${InvoiceData.formatCurrency(data.getTaxAmount())}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text>Total Due:</Text>
          <Text>${InvoiceData.formatCurrency(data.getTotalAmount())}</Text>
        </View>
      </View>

      {/* Smart conditional rendering - Electronic delivery */}
      {data.shouldShowPaymentLink('electronic') && (
        <Link
          src={data.metadata.paymentUrl || '#'}
          style={styles.paymentLink}
        >
          Click here to pay online securely →
        </Link>
      )}

      {/* Smart conditional rendering - Printed delivery */}
      {!data.shouldShowPaymentLink('printed') && (
        <View style={styles.paymentInstructions}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
            Payment Instructions:
          </Text>
          <Text>Please remit payment to:</Text>
          <Text>{data.parties.billFrom.name}</Text>
          <Text>
            {data.parties.billFrom.line1}, {data.parties.billFrom.city},{' '}
            {data.parties.billFrom.state} {data.parties.billFrom.postalCode}
          </Text>
        </View>
      )}

      {/* Footer */}
      <DocumentFooter />
    </Page>
  </Document>
);
```

### Key Template Features

1. **Dykstra branding** - Navy (#1e3a5f), Sage, Cream (#f5f3ed), Gold
2. **Business rule delegation** - Uses `data.getStatusColor()`, `data.shouldShowPaymentLink()`
3. **Smart rendering** - Different content for electronic vs. printed
4. **Professional layout** - Table structure, totals alignment, color coding
5. **Currency formatting** - Always 2 decimals via `InvoiceData.formatCurrency()`

## Deliverable 3: Shared Components

### Document Header

**File**: `packages/infrastructure/src/adapters/documents/templates/business/shared/document-header.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  tagline: {
    fontSize: 10,
    color: '#8b9d83', // Sage
    marginTop: 5,
  },
});

export const DocumentHeader: React.FC<{ funeralHomeName: string }> = ({
  funeralHomeName,
}) => (
  <View style={styles.header}>
    <Text style={styles.companyName}>{funeralHomeName}</Text>
    <Text style={styles.tagline}>Serving Families with Compassion Since 1929</Text>
  </View>
);
```

### Document Footer

**File**: `packages/infrastructure/src/adapters/documents/templates/business/shared/document-footer.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export const DocumentFooter: React.FC = () => (
  <View style={styles.footer}>
    <Text>
      Dykstra Funeral Home | 123 Main Street, Anytown, MI 12345 | (555) 123-4567
    </Text>
    <Text>www.dykstrafuneralhome.com</Text>
  </View>
);
```

## Deliverable 4: Purchase Order Template (Skeleton)

**File**: `packages/infrastructure/src/adapters/documents/templates/business/purchase-order-template.tsx`

```typescript
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { PurchaseOrderData } from '@dykstra/application';
import { DocumentHeader } from './shared/document-header';
import { DocumentFooter } from './shared/document-footer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  // ... similar to invoice styles
});

export const PurchaseOrderTemplate: React.FC<{ data: PurchaseOrderData }> = ({
  data,
}) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <DocumentHeader funeralHomeName="Dykstra Funeral Home" />
      <View>
        <Text style={{ fontSize: 24, marginBottom: 20 }}>Purchase Order</Text>
        <Text>PO #{data.poNumber}</Text>
        {/* Similar structure to invoice */}
      </View>
      <DocumentFooter />
    </Page>
  </Document>
);
```

## Deliverable 5: Receipt Template (Skeleton)

**File**: `packages/infrastructure/src/adapters/documents/templates/business/receipt-template.tsx`

```typescript
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ReceiptData } from '@dykstra/application';
import { DocumentHeader } from './shared/document-header';
import { DocumentFooter } from './shared/document-footer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  // ... receipt-specific styles
});

export const ReceiptTemplate: React.FC<{ data: ReceiptData }> = ({ data }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <DocumentHeader funeralHomeName="Dykstra Funeral Home" />
      <View>
        <Text style={{ fontSize: 24, marginBottom: 20 }}>Receipt</Text>
        <Text>Receipt #{data.receiptNumber}</Text>
        {/* Receipt-specific content */}
      </View>
      <DocumentFooter />
    </Page>
  </Document>
);
```

## Acceptance Criteria Checklist

- [ ] **Adapter is const object (not class)** - Follows existing pattern in infrastructure layer
- [ ] **All methods return Effect** - `Effect.tryPromise` wraps async operations
- [ ] **Templates are React components** - Use `@react-pdf/renderer` primitives
- [ ] **Smart conditional rendering** - Electronic vs. printed context via domain methods
- [ ] **Generation time <200ms** - Verify with performance tests
- [ ] **Zero TypeScript errors** - Run `pnpm type-check`
- [ ] **Zero business logic in adapter** - All logic delegated to domain entities

## Testing Strategy

### Unit Tests (NOT in scope for Week 4, but documented for Week 5)

```typescript
import { describe, it, expect } from 'vitest';
import { Effect } from 'effect';
import { ReactPDFAdapter } from './react-pdf-adapter';
import { InvoiceData } from '@dykstra/domain';

describe('ReactPDFAdapter', () => {
  it('generates invoice PDF buffer', async () => {
    const invoiceData = InvoiceData.create(/* ... */);
    
    const result = await Effect.runPromise(
      ReactPDFAdapter.generateInvoice(invoiceData)
    );

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes payment link for electronic delivery', async () => {
    // Test conditional rendering
  });

  it('excludes payment link for printed delivery', async () => {
    // Test conditional rendering
  });
});
```

## Performance Target

**Goal**: <200ms per invoice generation

**Measurement approach**:
```typescript
const start = Date.now();
const buffer = await Effect.runPromise(
  ReactPDFAdapter.generateInvoice(invoiceData)
);
const duration = Date.now() - start;
console.log(`Generated in ${duration}ms`);
```

## Next Session Checklist

When implementing Week 4:

1. Create all 5 files in correct directories
2. Verify TypeScript compilation: `pnpm type-check`
3. Test PDF generation manually (Week 5 will add automated tests)
4. Measure generation time
5. Verify smart conditional rendering (electronic vs. printed)
6. Update plan with completion status

## Notes

- Purchase Order and Receipt templates are **skeletons** - full implementation in Week 5
- Memorial document generation (Puppeteer) starts in Week 8
- Invoice template is the **reference implementation** - PO and Receipt follow same pattern
- All domain entity methods (getStatusColor, shouldShowPaymentLink, etc.) work correctly from Week 2

---

**Status**: Ready to implement  
**Estimated Duration**: 12-16 hours  
**Next Week**: Week 5 - Use Cases & Integration Tests
