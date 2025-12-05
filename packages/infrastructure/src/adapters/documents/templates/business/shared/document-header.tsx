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
