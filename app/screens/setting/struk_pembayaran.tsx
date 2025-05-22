import React from 'react';
import { View, Text, StyleSheet, Button, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Fungsi untuk generate HTML struk
export const generateReceiptHTML = () => {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Struk Pembayaran</h1>
        <p><strong>Tanggal:</strong> ${new Date().toLocaleDateString()}</p>
        <table>
          <tr><th>Item</th><th>Jumlah</th><th>Harga</th></tr>
          <tr><td>Cuci Kering</td><td>2kg</td><td>Rp 20.000</td></tr>
          <tr><td>Setrika</td><td>1kg</td><td>Rp 10.000</td></tr>
        </table>
        <p><strong>Total:</strong> Rp 30.000</p>
      </body>
    </html>
  `;
};

// Fungsi untuk preview struk
export const previewReceipt = async () => {
  const html = generateReceiptHTML();
  await Print.printAsync({ html });
};

// Fungsi untuk membagikan struk (PDF)
export const shareReceipt = async () => {
  const html = generateReceiptHTML();
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
};

// Komponen screen default
const StrukPembayaranScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Struk Pembayaran</Text>
      <View style={styles.buttonContainer}>
        <Button title="Preview Struk" onPress={previewReceipt} />
        <Button title="Bagikan Struk" onPress={shareReceipt} />
      </View>
    </View>
  );
};

export default StrukPembayaranScreen;

// Gaya tampilan
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    gap: 20,
  },
});
