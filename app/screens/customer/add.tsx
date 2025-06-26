import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../config/private-config/config/firebaseConfig";
import { inventoryAddStyles as s } from "../inventory/styles/inventoryAddStyles";
import { useRouter } from "expo-router";

export default function CustomerAdd() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const save = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Error", "Nama & telp wajib");
      return;
    }
    const u = auth.currentUser;
    if (!u) {
      Alert.alert("Login dulu");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "customers"), {
        name: name.trim(),
        phone: phone.trim(),
        totalOrders: 0,
        ownerId: u.uid,
        isMember: false,
        depositBalance: 0,
        createdAt: serverTimestamp(),
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Tambah Pelanggan</Text>
      <TextInput
        style={s.input}
        placeholder="Nama"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={s.input}
        placeholder="No. Telepon"
        value={phone}
        keyboardType="phone-pad"
        onChangeText={setPhone}
      />
      <TouchableOpacity style={s.btn} onPress={save} disabled={loading}>
        <Text style={s.btnTxt}>{loading ? "Menyimpan…" : "Simpan"}</Text>
      </TouchableOpacity>
    </View>
  );
}
