import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../../config/private-config/config/firebaseConfig"; // pastikan path sesuai

export default function Akun() {
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setPhone(data.phone || "");
          setEmail(data.email || "");
          setAddress(data.address || "");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdate = async () => {
    if (!uid) return;

    try {
      await updateDoc(doc(db, "users", uid), {
        name,
        phone,
        email,
        address,
      });
      Alert.alert("Sukses", "Data berhasil diperbarui!");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Gagal", "Terjadi kesalahan saat memperbarui data.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pengaturan Akun</Text>
      <ScrollView contentContainerStyle={styles.card}>
        <View style={styles.profilePhotoContainer}>
          <View style={styles.photoCircle} />
          <TouchableOpacity style={styles.uploadIcon}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>✏️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.uploadText}>Upload Photo</Text>
        <Text style={styles.photoNote}>
          Format should be in .jpeg, .png at least 800x800px and less than 5MB
        </Text>

        <Text style={styles.label}>Nama</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nama"
        />

        <Text style={styles.label}>No. Handphone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Nomor Handphone"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Alamat</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={address}
          onChangeText={setAddress}
          placeholder="Alamat"
          multiline
        />

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf5ff",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  profilePhotoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  photoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d9d9d9",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadIcon: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#007AFF",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    textAlign: "center",
    fontWeight: "500",
    marginTop: 8,
  },
  photoNote: {
    textAlign: "center",
    fontSize: 10,
    color: "#888",
    marginBottom: 16,
  },
  label: {
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  updateButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
    marginBottom: 16,
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
});
