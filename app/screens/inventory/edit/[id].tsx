import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  StyleSheet,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db } from "../../../../config/private-config/config/firebaseConfig";
import { inventoryEditStyles } from "../styles/inventoryEditStyles";

export default function InventoryEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("0");
  const [isSellable, setIsSellable] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // load existing data
  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, "inventory", id));
      if (!snap.exists()) {
        Alert.alert("Error", "Item tidak ditemukan");
        return router.back();
      }
      const data = snap.data();
      setName(data.name);
      setStock(data.stock.toString());
      setPrice((data.price ?? 0).toString());
      setIsSellable(data.isSellable ?? false);
      setPhotoUrl(data.photoUrl || null);
    })();
  }, [id]);

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
    const uri = result.assets[0]?.uri;
    if (uri) setNewImage(uri);
  };

  const handleUpdate = async () => {
    if (!name.trim() || !stock.trim()) {
      return Alert.alert("Error", "Semua field wajib diisi");
    }
    const stockNum = parseInt(stock, 10);
    const priceNum = parseFloat(price);
    if (isNaN(stockNum) || stockNum < 0) {
      return Alert.alert("Error", "Jumlah harus angka >= 0");
    }
    if (isSellable && (isNaN(priceNum) || priceNum < 0)) {
      return Alert.alert("Error", "Harga harus angka >= 0");
    }

    setLoading(true);
    try {
      let finalUrl = photoUrl;
      if (newImage) {
        const storage = getStorage();
        const fileRef = ref(storage, `inventory/${id}/${Date.now()}`);
        const img = await fetch(newImage);
        const blob = await img.blob();
        await uploadBytes(fileRef, blob);
        finalUrl = await getDownloadURL(fileRef);
      }

      await updateDoc(doc(db, "inventory", id), {
        name: name.trim(),
        stock: stockNum,
        photoUrl: finalUrl,
        isSellable,
        price: priceNum,
      });

      Alert.alert("Berhasil", "Perubahan disimpan");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Konfirmasi", "Hapus barang ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "inventory", id));
          if (photoUrl) {
            const storage = getStorage();
            const path = decodeURIComponent(
              photoUrl.split("/o/")[1].split("?")[0]
            );
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
          }
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAwareScrollView
      style={styles.wrapper}
      contentContainerStyle={styles.contentContainer}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
    >
      <Text style={inventoryEditStyles.title}>Edit Barang</Text>

      <TouchableOpacity
        style={inventoryEditStyles.imgPicker}
        onPress={pickImage}
      >
        <Image
          source={{ uri: newImage || photoUrl || undefined }}
          style={inventoryEditStyles.preview}
        />
      </TouchableOpacity>

      <TextInput
        placeholder="Nama Barang"
        value={name}
        onChangeText={setName}
        style={inventoryEditStyles.input}
      />

      <TextInput
        placeholder="Jumlah"
        keyboardType="numeric"
        value={stock}
        onChangeText={setStock}
        style={inventoryEditStyles.input}
      />

      <TextInput
        placeholder="Harga Satuan (Rp)"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
        style={inventoryEditStyles.input}
        editable={isSellable}
      />

      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
      >
        <Switch value={isSellable} onValueChange={setIsSellable} />
        <Text style={{ marginLeft: 8 }}>Jual ke Customer</Text>
      </View>

      <View style={inventoryEditStyles.actions}>
        <TouchableOpacity
          style={[
            inventoryEditStyles.btn,
            loading && inventoryEditStyles.btnDisabled,
          ]}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={inventoryEditStyles.btnTxt}>
            {loading ? "Memproses…" : "Simpan"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[inventoryEditStyles.btn, inventoryEditStyles.delBtn]}
          onPress={handleDelete}
        >
          <Text style={inventoryEditStyles.btnTxt}>Hapus</Text>
        </TouchableOpacity>
      </View>
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
