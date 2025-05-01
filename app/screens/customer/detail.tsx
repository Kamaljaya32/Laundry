import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../../config/private-config/config/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { customerDetailStyles as s } from './styles/customerDetailStyles';

/* ──────────────────── types ──────────────────── */
interface Cust {
  name: string;
  phone: string;
  totalOrders: number;
}

interface Order {
  id: string;
  orderNumber: number;
  inDate: any;    
  outDate: any;   
  total: number;
  payment: 'cash' | 'qris' | 'transfer';
}

/* ──────────────────── component ──────────────── */
export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<Cust | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  /* ── ambil data customer ── */
  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, 'customers', id));
      if (!snap.exists()) {
        Alert.alert('Error', 'Customer tidak ditemukan');
        router.back();
        return;
      }
      setData(snap.data() as Cust);
    })();
  }, [id]);

  /* ── ambil order customer ── */
  useEffect(() => {
    if (!id) return;
    (async () => {
      const q = query(collection(db, 'orders'), where('customerId', '==', id));
      const snap = await getDocs(q);
      const list: Order[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      setOrders(list.sort((a, b) => b.orderNumber - a.orderNumber)); // urut terbaru
    })();
  }, [id]);

  if (!data) return null;

  return (
    <ScrollView contentContainerStyle={s.container}>
      {/* ── profil ── */}
      <Text style={s.label}>Nama</Text>
      <Text style={s.value}>{data.name}</Text>

      <Text style={s.label}>Telepon</Text>
      <Text style={s.value}>{data.phone}</Text>

      <View style={s.badge}>
        <Ionicons name="cart-outline" size={16} color="#0066FF" style={{ marginRight: 4 }} />
        <Text style={s.badgeTxt}>{data.totalOrders} Order</Text>
      </View>

      {/* ── daftar pesanan ── */}
      <Text style={[s.label, { marginTop: 24 }]}>Riwayat Pesanan</Text>

      {orders.length === 0 ? (
        <Text style={s.emptyText}>Belum ada pesanan.</Text>
      ) : (
        orders.map((o) => (
          <View key={o.id} style={s.orderCard}>
            <View style={s.orderRow}>
              <Text style={s.orderKey}>No. Pesanan</Text>
              <Text style={s.orderVal}>{o.orderNumber}</Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderKey}>Tanggal Masuk</Text>
              <Text style={s.orderVal}>
                {new Date(o.inDate.seconds * 1000).toLocaleDateString()}
              </Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderKey}>Tanggal Keluar</Text>
              <Text style={s.orderVal}>
                {new Date(o.outDate.seconds * 1000).toLocaleDateString()}
              </Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderKey}>Total</Text>
              <Text style={s.orderVal}>Rp {o.total.toLocaleString('id-ID')}</Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderKey}>Pembayaran</Text>
              <Text style={s.orderVal}>
                {o.payment === 'cash' ? 'Cash' : o.payment === 'qris' ? 'QRIS' : 'Transfer'}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
