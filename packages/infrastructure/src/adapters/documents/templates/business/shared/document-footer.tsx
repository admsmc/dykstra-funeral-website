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
