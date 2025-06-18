import React from 'react';
import { Alert, Platform, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';
import { Timestamp } from 'firebase/firestore';

/* ───────── UTIL ───────── */
const safe = (v: any): string =>
  v === undefined || v === null ? '-' : String(v);

const formatDate = (ts?: Timestamp | Date | string | null) => {
  if (!ts) return '-';
  const d =
    ts instanceof Timestamp ? ts.toDate() :
    ts instanceof Date       ? ts :
    new Date(ts);
  return d.toLocaleString('id-ID');
};

const toNumber = (v: any) => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const formatCurrency = (v: any) =>
  `Rp${toNumber(v).toLocaleString('id-ID')}`;

/* ───────── CETAK CUSTOMER ───────── */
export const printReceipt = async (order: any) => {
  if (Platform.OS === 'ios') {
    Alert.alert('iOS Warning','Printer ESC/POS tidak didukung di iOS.',[{text:'OK'}]);
    return;
  }

  try {
    const col = [3, 17, 12]; // Total 32 karakter

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('\r\nIFA CELL & LAUNDRY\r\n', { widthtimes: 1, heigthtimes: 2 });
    await BluetoothEscposPrinter.printText('Jl. BTP No.18, Tamalanrea\r\nMakassar\r\n', {});
    await BluetoothEscposPrinter.printText('================================\r\n', {}); // 32 "="

    // HEADER
    const headerFields = [
      ['Order ID:', safe(order.orderNumber)],
      ['Customer:', safe(order.customerName)],
      ['No.Telp:', safe(order.phone)],
      ['Tgl Masuk:', formatDate(order.inDate)],
      ['Tgl Keluar:', formatDate(order.outDate)],
    ];
    for (const [label, value] of headerFields) {
      await BluetoothEscposPrinter.printColumn(
        [12, 20],
        [0, 0],
        [label, value],
        {},
      );
    }

    await BluetoothEscposPrinter.printText('================================\r\n', {});
    await BluetoothEscposPrinter.printText('Layanan\r\n', {});

    // DETAIL ITEM
    for (const it of order.items ?? []) {
      await BluetoothEscposPrinter.printColumn(
        col,
        [0, 0, 2],
        [
          '1x',
          `${toNumber(it.weight)}${it.unit === 'pcs' ? 'pcs' : 'kg'} ${safe(it.service)}`,
          formatCurrency(it.price),
        ],
        {},
      );
      if (it.note) {
        await BluetoothEscposPrinter.printText(`   cat:${safe(it.note)}\r\n`, {});
      }
    }

    await BluetoothEscposPrinter.printText('================================\r\n', {});

    // DISKON & TOTAL
    if (toNumber(order.discount) > 0) {
      await BluetoothEscposPrinter.printColumn(
        [20, 12],
        [0, 2],
        ['Diskon', `- ${formatCurrency(order.discount)}`],
        {},
      );
    }

    await BluetoothEscposPrinter.printColumn(
      [20, 12],
      [0, 2],
      ['Total', formatCurrency(order.total)],
      {},
    );

    await BluetoothEscposPrinter.printText(`\nPembayaran: ${safe(order.payment)}\n`, {});
    await BluetoothEscposPrinter.printText('\r\nTerima kasih!\r\n\r\n\r\n', {});
  } catch (err: any) {
    Alert.alert('Print Error', String(err?.message ?? err));
  }
};

/* ───────── CETAK OWNER ───────── (jika ingin salinan) */
export const printOwnerReceipt = async (order: any) => {
  /* bisa panggil printReceipt(order) dengan layout berbeda bila perlu */
  await printReceipt(order);
};

/* ───────── WRAPPER UI ───────── */
type Props = { orderData?: any };

const SamplePrint: React.FC<Props> = ({ orderData }) => {
  if (!orderData) {
    return (
      <View style={styles.container}>
        <Text style={styles.notice}>Data pesanan belum tersedia.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button,{backgroundColor:'#007AFF'}]}
        onPress={() => printReceipt(orderData)}
      >
        <Text style={styles.btnText}>Cetak Struk Customer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button,{backgroundColor:'#28A745',marginTop:8}]}
        onPress={() => printOwnerReceipt(orderData)}
      >
        <Text style={styles.btnText}>Cetak Struk Owner</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SamplePrint;

/* ───────── STYLE ───────── */
const styles = StyleSheet.create({
  container:{alignItems:'center',marginTop:16},
  button:{borderRadius:12,paddingVertical:14,paddingHorizontal:24,alignSelf:'stretch',justifyContent:'center',alignItems:'center'},
  btnText:{color:'#fff',fontWeight:'600',fontSize:15},
  notice:{fontStyle:'italic',color:'#777'},
});
