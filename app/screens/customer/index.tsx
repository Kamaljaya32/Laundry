import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../../../config/private-config/config/firebaseConfig";
import { useRouter } from "expo-router";
import { customerStyles as s } from "./styles/customerStyles";

interface Customer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  ownerId: string;
  isMember?: boolean;
  depositBalance?: number;
}

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const q = query(collection(db, "customers"), where("ownerId", "==", u.uid));
    const unsub = onSnapshot(q, (snap) =>
      setCustomers(
        snap.docs.map((d) => {
          const data = d.data() as Omit<Customer, "id">;
          return { id: d.id, ...data };
        })
      )
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search)
      ),
    [customers, search]
  );

  const del = (id: string, name: string) => {
    Alert.alert("Hapus?", `Hapus ${name}?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => deleteDoc(doc(db, "customers", id)),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Customer }) => (
    <View style={s.card}>
      {/* Name & Phone */}
      <Text style={s.name}>{item.name}</Text>
      <Text style={s.phone}>{item.phone}</Text>

      {/* Badges Row */}
      <View style={s.badgeRow}>
        {/* Order badge */}
        <View style={s.badge}>
          <Ionicons
            name="cart-outline"
            size={14}
            color="#0066FF"
            style={{ marginRight: 4 }}
          />
          <Text style={s.badgeTxt}>{item.totalOrders} Order</Text>
        </View>

        {/* Detail button */}
        <TouchableOpacity
          style={s.badge}
          onPress={() =>
            router.push({
              pathname: "/screens/customer/detail",
              params: { id: item.id },
            })
          }
        >
          <Ionicons
            name="person-circle-outline"
            size={14}
            color="#0066FF"
            style={{ marginRight: 4 }}
          />
          <Text style={s.badgeTxt}>Detail</Text>
        </TouchableOpacity>

        {/* Edit button */}
        <TouchableOpacity
          style={[s.badge, s.editBadge]}
          onPress={() =>
            router.push({
              pathname: "/screens/customer/edit/[id]",
              params: { id: item.id },
            })
          }
        >
          <Ionicons
            name="create-outline"
            size={14}
            color="#FF9500"
            style={{ marginRight: 4 }}
          />
          <Text style={s.editTxt}>Edit</Text>
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity
          style={[s.badge, s.delBadge]}
          onPress={() => del(item.id, item.name)}
        >
          <Ionicons
            name="trash-outline"
            size={14}
            color="#FF3B30"
            style={{ marginRight: 4 }}
          />
          <Text style={s.delTxt}>Hapus</Text>
        </TouchableOpacity>
      </View>

      {/* Membership & Deposit Badge */}
      {item.isMember && (
        <View style={[s.badge, { backgroundColor: "#EAF7EA", marginTop: 8 }]}>
          <Ionicons
            name="ribbon-outline"
            size={14}
            color="#28A745"
            style={{ marginRight: 4 }}
          />
          <Text style={[s.badgeTxt, { color: "#28A745" }]}>Member</Text>
        </View>
      )}
      {item.depositBalance !== undefined && (
        <View style={[s.badge, { backgroundColor: "#FFF8E1", marginTop: 4 }]}>
          <Ionicons
            name="wallet-outline"
            size={14}
            color="#FFAA00"
            style={{ marginRight: 4 }}
          />
          <Text style={[s.badgeTxt, { color: "#FFAA00" }]}>
            Rp {item.depositBalance.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={s.wrapper}>
      {/* Search Bar */}
      <View style={s.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Cari nama / telp"
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Customer List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
      />

      {/* FAB Add */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push("/screens/customer/add")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
