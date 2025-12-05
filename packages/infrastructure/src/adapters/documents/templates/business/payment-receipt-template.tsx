import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { PaymentReceiptData } from '@dykstra/application';
import { DocumentHeader } from './shared/document-header';
import { DocumentFooter } from './shared/document-footer';

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
  receiptNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  thankYouMessage: {
    fontSize: 12,
    color: '#8b9d83', // Sage
    marginBottom: 20,
    fontStyle: 'italic',
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
    width: 140,
  },
  paymentDetails: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f3ed',
    borderLeftWidth: 4,
    borderLeftColor: '#1e3a5f',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  paymentValue: {
    fontSize: 11,
  },
  amountPaid: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#1e3a5f',
  },
  appliedToSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 10,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  noteSection: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f5f3ed',
    fontSize: 9,
    color: '#666',
  },
});

/**
 * Payment Receipt Template React Component
 * 
 * Customer-facing proof of payment document.
 * Professional, warm design appropriate for funeral home context.
 */
export const PaymentReceiptTemplate: React.FC<{ data: PaymentReceiptData }> = ({
  data,
}) => {
  // Format payment method for display
  const formatPaymentMethod = (method: string): string => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'check':
        return 'Check';
      case 'credit_card':
        return 'Credit Card';
      case 'ach':
        return 'ACH/Bank Transfer';
      case 'wire':
        return 'Wire Transfer';
      default:
        return method;
    }
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <DocumentHeader funeralHomeName="Dykstra Funeral Home" />

        {/* Receipt Title */}
        <View style={styles.header}>
          <Text>Payment Receipt</Text>
        </View>
        <Text style={styles.receiptNumber}>Receipt #{data.receiptNumber}</Text>
        <Text style={styles.thankYouMessage}>
          Thank you for your payment. We appreciate your trust in our care.
        </Text>

        {/* Customer & Payment Info */}
        <View style={styles.metadataSection}>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Received From:</Text>
            <Text>{data.customerName}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Payment Date:</Text>
            <Text>{data.paymentDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Payment Method:</Text>
            <Text>{formatPaymentMethod(data.paymentMethod)}</Text>
          </View>
          {data.referenceNumber && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Reference Number:</Text>
              <Text>{data.referenceNumber}</Text>
            </View>
          )}
        </View>

        {/* Payment Amount */}
        <View style={styles.paymentDetails}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount Received:</Text>
            <Text style={styles.paymentValue}>
              ${data.amount.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.paymentRow, styles.amountPaid]}>
            <Text>Total Payment:</Text>
            <Text>${data.amount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Applied to Invoices */}
        <View style={styles.appliedToSection}>
          <Text style={styles.sectionTitle}>Payment Applied To:</Text>
          {data.appliedToInvoices.map((application, idx) => (
            <View key={idx} style={styles.invoiceRow}>
              <Text>Invoice #{application.invoiceNumber}</Text>
              <Text>${application.amountApplied.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={styles.noteSection}>
          <Text>
            This receipt is for your records. Please retain for tax purposes.
          </Text>
          <Text style={{ marginTop: 5 }}>
            If you have any questions about this payment, please contact us at
            (555) 123-4567.
          </Text>
        </View>

        <DocumentFooter />
      </Page>
    </Document>
  );
};
