import React, { useState, useEffect, useRef } from 'react';
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
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { auth, db } from '../../config/private-config/config/firebaseConfig';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type Step = 0 | 1 | 2;

interface LaundryItem {
  service: string;
  weight: string;
  price: string;
  note: string;
}

interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
}

export default function LaundryFormScreen() {
  /* ───────────── step & order ───────────── */
  const [step, setStep] = useState<Step>(0);
  const [orderId, setOrderId] = useState<number | null>(null);

  /* ───────────── customer ───────────── */
  const [phoneText, setPhoneText] = useState('');
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [selectedCust, setSelectedCust] = useState<CustomerInfo | null>(null);
  const phoneInputRef = useRef<TextInput>(null);

  /* ───────────── tanggal ───────────── */
  const [inDate, setInDate] = useState<Date | null>(null);
  const [outDate, setOutDate] = useState<Date | null>(null);
  const [datePicker, setDatePicker] = useState({ open: false, which: 'in' as 'in' | 'out' });

  /* ───────────── layanan ───────────── */
  const [items, setItems] = useState<LaundryItem[]>([
    { service: '', weight: '', price: '', note: '' },
  ]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [openSvcIdx, setOpenSvcIdx] = useState<number | null>(null); // indeks card yg autocomplete terbuka

  /* ───────────── pembayaran ───────────── */
  const [pay, setPay] = useState<'cash' | 'qris' | 'transfer'>('qris');

  /* ───────────── ambil customers realtime ───────────── */
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const q = query(collection(db, 'customers'), where('ownerId', '==', u.uid));
    const unsub = onSnapshot(q, snap =>
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerInfo))),
    );
    return () => unsub();
  }, []);

  /* ───────────── ambil list layanan ───────────── */
  useEffect(() => {
    const colRef = collection(db, 'list_laundry');
    const unsub = onSnapshot(colRef, snap =>
      setServiceOptions(
        snap.docs.flatMap(d => {
          const data: any = d.data();
          if (Array.isArray(data.list)) return data.list as string[];
          if (typeof data.list === 'string') return [data.list];
          if (typeof data.name === 'string') return [data.name];
          return [];
        }),
      ),
    );
    return () => unsub();
  }, []);

  const filteredCust = customers.filter(c => c.phone.includes(phoneText.trim()));

  /* ───────────── helpers ───────────── */
  const totalHarga = items.reduce(
    (s, i) => s + parseFloat(i.price || '0') * parseFloat(i.weight || '0'),
    0,
  );

  const addService = () =>
    setItems([...items, { service: '', weight: '', price: '', note: '' }]);

  const updateItem = (idx: number, key: keyof LaundryItem, val: string) => {
    const arr = [...items];
    arr[idx][key] = val;
    setItems(arr);
  };

  /* date helpers */
  const openPicker = (which: 'in' | 'out') => setDatePicker({ open: true, which });
  const closePicker = () => setDatePicker(p => ({ ...p, open: false }));
  const onConfirmDate = (d: Date) => {
    datePicker.which === 'in' ? setInDate(d) : setOutDate(d);
    closePicker();
  };

  /* generate order id */
  useEffect(() => {
    if (step === 2 && !orderId) setOrderId(Date.now());
  }, [step, orderId]);

  /* ───────────── firestore save ───────────── */
  const saveOrder = async () => {
    if (!selectedCust) return alert('Pilih pelanggan terlebih dahulu!');
    if (!orderId) return alert('ID pesanan belum dibuat.');
    try {
      await setDoc(doc(db, 'orders', orderId.toString()), {
        orderNumber: orderId,
        customerId: selectedCust.id,
        customerName: selectedCust.name,
        phone: selectedCust.phone,
        inDate,
        outDate,
        items,
        total: totalHarga,
        payment: pay,
        ownerId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'customers', selectedCust.id), {
        totalOrders: increment(1),
      });
      alert('Pesanan tersimpan.');

      /* reset form */
      setStep(0);
      setOrderId(null);
      setSelectedCust(null);
      setPhoneText('');
      setInDate(null);
      setOutDate(null);
      setItems([{ service: '', weight: '', price: '', note: '' }]);
    } catch (e: any) {
      alert(e.message);
    }
  };

  /* export pdf */
  const exportToPdf = async () => {
    const html = `
      <html><body style="font-family:Arial;padding:24px;">
      <h2>Laundry Order #${orderId}</h2>
      <h3>Pelanggan</h3>
      <p><b>Nama:</b> ${selectedCust?.name}</p>
      <p><b>No. WA:</b> ${selectedCust?.phone}</p>
      <p><b>Tgl Masuk:</b> ${inDate?.toLocaleDateString()}</p>
      <p><b>Tgl Keluar:</b> ${outDate?.toLocaleDateString()}</p>
      <h3>Layanan</h3>
      ${items
        .map(
          it =>
            `<p>${it.service} – ${it.weight} × Rp${it.price} = Rp${(
              parseFloat(it.weight || '0') * parseFloat(it.price || '0')
            ).toLocaleString('id-ID')}</p>`,
        )
        .join('')}
      <h3>Total: Rp ${totalHarga.toLocaleString('id-ID')}</h3>
      <p><b>Metode Pembayaran:</b> ${pay === 'cash' ? 'Cash' : pay === 'qris' ? 'QRIS' : 'Transfer'}</p>
      </body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  /* ───────────── step 0: laundry ───────────── */
  const renderLaundryStep = () => (
    <KeyboardAwareScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
    >
      {/* nomor telepon + autocomplete */}
      <View style={styles.autoWrap}>
        <TextInput
          ref={phoneInputRef}
          style={styles.input}
          placeholder="Nomor Telepon / WhatsApp"
          value={selectedCust ? selectedCust.phone : phoneText}
          keyboardType="phone-pad"
          onChangeText={t => {
            setSelectedCust(null);
            setPhoneText(t);
          }}
          blurOnSubmit={false}
          returnKeyType="done"
        />

        {phoneText.length > 0 && !selectedCust && (
          <ScrollView style={styles.autoList} keyboardShouldPersistTaps="handled">
            {filteredCust.map(c => (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  setSelectedCust(c);
                  setPhoneText(c.phone);
                }}
              >
                <Text style={styles.autoItem}>{c.phone} · {c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* nama readonly */}
      <TextInput
        placeholder="Nama Pelanggan"
        style={styles.input}
        value={selectedCust ? selectedCust.name : ''}
        editable={false}
      />

      {/* tanggal */}
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

      {/* layanan list */}
      {items.map((it, i) => (
        <View key={i} style={[styles.card, { marginBottom: 16, backgroundColor: '#EAF4FF' }]}>
          <Text style={styles.cardTitle}>Layanan #{i + 1}</Text>

          {/* input + autocomplete layanan */}
          <View style={styles.autoWrap}>
            <TextInput
              style={styles.input}
              placeholder="Jenis Layanan"
              value={it.service}
              onChangeText={t => {
                updateItem(i, 'service', t);
                setOpenSvcIdx(i);
              }}
              onFocus={() => setOpenSvcIdx(i)}
              onBlur={() => setTimeout(() => setOpenSvcIdx(null), 150)}
            />

            {openSvcIdx === i && it.service.length > 0 && (
              <ScrollView style={styles.autoList} keyboardShouldPersistTaps="handled">
                {serviceOptions
                  .filter(opt => opt.toLowerCase().includes(it.service.toLowerCase()))
                  .map(opt => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        updateItem(i, 'service', opt);
                        setOpenSvcIdx(null);
                      }}
                    >
                      <Text style={styles.autoItem}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}
          </View>

          {/* kuantitas / harga */}
          <View style={styles.row}>
            <TextInput
              placeholder="Jumlah (Kg/Pcs)"
              style={[styles.numericInput, { flex: 1, marginRight: 6 }]}
              keyboardType="decimal-pad"
              value={it.weight}
              onChangeText={t => updateItem(i, 'weight', t)}
            />
            <TextInput
              placeholder="Harga Satuan"
              style={[styles.numericInput, { flex: 1, marginLeft: 6 }]}
              keyboardType="decimal-pad"
              value={it.price}
              onChangeText={t => updateItem(i, 'price', t)}
            />
            <TextInput
              placeholder="Subtotal (Rp)"
              style={[styles.readonlyInput, { flex: 1, marginLeft: 6, textAlign: 'center' }]}
              value={(parseFloat(it.weight || '0') * parseFloat(it.price || '0')).toLocaleString('id-ID')}
              editable={false}
            />
          </View>

          <TextInput
            placeholder="Catatan"
            style={[styles.input, { height: 70 }]}
            multiline
            value={it.note}
            onChangeText={t => updateItem(i, 'note', t)}
          />

          {i === items.length - 1 && (
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
    </KeyboardAwareScrollView>
  );

  /* ───────────── step 1: bayar ───────────── */
  const renderPaymentStep = () => (
    <View style={{ flex: 1, padding: 16 }}>
      <TouchableOpacity onPress={() => setStep(0)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Ionicons name="arrow-back" size={20} color="#007AFF" style={{ marginRight: 4 }} />
        <Text style={{ color: '#007AFF', fontSize: 16 }}>Kembali</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Detail Pelanggan</Text>
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Nama</Text><Text style={styles.detailValue}>{selectedCust?.name}</Text></View>
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Nomor</Text><Text style={styles.detailValue}>{selectedCust?.phone}</Text></View>
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Total</Text><Text style={styles.detailValue}>Rp {totalHarga.toLocaleString('id-ID')}</Text></View>
      </View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={{ fontWeight: 'bold', marginBottom: 12 }}>Metode Pembayaran</Text>
        {(['cash', 'qris', 'transfer'] as const).map(method => (
          <TouchableOpacity
            key={method}
            style={[styles.paymentOption, pay === method && styles.paymentOptionSelected]}
            onPress={() => setPay(method)}
          >
            <Ionicons
              name={method === 'cash' ? 'cash' : method === 'qris' ? 'qr-code-outline' : 'swap-horizontal-outline'}
              size={20}
              color="#555"
            />
            <Text style={styles.paymentText}>{method === 'cash' ? 'Cash' : method === 'qris' ? 'QRIS' : 'Transfer'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.btnNext, { marginTop: 20 }]} onPress={() => setStep(2)}>
        <Text style={styles.btnTxt}>Lanjut Review Pesanan</Text>
      </TouchableOpacity>
    </View>
  );

  /* ───────────── step 2: review ───────────── */
  const renderReviewStep = () => (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Review Pesanan</Text>

      <View style={styles.card}><Text style={styles.cardTitle}>Nomor Pesanan</Text><Text>{orderId}</Text></View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.cardTitle}>Pelanggan</Text>
        <Text>Nama: {selectedCust?.name}</Text>
        <Text>No. WA: {selectedCust?.phone}</Text>
        <Text>Tgl Masuk: {inDate?.toLocaleDateString()}</Text>
        <Text>Tgl Keluar: {outDate?.toLocaleDateString()}</Text>
      </View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.cardTitle}>Detail Layanan</Text>
        {items.map((it, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text>{it.service} · {it.weight}×Rp{it.price}</Text>
            <Text>
              Subtotal: Rp {(parseFloat(it.weight || '0') * parseFloat(it.price || '0')).toLocaleString('id-ID')}
            </Text>
            {it.note ? <Text>Catatan: {it.note}</Text> : null}
          </View>
        ))}
        <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Total: Rp {totalHarga.toLocaleString('id-ID')}</Text>
      </View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.cardTitle}>Metode Pembayaran</Text>
        <Text>{pay === 'cash' ? 'Cash' : pay === 'qris' ? 'QRIS' : 'Transfer'}</Text>
      </View>

      <TouchableOpacity style={[styles.btnNext, { marginTop: 20 }]} onPress={exportToPdf}>
        <Text style={styles.btnTxt}>Simpan ke PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btnNext, { marginTop: 12 }]} onPress={saveOrder}>
        <Text style={styles.btnTxt}>Simpan Pesanan</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  /* ───────────── render utama ───────────── */
  return (
    <View style={{ flex: 1, backgroundColor: '#F6FCFF' }}>
      <View style={styles.stepRow}>
        {['bag-add-outline', 'wallet', 'checkmark-done'].map((ic, i) => (
          <View key={ic} style={styles.stepItem}>
            <Ionicons name={ic as any} size={24} color={step >= i ? '#007AFF' : '#bbb'} />
            <Text style={[styles.stepLabel, step >= i && { color: '#007AFF' }]}>{['Laundry', 'Bayar', 'Review'][i]}</Text>
          </View>
        ))}
      </View>

      {step === 0 && renderLaundryStep()}
      {step === 1 && renderPaymentStep()}
      {step === 2 && renderReviewStep()}

      <DateTimePickerModal isVisible={datePicker.open} mode="date" onConfirm={onConfirmDate} onCancel={closePicker} />
    </View>
  );
}

/* ─────────────── styles ─────────────── */
const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
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
    color: '#000',
  },
  numericInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: '#000',
    textAlign: 'center',
  },
  readonlyInput: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: '#555',
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
  totalContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: { color: '#555' },
  detailValue: { fontWeight: 'bold', color: '#000' },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  paymentOptionSelected: { borderColor: '#007AFF', backgroundColor: '#EAF4FF' },
  paymentText: { marginLeft: 10, fontSize: 16, color: '#000' },

  /* autocomplete */
  autoWrap: { position: 'relative', marginBottom: 12 },
  autoList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    zIndex: 20,
  },
  autoItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
