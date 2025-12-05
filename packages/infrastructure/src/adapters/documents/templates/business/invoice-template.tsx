import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
} from '@react-pdf/renderer';
import { InvoiceData } from '@dykstra/domain';
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
  instructionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
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
          <Text style={styles.instructionTitle}>
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
