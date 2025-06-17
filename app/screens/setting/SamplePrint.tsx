import React from 'react';
import { Alert, Platform } from 'react-native';
import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';
import { Timestamp } from 'firebase/firestore';

const formatDate = (timestamp: Timestamp | string | undefined) => {
  if (!timestamp) return '-';
  try {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  } catch {
    return '-';
  }
};

const formatNumber = (value: string | number) => {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  return `Rp${(number || 0).toLocaleString('id-ID')}`;
};

export const printReceipt = async (orderData: any) => {
  if (Platform.OS === 'ios') {
    Alert.alert('iOS Warning', 'iOS tidak mendukung cetak struk dari metode ini.', [{ text: 'OK' }]);
    return;
  }

  try {
    const columnWidths = [5, 15, 12];
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('\r\nIFA CELL & LAUNDRY\r\n', { widthtimes: 2, heigthtimes: 2 });
    await BluetoothEscposPrinter.printColumn([30], [BluetoothEscposPrinter.ALIGN.CENTER], [
      'Jl. Bumi Tamalanrea Permai No.18,\nTamalanrea, Kota Makassar, 90245',
    ], {});
    await BluetoothEscposPrinter.printText('================================\r\n', {});

    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Customer', orderData.customerName], {});
    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Telp', orderData.phone || '-'], {});
    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Tanggal Masuk', formatDate(orderData.inDate)], {});
    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Tanggal Keluar', formatDate(orderData.outDate)], {});

    await BluetoothEscposPrinter.printText('================================\r\n', {});
    await BluetoothEscposPrinter.printText('Pesanan:\r\n', { widthtimes: 1 });

    for (const item of orderData.items || []) {
      const service = item.service;
      const weight = parseFloat(item.weight || '0');
      const price = parseFloat(item.price || '0');
      const note = item.note || '';

      const line = `${weight}kg ${service}`;
      await BluetoothEscposPrinter.printColumn(columnWidths, [0, 0, 2], ['1x', line, formatNumber(price)], {});
      if (note) {
        await BluetoothEscposPrinter.printText(`  - ${note}\r\n`, {});
      }
    }

    await BluetoothEscposPrinter.printText('================================\r\n', {});
    const subtotal = (orderData.total || 0) + (orderData.discount || 0);
    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Subtotal', formatNumber(subtotal)], {});

    if (orderData.discount && orderData.discount > 0) {
      await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Diskon', formatNumber(orderData.discount)], {});
    }

    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Total', formatNumber(orderData.total)], {});
    await BluetoothEscposPrinter.printText(`\nMetode Bayar: ${orderData.payment || '-'}\n`, {});

    await BluetoothEscposPrinter.printText('\r\nTerima kasih telah menggunakan layanan kami.\r\n\r\n', {
      widthtimes: 1,
    });
    await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
  } catch (e: any) {
    Alert.alert('Error', e.message || 'Terjadi kesalahan saat mencetak.');
  }
};

export const printOwnerReceipt = async (orderData: any) => {
  if (Platform.OS === 'ios') {
    Alert.alert('iOS Warning', 'iOS tidak mendukung cetak struk dari metode ini.', [{ text: 'OK' }]);
    return;
  }

  try {
    const columnWidths = [5, 15, 12];
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('\r\nSALINAN UNTUK OWNER\r\n', { widthtimes: 1, heigthtimes: 1 });
    await BluetoothEscposPrinter.printText('IFA CELL & LAUNDRY\r\n', { widthtimes: 2, heigthtimes: 2 });
    await BluetoothEscposPrinter.printText('================================\r\n', {});

    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Customer', orderData.customerName], {});
    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Telp', orderData.phone || '-'], {});
    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Tgl Masuk', formatDate(orderData.inDate)], {});
    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Tgl Keluar', formatDate(orderData.outDate)], {});

    await BluetoothEscposPrinter.printText('================================\r\n', {});
    for (const item of orderData.items || []) {
      const service = item.service;
      const weight = parseFloat(item.weight || '0');
      const price = parseFloat(item.price || '0');
      const note = item.note || '';

      const line = `${weight}kg ${service}`;
      await BluetoothEscposPrinter.printColumn(columnWidths, [0, 0, 2], ['1x', line, formatNumber(price)], {});
      if (note) {
        await BluetoothEscposPrinter.printText(`  - ${note}\r\n`, {});
      }
    }

    await BluetoothEscposPrinter.printText('================================\r\n', {});
    await BluetoothEscposPrinter.printColumn([15, 15], [0, 2], ['Total', formatNumber(orderData.total)], {});
    await BluetoothEscposPrinter.printText('\r\nDicetak oleh sistem Laundry\r\n\r\n', { widthtimes: 1 });
    await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
  } catch (e: any) {
    Alert.alert('Error (Owner)', e.message || 'Gagal mencetak salinan owner');
  }
};
