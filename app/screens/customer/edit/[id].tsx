import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../config/private-config/config/firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { customerEditStyles as s } from "../styles/customerEditStyles";

export default function CustomerEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [depositBalance, setDepositBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // load customer data
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "customers", id));
        if (!snap.exists()) {
          Alert.alert("Error", "Data tidak ada");
          router.back();
          return;
        }
        const data = snap.data() as any;
        setName(data.name);
        setPhone(data.phone);
        setIsMember(data.isMember ?? false);
        setDepositBalance((data.depositBalance ?? 0).toString());
      } catch (e: any) {
        Alert.alert("Error", e.message || "Gagal memuat data");
        router.back();
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [id]);

  const save = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Error", "Semua field wajib diisi");
      return;
    }
    const depositNum = parseInt(depositBalance, 10);
    if (isNaN(depositNum) || depositNum < 0) {
      Alert.alert("Error", "Deposit harus angka >= 0");
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, "customers", id!), {
        name: name.trim(),
        phone: phone.trim(),
        isMember,
        depositBalance: depositNum,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Edit Pelanggan</Text>

      <TextInput
        style={s.input}
        value={name}
        onChangeText={setName}
        placeholder="Nama"
      />
      <TextInput
        style={s.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Telepon"
        keyboardType="phone-pad"
      />

      {/* Membership Toggle */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
      >
        <Switch value={isMember} onValueChange={setIsMember} />
        <Text style={{ marginLeft: 8 }}>Member</Text>
      </View>

      {/* Deposit Balance Input */}
      <TextInput
        style={s.input}
        value={depositBalance}
        onChangeText={setDepositBalance}
        placeholder="Deposit Balance (Rp)"
        keyboardType="numeric"
      />

      <TouchableOpacity style={s.btn} onPress={save} disabled={loading}>
        <Text style={s.btnTxt}>{loading ? "Memproses…" : "Simpan"}</Text>
      </TouchableOpacity>
    </View>
  );
}
