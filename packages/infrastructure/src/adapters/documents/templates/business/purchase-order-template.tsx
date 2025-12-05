import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { PurchaseOrderData } from '@dykstra/application';
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
  poNumber: {
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
    width: 120,
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
  notesSection: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f5f3ed',
    fontSize: 10,
  },
  notesTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

/**
 * Purchase Order Template React Component
 * 
 * Displays vendor PO with line items, delivery date, and totals.
 * Used for vendor communication and internal tracking.
 */
export const PurchaseOrderTemplate: React.FC<{ data: PurchaseOrderData }> = ({
  data,
}) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <DocumentHeader funeralHomeName="Dykstra Funeral Home" />
      
      <View style={styles.header}>
        <Text>Purchase Order</Text>
      </View>
      <Text style={styles.poNumber}>PO #{data.poNumber}</Text>

      {/* Metadata Section */}
      <View style={styles.metadataSection}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Vendor:</Text>
          <Text>{data.vendorName}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Order Date:</Text>
          <Text>{data.orderDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Expected Delivery:</Text>
          <Text>{data.deliveryDate.toLocaleDateString()}</Text>
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
              ${item.unitPrice.toFixed(2)}
            </Text>
            <Text style={styles.totalPrice}>
              ${item.totalPrice.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text>Subtotal:</Text>
          <Text>${data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>Tax:</Text>
          <Text>${data.tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text>Total:</Text>
          <Text>${data.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Notes Section */}
      {data.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Notes:</Text>
          <Text>{data.notes}</Text>
        </View>
      )}

      <DocumentFooter />
    </Page>
  </Document>
);
