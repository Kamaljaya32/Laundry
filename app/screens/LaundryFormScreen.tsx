import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface LaundryItem {
  service: string;
  weight: string;
  price: string;
  note: string;
}

export default function LaundryFormScreen() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [inDate, setInDate] = useState<Date | null>(null);
  const [outDate, setOutDate] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('qris');
  const [items, setItems] = useState<LaundryItem[]>([{
    service: '',
    weight: '',
    price: '',
    note: ''
  }]);
  const [datePicker, setDatePicker] = useState({ open: false, which: 'in' as 'in' | 'out' });

  const openPicker = (which: 'in' | 'out') => setDatePicker({ open: true, which });
  const closePicker = () => setDatePicker({ ...datePicker, open: false });
  const onConfirm = (date: Date) => {
    if (datePicker.which === 'in') setInDate(date);
    else setOutDate(date);
    closePicker();
  };

  const addService = () => {
    setItems([...items, { service: '', weight: '', price: '', note: '' }]);
  };

  const updateItem = (index: number, key: keyof LaundryItem, value: string) => {
    const updated = [...items];
    updated[index][key] = value;
    setItems(updated);
  };

  const renderStepIndicator = () => {
    const labels = ['Laundry', 'Bayar', 'Review'];
    const icons = ['washer', 'wallet', 'checkmark-done'];
    return (
      <View style={styles.stepRow}>
        {labels.map((label, i) => (
          <View key={label} style={styles.stepItem}>
            <Ionicons
              name={icons[i] as any}
              size={24}
              color={step >= i ? '#007AFF' : '#bbb'}
            />
            <Text style={[styles.stepLabel, step >= i && { color: '#007AFF' }]}>{label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLaundryStep = () => {
    const totalHarga = items.reduce(
      (sum, item) => sum + parseFloat(item.price || '0') * parseFloat(item.weight || '0'),
      0
    );

    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <TextInput placeholder="Nama Pelanggan" style={styles.input} value={customer} onChangeText={setCustomer} />
        <TextInput placeholder="Nomor Telepon / Whatsapp" style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <View style={styles.row}>
          <TouchableOpacity style={[styles.input, { flex: 1, marginRight: 6 }]} onPress={() => openPicker('in')}>
            <Text style={{ color: inDate ? '#000' : '#888' }}>{inDate ? inDate.toLocaleDateString() : 'Tanggal Masuk'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.input, { flex: 1, marginLeft: 6 }]} onPress={() => openPicker('out')}>
            <Text style={{ color: outDate ? '#000' : '#888' }}>{outDate ? outDate.toLocaleDateString() : 'Tanggal Keluar'}</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <View key={index} style={[styles.card, { marginBottom: 16, backgroundColor: '#EAF4FF' }]}>
            <Text style={styles.cardTitle}>Layanan #{index + 1}</Text>
            <TextInput placeholder="Jenis Layanan" style={styles.input} value={item.service} onChangeText={(text) => updateItem(index, 'service', text)} />
            <View style={styles.row}>
              <TextInput placeholder="Jumlah (Kg/Pcs)" style={[styles.input, { flex: 1, marginRight: 6 }]} keyboardType="decimal-pad" value={item.weight} onChangeText={(text) => updateItem(index, 'weight', text)} />
              <TextInput placeholder="Harga Satuan" style={[styles.input, { flex: 1, marginLeft: 6 }]} keyboardType="decimal-pad" value={item.price} onChangeText={(text) => updateItem(index, 'price', text)} />
              <TextInput placeholder="Jumlah (Rp)" style={[styles.readonlyInput, { flex: 1, marginLeft: 6 }]} value={(parseFloat(item.weight || '0') * parseFloat(item.price || '0')).toLocaleString('id-ID')} editable={false} />
            </View>
            <TextInput placeholder="Catatan" style={[styles.input, { height: 70 }]} multiline value={item.note} onChangeText={(text) => updateItem(index, 'note', text)} />
            {index === items.length - 1 && (
              <TouchableOpacity onPress={addService} style={{ marginTop: 8 }}>
                <Text style={{ color: '#007AFF', textAlign: 'center' }}>+ Tambah Layanan</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.totalContainer}>
          <Text style={{ fontWeight: 'bold' }}>Estimasi Total :</Text>
          <Text style={{ fontWeight: 'bold' }}>Rp {totalHarga.toLocaleString('id-ID')}</Text>
        </View>

        <TouchableOpacity style={styles.btnNext} onPress={() => setStep(1)}>
          <Text style={styles.btnTxt}>Lanjut Pembayaran</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderPaymentStep = () => {
    const totalHarga = items.reduce(
      (sum, item) => sum + parseFloat(item.price || '0') * parseFloat(item.weight || '0'),
      0
    );

    return (
      <View style={{ padding: 16, flex: 1 }}>
        <TouchableOpacity onPress={() => setStep(0)} style={{ marginBottom: 20 }}>
          <Text style={{ color: '#007AFF', fontSize: 16 }}>{'← Kembali ke Laundry'}</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Detail Pelanggan</Text>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Nama</Text><Text style={styles.detailValue}>{customer}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Nomor</Text><Text style={styles.detailValue}>{phone}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Total</Text><Text style={styles.detailValue}>Rp {totalHarga.toLocaleString('id-ID')}</Text></View>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={{ fontWeight: 'bold', marginBottom: 12 }}>Metode Pembayaran</Text>
          {['cash', 'qris', 'transfer'].map((method) => (
            <TouchableOpacity key={method} style={[styles.paymentOption, paymentMethod === method && styles.paymentOptionSelected]} onPress={() => setPaymentMethod(method as any)}>
              <Ionicons name={method === 'cash' ? 'cash' : method === 'qris' ? 'qr-code-outline' : 'swap-horizontal-outline'} size={20} color="#555" />
              <Text style={styles.paymentText}>{method === 'cash' ? 'Cash' : method === 'qris' ? 'QRIS' : 'Transfer'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#d00', marginTop: 12 }}>* Pilih metode pembayaran sesuai keinginan customer</Text>
        <TouchableOpacity style={[styles.btnNext, { marginTop: 20 }]} onPress={() => setStep(2)}>
          <Text style={styles.btnTxt}>Lanjut Review Pesanan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderReviewStep = () => {
    const totalHarga = items.reduce(
      (sum, item) => sum + parseFloat(item.price || '0') * parseFloat(item.weight || '0'),
      0
    );

    return (
      <ScrollView style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Review Pesanan</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pelanggan</Text>
          <Text>Nama: {customer}</Text>
          <Text>Nomor WA: {phone}</Text>
          <Text>Tanggal Masuk: {inDate?.toLocaleDateString()}</Text>
          <Text>Tanggal Keluar: {outDate?.toLocaleDateString()}</Text>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Detail Layanan</Text>
          {items.map((item, index) => (
            <View key={index} style={{ marginBottom: 12 }}>
              <Text>Layanan: {item.service}</Text>
              <Text>Jumlah: {item.weight} Kg/Pcs</Text>
              <Text>Harga Satuan: Rp {item.price}</Text>
              <Text>Total: Rp {(parseFloat(item.weight || '0') * parseFloat(item.price || '0')).toLocaleString('id-ID')}</Text>
              {item.note ? <Text>Catatan: {item.note}</Text> : null}
            </View>
          ))}
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Total Semua: Rp {totalHarga.toLocaleString('id-ID')}</Text>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Metode Pembayaran</Text>
          <Text>{paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'qris' ? 'QRIS' : 'Transfer'}</Text>
        </View>

        <TouchableOpacity style={[styles.btnNext, { marginTop: 20 }]} onPress={() => setStep(0)}>
          <Text style={styles.btnTxt}>Kembali ke Awal</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F6FCFF' }}>
      {renderStepIndicator()}
      {step === 0 && renderLaundryStep()}
      {step === 1 && renderPaymentStep()}
      {step === 2 && renderReviewStep()}

      <DateTimePickerModal isVisible={datePicker.open} mode="date" onConfirm={onConfirm} onCancel={closePicker} />
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, backgroundColor: '#fff', elevation: 2 },
  stepItem: { alignItems: 'center' },
  stepLabel: { fontSize: 12, marginTop: 4, color: '#bbb' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, color: '#000' },
  readonlyInput: { backgroundColor: '#f2f2f2', borderRadius: 10, padding: 12, marginBottom: 12, color: '#555' },
  row: { flexDirection: 'row', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  cardTitle: { fontWeight: 'bold', marginBottom: 12, fontSize: 16 },
  btnNext: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnTxt: { color: '#fff', fontWeight: '600', fontSize: 16 },
  totalContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { color: '#555' },
  detailValue: { fontWeight: 'bold', color: '#000' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 10 },
  paymentOptionSelected: { borderColor: '#007AFF', backgroundColor: '#EAF4FF' },
  paymentText: { marginLeft: 10, fontSize: 16, color: '#000' },
});