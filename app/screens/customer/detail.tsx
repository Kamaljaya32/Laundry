/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
} from "firebase/firestore";
import { auth, db } from "../../../config/private-config/config/firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { customerDetailStyles as s } from "./styles/customerDetailStyles";

interface Cust {
  name: string;
  phone: string;
  totalOrders: number;
  isMember?: boolean;
  depositBalance?: number;
}

interface Order {
  id: string;
  orderNumber: number;
  inDate: any;
  outDate: any;
  total: number;
  payment: "cash" | "qris" | "transfer" | "deposit";
}

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [cust, setCust] = useState<Cust | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Top-Up
  const [isModalVisible, setModalVisible] = useState(false);
  const [topupValue, setTopupValue] = useState("");
  const [updating, setUpdating] = useState(false);

  // Fetch customer
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "customers", id));
        if (!snap.exists()) {
          Alert.alert("Error", "Customer tidak ditemukan");
          return router.back();
        }
        setCust(snap.data() as Cust);
      } catch (e) {
        console.error("get customer failed:", e);
        Alert.alert("Error", String(e));
        router.back();
      }
    })();
  }, [id]);

  // Fetch orders
  useEffect(() => {
    if (!id || !uid) return;
    (async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("customerId", "==", id),
          where("ownerId", "==", uid)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => {
          const data = d.data() as Omit<Order, "id">;
          return { id: d.id, ...data };
        });
        setOrders(list.sort((a, b) => b.orderNumber - a.orderNumber));
      } catch (e) {
        console.error("get orders failed:", e);
        Alert.alert("Error", String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, uid]);

  // Handle top-up deposit
  const handleTopUp = async () => {
    const amt = parseInt(topupValue, 10);
    if (isNaN(amt) || amt <= 0) {
      return Alert.alert("Error", "Masukkan jumlah top-up yang valid");
    }
    setUpdating(true);
    try {
      await updateDoc(doc(db, "customers", id!), {
        depositBalance: increment(amt),
        isMember: true,
      });
      setCust(
        (prev) =>
          prev && {
            ...prev,
            depositBalance: (prev.depositBalance || 0) + amt,
            isMember: true,
          }
      );
      setTopupValue("");
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Gagal top-up");
    } finally {
      setUpdating(false);
    }
  };

  if (!cust || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      {/* Back */}
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={{ fontSize: 16, color: "#007AFF", marginLeft: 4 }}>
          Kembali
        </Text>
      </TouchableOpacity>

      {/* Profile */}
      <Text style={s.label}>Nama</Text>
      <Text style={s.value}>{cust.name}</Text>
      <Text style={s.label}>Telepon</Text>
      <Text style={s.value}>{cust.phone}</Text>

      {/* Badges */}
      <View style={s.badge}>
        <Ionicons name="cart-outline" size={16} color="#0066FF" />
        <Text style={s.badgeTxt}> {cust.totalOrders} Order</Text>
      </View>
      {cust.isMember && (
        <View style={[s.badge, { marginTop: 8 }]}>
          <Ionicons name="ribbon-outline" size={16} color="#28A745" />
          <Text style={[s.badgeTxt, { color: "#28A745" }]}> Member</Text>
        </View>
      )}

      {/* Deposit */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <View>
          <Text style={s.label}>Saldo Deposit</Text>
          <Text style={s.value}>
            Rp {(cust.depositBalance || 0).toLocaleString("id-ID")}
          </Text>
        </View>
        <TouchableOpacity style={s.badge} onPress={() => setModalVisible(true)}>
          <Ionicons name="wallet-outline" size={16} color="#0066FF" />
          <Text style={s.badgeTxt}> Top-Up</Text>
        </TouchableOpacity>
      </View>

      {/* Order history */}
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
              <Text style={s.orderVal}>
                Rp {o.total.toLocaleString("id-ID")}
              </Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderKey}>Pembayaran</Text>
              <Text style={s.orderVal}>
                {o.payment === "deposit"
                  ? "Deposit"
                  : o.payment === "cash"
                  ? "Cash"
                  : o.payment === "qris"
                  ? "QRIS"
                  : "Transfer"}
              </Text>
            </View>
          </View>
        ))
      )}

      {/* Top-Up Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Top-Up Deposit</Text>
            <TextInput
              style={s.input}
              placeholder="Masukkan jumlah Rp"
              keyboardType="numeric"
              value={topupValue}
              onChangeText={setTopupValue}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ marginRight: 16 }}
              >
                <Text style={{ color: "red", fontWeight: "600" }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTopUp} disabled={updating}>
                <Text style={{ color: "#0066FF", fontWeight: "600" }}>
                  {updating ? "Memproses…" : "Konfirmasi"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
