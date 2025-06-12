/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../../config/private-config/config/firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { customerDetailStyles as s } from "./styles/customerDetailStyles";

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
  payment: "cash" | "qris" | "transfer";
}

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [cust, setCust] = useState<Cust | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "customers", id));
        if (!snap.exists()) {
          Alert.alert("Error", "Customer tidak ditemukan");
          router.back();
          return;
        }
        setCust(snap.data() as Cust);
      } catch (e) {
        console.error("[CustomerDetail] get customer failed:", e);
        Alert.alert("Error", String(e));
      }
    })();
  }, [id]);

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
        const list: Order[] = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Order)
        );
        setOrders(list.sort((a, b) => b.orderNumber - a.orderNumber));
      } catch (e) {
        console.error("[CustomerDetail] get orders failed:", e);
        Alert.alert("Error", String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, uid]);

  if (!cust || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, backgroundColor: "#F9FAFB" }}
    >
      {/* Back button */}
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
        }}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={{ fontSize: 16, color: "#007AFF", marginLeft: 4 }}>
          Kembali
        </Text>
      </TouchableOpacity>

      {/* Customer Profile */}
      <View
        style={{
          backgroundColor: "white",
          padding: 16,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 16, color: "#888", marginBottom: 4 }}>
          Nama
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          {cust.name}
        </Text>

        <Text style={{ fontSize: 16, color: "#888", marginBottom: 4 }}>
          Telepon
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 12 }}>{cust.phone}</Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#EAF2FF",
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
            alignSelf: "flex-start",
          }}
        >
          <Ionicons
            name="cart-outline"
            size={16}
            color="#0066FF"
            style={{ marginRight: 6 }}
          />
          <Text style={{ color: "#0066FF", fontWeight: "600" }}>
            {cust.totalOrders} Order
          </Text>
        </View>
      </View>

      {/* Order History */}
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
        Riwayat Pesanan
      </Text>

      {orders.length === 0 ? (
        <Text style={{ color: "#999", fontStyle: "italic" }}>
          Belum ada pesanan.
        </Text>
      ) : (
        orders.map((o) => (
          <View
            key={o.id}
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 12,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              marginBottom: 16,
            }}
          >
            <TextRow label="No. Pesanan" value={String(o.orderNumber)} />
            <TextRow
              label="Tanggal Masuk"
              value={new Date(o.inDate.seconds * 1000).toLocaleDateString()}
            />
            <TextRow
              label="Tanggal Keluar"
              value={new Date(o.outDate.seconds * 1000).toLocaleDateString()}
            />
            <TextRow
              label="Total"
              value={`Rp ${o.total.toLocaleString("id-ID")}`}
            />
            <TextRow label="Pembayaran" value={formatPayment(o.payment)} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

/* Komponen bantu */
function TextRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 14, color: "#555" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

function formatPayment(p: "cash" | "qris" | "transfer") {
  if (p === "cash") return "Cash";
  if (p === "qris") return "QRIS";
  return "Transfer";
}
