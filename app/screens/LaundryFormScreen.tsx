import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function LaundryFormScreen() {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [inDate, setInDate] = useState<Date | null>(null);
  const [outDate, setOutDate] = useState<Date | null>(null);
  const [service, setService] = useState('');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');


  const [datePicker, setDatePicker] = useState<{
    open: boolean;
    which: 'in' | 'out';
  }>({ open: false, which: 'in' });

  const openPicker = (which: 'in' | 'out') => setDatePicker({ open: true, which });
  const closePicker = () => setDatePicker({ open: false, which: 'in' });
  const onConfirm = (date: Date) => {
    datePicker.which === 'in' ? setInDate(date) : setOutDate(date);
    closePicker();
  };

  const renderStepIndicator = () => {
    const labels = ['Laundry', 'Bayar', 'Review'];
    const icons = ['washer', 'wallet', 'checkmark-done'];
    return (
      <View style={styles.stepRow}>
        {labels.map((l, i) => (
          <View key={l} style={styles.stepItem}>
            <Ionicons
              name={icons[i] as any}
              size={24}
              color={step >= i ? '#007AFF' : '#bbb'}
            />
            <Text style={[styles.stepLabel, step >= i && { color: '#007AFF' }]}>
              {l}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLaundryStep = () => (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <TextInput
        placeholder="Nama Pelanggan"
        style={styles.input}
        value={customer}
        onChangeText={setCustomer}
      />
      <TextInput
        placeholder="Nomor Telepon / Whatsapp"
        style={styles.input}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <View style={styles.row}>
        <TouchableOpacity style={[styles.input, { flex: 1, marginRight: 6 }]} onPress={() => openPicker('in')}>
          <Text style={{ color: inDate ? '#000' : '#888' }}>
            {inDate ? inDate.toLocaleDateString() : 'Tanggal Masuk'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.input, { flex: 1, marginLeft: 6 }]} onPress={() => openPicker('out')}>
          <Text style={{ color: outDate ? '#000' : '#888' }}>
            {outDate ? outDate.toLocaleDateString() : 'Tanggal Keluar'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Layanan #1</Text>

        <TextInput
          placeholder="Jenis Layanan (cth. Cuci Setrika)"
          style={styles.input}
          value={service}
          onChangeText={setService}
        />
        <TextInput
          placeholder="Berat (Kg)"
          style={styles.input}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          placeholder="Catatan"
          style={[styles.input, { height: 80 }]}
          multiline
          value={note}
          onChangeText={setNote}
        />
      </View>

      <TouchableOpacity style={styles.btnNext} onPress={() => setStep(1)}>
        <Text style={styles.btnTxt}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // untuk step2
  return (
    <View style={{ flex: 1, backgroundColor: '#F6FCFF' }}>
      {renderStepIndicator()}
      {step === 0 && renderLaundryStep()}

      <DateTimePickerModal
        isVisible={datePicker.open}
        mode="date"
        onConfirm={onConfirm}
        onCancel={closePicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  stepItem: { alignItems: 'center' },
  stepLabel: { fontSize: 12, marginTop: 4, color: '#bbb' },

  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', marginBottom: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  cardTitle: { fontWeight: 'bold', marginBottom: 12, fontSize: 16 },

  btnNext: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnTxt: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
