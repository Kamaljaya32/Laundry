import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Customer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
}

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<Customer, 'id'>),
          } as Customer),
      );
      setCustomers(list);
    });
    return unsub;
  }, []);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search),
      ),
    [customers, search],
  );

  const renderItem = ({ item }: { item: Customer }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.phone}>{item.phone}</Text>

      <View style={styles.badge}>
        <Text style={styles.badgeTxt}>{item.totalOrders} Order</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Cari nama pelanggan / No. telp…"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1 }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6FCFF', padding: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  name: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  phone: { color: '#666' },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E6F0FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTxt: { color: '#0066FF', fontWeight: '600', fontSize: 12 },
});
