import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../config/private-config/config/firebaseConfig'
import { useRouter } from 'expo-router';
import { inventoryStyles } from './styles/inventoryStyles';

interface Item {
  id: string;
  name: string;
  stock: number;
  photoUrl?: string;
}

const CARD_W = Dimensions.get('screen').width / 2 - 24;

export default function InventoryScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'inventory'),
      where('ownerId', '==', user.uid)
    );

    const unsub = onSnapshot(q, snap =>
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Item,'id'>) })))
    );
    return () => unsub();
  }, []);

  const handleAdd = () => {
    router.push('/screens/inventory/add');
  };

  const handleEdit = (item: Item) => {
    router.push({
      pathname: '/screens/inventory/edit/[id]',
      params: { id: item.id },
    });
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View style={inventoryStyles.card}>
      {item.photoUrl && <Image source={{ uri: item.photoUrl }} style={inventoryStyles.img} />}

      <TouchableOpacity style={inventoryStyles.editBtn} onPress={() => handleEdit(item)}>
        <Ionicons name="pencil" size={20} color="#007AFF" />
      </TouchableOpacity>

      <Text numberOfLines={2} style={inventoryStyles.name}>{item.name}</Text>
      <Text style={inventoryStyles.stock}>Jumlah: {item.stock}</Text>
    </View>
  );

  return (
    <View style={inventoryStyles.wrapper}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={inventoryStyles.row}
        contentContainerStyle={inventoryStyles.list}
      />
      <TouchableOpacity style={inventoryStyles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

