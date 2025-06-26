import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "expo-router";
import { auth, db } from "../../../config/private-config/config/firebaseConfig";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { inventoryAddStyles } from "./styles/inventoryAddStyles";

export default function InventoryAddScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSellable, setIsSellable] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Izin dibutuhkan", "Perlu akses galeri");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;
    setImageUri(result.assets[0].uri);
  };

  const handleAdd = async () => {
    if (!name.trim() || !stock.trim()) {
      Alert.alert("Error", "Nama dan jumlah wajib diisi");
      return;
    }
    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert("Error", "Jumlah harus angka ≥ 0");
      return;
    }
    if (isSellable && (!price.trim() || isNaN(Number(price)))) {
      Alert.alert("Error", "Harga satuan wajib diisi untuk produk jualan");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "User belum login");
      return;
    }

    setLoading(true);
    let photoUrl: string | null = null;
    try {
      if (imageUri) {
        const storage = getStorage();
        const fileRef = ref(storage, `inventory/${user.uid}/${Date.now()}`);
        const img = await fetch(imageUri);
        const blob = await img.blob();
        await uploadBytes(fileRef, blob);
        photoUrl = await getDownloadURL(fileRef);
      }
      await addDoc(collection(db, "inventory"), {
        name: name.trim(),
        stock: stockNum,
        ownerId: user.uid,
        photoUrl,
        isSellable,
        price: isSellable ? parseFloat(price) : 0,
        createdAt: serverTimestamp(),
      });
      Alert.alert("Berhasil", "Barang berhasil ditambahkan");
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Gagal menambahkan barang");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.wrapper}
      contentContainerStyle={styles.contentContainer}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
    >
      <Text style={inventoryAddStyles.title}>Tambah Barang</Text>

      <TouchableOpacity
        style={inventoryAddStyles.imgPicker}
        onPress={pickImage}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={inventoryAddStyles.preview}
          />
        ) : (
          <Text>Pilih Gambar</Text>
        )}
      </TouchableOpacity>

      <TextInput
        placeholder="Nama Barang"
        value={name}
        onChangeText={setName}
        style={inventoryAddStyles.input}
      />

      <TextInput
        placeholder="Jumlah"
        keyboardType="numeric"
        value={stock}
        onChangeText={setStock}
        style={inventoryAddStyles.input}
      />

      {/** Hanya tampilkan input harga jika produk dijual */}
      {/** Switch untuk menandai barang bisa dijual */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
      >
        <Switch value={isSellable} onValueChange={setIsSellable} />
        <Text style={{ marginLeft: 8 }}>Jual ke Customer</Text>
      </View>

      {isSellable && (
        <TextInput
          placeholder="Harga Satuan (Rp)"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
          style={inventoryAddStyles.input}
        />
      )}

      <TouchableOpacity
        style={[
          inventoryAddStyles.btn,
          loading && inventoryAddStyles.btnDisabled,
        ]}
        onPress={handleAdd}
        disabled={loading}
      >
        <Text style={inventoryAddStyles.btnTxt}>
          {loading ? "Memproses…" : "Tambah"}
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F6FCFF",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
});
