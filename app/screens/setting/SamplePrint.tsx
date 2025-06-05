import React from 'react';
import { Button, StyleSheet, Text, View, Alert, Platform } from 'react-native';
import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';

const SamplePrint: React.FC = () => {
  const printBarCode = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iOS Warning',
        'iOS does not support printing receipts with this method. Please use the Android version.',
        [{ text: 'OK' }]
      );
    }
    try {
      await BluetoothEscposPrinter.printBarCode(
        '123456789012',
        BluetoothEscposPrinter.BARCODETYPE.JAN13,
        3,
        120,
        0,
        2
      );
      await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unknown error');
    }
  };

  const printQRCode = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iOS Warning',
        'iOS does not support printing receipts with this method. Please use the Android version.',
        [{ text: 'OK' }]
      );
    }
    try {
      await BluetoothEscposPrinter.printQRCode(
        'https://hsd.co.id',
        280,
        BluetoothEscposPrinter.ERROR_CORRECTION.L
      );
      await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unknown error');
    }
  };

  const printUnderLine = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iOS Warning',
        'iOS does not support printing receipts with this method. Please use the Android version.',
        [{ text: 'OK' }]
      );
    }
    try {
      await BluetoothEscposPrinter.printerUnderLine(2);
      await BluetoothEscposPrinter.printText('Prawito Hudoro\r\n', {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      });
      await BluetoothEscposPrinter.printerUnderLine(0);
      await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unknown error');
    }
  };

  const printReceipt = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iOS Warning',
        'iOS does not support printing receipts with this method. Please use the Android version.',
        [{ text: 'OK' }]
      );
    }
    const columnWidths = [5, 15, 12];
    try {
      await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
      await BluetoothEscposPrinter.printText('TOKO LAUT SEGAR\r\n', { widthtimes: 1, heigthtimes: 2 });
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printColumn([30], [BluetoothEscposPrinter.ALIGN.CENTER], ['Jl. Brigjen Saptadji Hadiprawira No.93'], {});
      await BluetoothEscposPrinter.printColumn([32], [BluetoothEscposPrinter.ALIGN.CENTER], ['https://xfood.id'], {});
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printColumn([15, 15], [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['Customer', 'Prawito Hudoro'], {});
      await BluetoothEscposPrinter.printColumn([15, 15], [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['Packaging', 'Iya'], {});
      await BluetoothEscposPrinter.printColumn([15, 15], [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['Delivery', 'Ambil Sendiri'], {});
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printText('Products\r\n', { widthtimes: 1 });
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printColumn(columnWidths, [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['1x', 'Cumi-Cumi', 'Rp.200.000'], {});
      await BluetoothEscposPrinter.printColumn(columnWidths, [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['1x', 'Tongkol Kering', 'Rp.300.000'], {});
      await BluetoothEscposPrinter.printColumn(columnWidths, [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['1x', 'Ikan Tuna', 'Rp.400.000'], {});
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printColumn([15, 15], [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['Subtotal', 'Rp.900.000'], {});
      await BluetoothEscposPrinter.printColumn([15, 15], [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['Packaging', 'Rp.6.000'], {});
      await BluetoothEscposPrinter.printColumn([15, 15], [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['Delivery', 'Rp.0'], {});
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printColumn([15, 15], [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['Total', 'Rp.906.000'], {});
      await BluetoothEscposPrinter.printText('\r\n\r\n', {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printQRCode('DP0837849839', 280, BluetoothEscposPrinter.ERROR_CORRECTION.L);
      await BluetoothEscposPrinter.printColumn([30], [BluetoothEscposPrinter.ALIGN.CENTER], ['DP0837849839'], { widthtimes: 2 });
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printColumn([32], [BluetoothEscposPrinter.ALIGN.CENTER], ['Sabtu, 18 Juni 2022 - 06:00 WIB'], {});
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
      await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});

    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unknown error');
    }
  };

  const printOwnerReceipt = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iOS Warning',
        'iOS does not support printing receipts with this method. Please use the Android version.',
        [{ text: 'OK' }]
      );
    }
    const columnWidths = [5, 15, 12];
    try {
      await BluetoothEscposPrinter.printText('COPY UNTUK OWNER\r\n\r\n', { widthtimes: 1 });
      await BluetoothEscposPrinter.printText('TOKO LAUT SEGAR\r\n', { widthtimes: 1, heigthtimes: 2 });
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printColumn([30], [BluetoothEscposPrinter.ALIGN.CENTER], ['Jl. Brigjen Saptadji Hadiprawira No.93'], {});
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printColumn([15, 15], [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['Customer', 'Prawito Hudoro'], {});
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printText('Products\r\n', { widthtimes: 1 });
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printColumn(columnWidths, [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['1x', 'Cumi-Cumi', 'Rp.200.000'], {});
      await BluetoothEscposPrinter.printColumn(columnWidths, [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['1x', 'Tongkol Kering', 'Rp.300.000'], {});
      await BluetoothEscposPrinter.printColumn(columnWidths, [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['1x', 'Ikan Tuna', 'Rp.400.000'], {});
      await BluetoothEscposPrinter.printText('================================', {});
      await BluetoothEscposPrinter.printColumn([15, 15], [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], ['Total', 'Rp.906.000'], {});
      await BluetoothEscposPrinter.printText('\r\nTerima kasih telah berbelanja!\r\n', {});
      await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});


    } catch (e: any) {
      Alert.alert('Error (Owner Copy)', e.message || 'Unknown error');
    }
  };

  return (
    <View>
      <Text>Sample Print Instruction</Text>
      <View style={styles.btn}>
        <Button onPress={printBarCode} title="Print BarCode" />
      </View>
      <View style={styles.btn}>
        <Button onPress={printQRCode} title="Print QRCode" />
      </View>
      <View style={styles.btn}>
        <Button onPress={printUnderLine} title="Print UnderLine" />
      </View>
      <View style={styles.btn}>
        <Button onPress={printReceipt} title="Print Struk Belanja" />
      </View>
      <View style={styles.btn}>
        <Button onPress={printOwnerReceipt} title="Print Struk Owner" />
      </View>
    </View>
  );
};

export default SamplePrint;

const styles = StyleSheet.create({
  btn: {
    marginBottom: 8,
  },
});
