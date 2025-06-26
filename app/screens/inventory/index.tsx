import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../config/private-config/config/firebaseConfig";
import { useRouter } from "expo-router";
import { inventoryStyles } from "./styles/inventoryStyles";

interface Item {
  id: string;
  name: string;
  stock: number;
  photoUrl?: string;
  isSellable?: boolean;
}

export default function InventoryScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  // Responsive columns
  const isLandscape = width > height;
  const numColumns = isLandscape ? 4 : 2;
  const totalHorzPadding = 16 * 2; // sesuai contentContainer padding
  const gap = 12;
  const totalGaps = gap * (numColumns - 1);
  const cardWidth = (width - totalHorzPadding - totalGaps) / numColumns;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, "inventory"),
      where("ownerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) =>
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Item, "id">),
        }))
      )
    );
    return () => unsub();
  }, []);

  const handleAdd = () => router.push("/screens/inventory/add");
  const handleEdit = (item: Item) =>
    router.push({
      pathname: "/screens/inventory/edit/[id]",
      params: { id: item.id },
    });

  const renderItem = ({ item }: { item: Item }) => (
    <View style={[styles.card, { width: cardWidth }]}>
      {item.photoUrl && (
        <Image source={{ uri: item.photoUrl }} style={styles.img} />
      )}
      <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
        <Ionicons name="pencil" size={20} color="#007AFF" />
      </TouchableOpacity>

      <Text numberOfLines={2} style={styles.name}>
        {item.name}
      </Text>
      <Text style={styles.stock}>Jumlah: {item.stock}</Text>

      {item.isSellable && (
        <View style={styles.sellBadge}>
          <Text style={styles.sellBadgeTxt}>Jual</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        numColumns={numColumns}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: gap,
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        key={numColumns} // re-render on orientation change
      />
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F6FCFF" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    position: "relative",
    overflow: "hidden",
  },
  img: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  editBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 4,
    zIndex: 2,
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
    textAlign: "center",
  },
  stock: { fontSize: 14, color: "#666", textAlign: "center" },

  // badge untuk item jual
  sellBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#EAF4FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sellBadgeTxt: { color: "#007AFF", fontSize: 12, fontWeight: "600" },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});
