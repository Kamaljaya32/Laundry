import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../config/private-config/config/firebaseConfig';
import { useRouter } from 'expo-router';

interface Item {
  id: string;
  name: string;
  stock: number;
  photoUrl?: string;
}

export default function InventoryScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const numColumns = isLandscape ? 4 : 2;

  const totalHorzPadding = 12 * 2;
  const totalGaps = (numColumns - 1) * 12;
  const cardWidth = (width - totalHorzPadding - totalGaps) / numColumns;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, 'inventory'),
      where('ownerId', '==', user.uid)
    );
    const unsub = onSnapshot(q, snap =>
      setItems(
        snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Item, 'id'>),
        }))
      )
    );
    return () => unsub();
  }, []);

  const handleAdd = () => router.push('/screens/inventory/add');
  const handleEdit = (item: Item) =>
    router.push({
      pathname: '/screens/inventory/edit/[id]',
      params: { id: item.id },
    });

  const renderItem = ({ item }: { item: Item }) => (
    <View style={[styles.card, { width: cardWidth }]}>
      {item.photoUrl && (
        <Image source={{ uri: item.photoUrl }} style={styles.img} />
      )}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => handleEdit(item)}
      >
        <Ionicons name="pencil" size={20} color="#007AFF" />
      </TouchableOpacity>
      <Text numberOfLines={2} style={styles.name}>
        {item.name}
      </Text>
      <Text style={styles.stock}>Jumlah: {item.stock}</Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        key={String(numColumns)}              
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F6FCFF',
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D6EBFF',
    position: 'relative',
    overflow: 'hidden',
  },
  img: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 8,
  },
  editBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 4,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center'
  },
  stock: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});

//kode lama untuk backup

// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Dimensions,
//   TouchableOpacity,
//   Image,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { collection, query, where, onSnapshot } from 'firebase/firestore';
// import { auth, db } from '../../../config/private-config/config/firebaseConfig'
// import { useRouter } from 'expo-router';
// import { inventoryStyles } from './styles/inventoryStyles';

// interface Item {
//   id: string;
//   name: string;
//   stock: number;
//   photoUrl?: string;
// }

// const CARD_W = Dimensions.get('screen').width / 2 - 24;

// export default function InventoryScreen() {
//   const [items, setItems] = useState<Item[]>([]);
//   const router = useRouter();

//   useEffect(() => {
//     const user = auth.currentUser;
//     if (!user) return;

//     const q = query(
//       collection(db, 'inventory'),
//       where('ownerId', '==', user.uid)
//     );

//     const unsub = onSnapshot(q, snap =>
//       setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Item,'id'>) })))
//     );
//     return () => unsub();
//   }, []);

//   const handleAdd = () => {
//     router.push('/screens/inventory/add');
//   };

//   const handleEdit = (item: Item) => {
//     router.push({
//       pathname: '/screens/inventory/edit/[id]',
//       params: { id: item.id },
//     });
//   };

//   const renderItem = ({ item }: { item: Item }) => (
//     <View style={inventoryStyles.card}>
//       {item.photoUrl && <Image source={{ uri: item.photoUrl }} style={inventoryStyles.img} />}

//       <TouchableOpacity style={inventoryStyles.editBtn} onPress={() => handleEdit(item)}>
//         <Ionicons name="pencil" size={20} color="#007AFF" />
//       </TouchableOpacity>

//       <Text numberOfLines={2} style={inventoryStyles.name}>{item.name}</Text>
//       <Text style={inventoryStyles.stock}>Jumlah: {item.stock}</Text>
//     </View>
//   );

//   return (
//     <View style={inventoryStyles.wrapper}>
//       <FlatList
//         data={items}
//         keyExtractor={i => i.id}
//         renderItem={renderItem}
//         numColumns={2}
//         columnWrapperStyle={inventoryStyles.row}
//         contentContainerStyle={inventoryStyles.list}
//       />
//       <TouchableOpacity style={inventoryStyles.fab} onPress={handleAdd}>
//         <Ionicons name="add" size={28} color="#fff" />
//       </TouchableOpacity>
//     </View>
//   );
// }