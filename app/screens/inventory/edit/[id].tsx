import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from '../../../../config/firebaseConfig';
import { inventoryEditStyles } from '../styles/inventoryEditStyles';

export default function InventoryEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName]   = useState('');
  const [stock, setStock] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, 'inventory', id));
      if (!snap.exists()) {
        Alert.alert('Error', 'Item tidak ditemukan');
        return router.back();
      }
      const data = snap.data();
      setName(data.name);
      setStock(data.stock.toString());
      setPhotoUrl(data.photoUrl || null);
    })();
  }, [id]);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Izin dibutuhkan', 'Perlu akses galeri');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
  
    if (result.canceled) {
      return;
    }
  
    const pickedUri = result.assets[0]?.uri;
    if (pickedUri) {
      setNewImage(pickedUri);
    }
  };
  

  const handleUpdate = async () => {
    if (!name.trim() || !stock.trim()) {
      return Alert.alert('Error', 'Semua field wajib diisi');
    }
    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      return Alert.alert('Error', 'Jumlah harus angka >= 0');
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
      await updateDoc(doc(db, 'inventory', id), {
        name: name.trim(),
        stock: stockNum,
        photoUrl: finalUrl,
      });
      Alert.alert('Berhasil', 'Perubahan disimpan');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Konfirmasi', 'Hapus barang ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'inventory', id));
          // menghapus file di storage
          if (photoUrl) {
            const storage = getStorage();
            const path = decodeURIComponent(photoUrl.split('/o/')[1].split('?')[0]);
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
          }
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={inventoryEditStyles.container}>
      <Text style={inventoryEditStyles.title}>Edit Barang</Text>
      <TouchableOpacity style={inventoryEditStyles.imgPicker} onPress={pickImage}>
        <Image source={{ uri: newImage || photoUrl || undefined }} style={inventoryEditStyles.preview} />
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
      <View style={inventoryEditStyles.actions}>
        <TouchableOpacity style={[inventoryEditStyles.btn, loading && inventoryEditStyles.btnDisabled]} onPress={handleUpdate} disabled={loading}>
          <Text style={inventoryEditStyles.btnTxt}>{loading ? 'Memproses…' : 'Simpan'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[inventoryEditStyles.btn, inventoryEditStyles.delBtn]} onPress={handleDelete}>
          <Text style={inventoryEditStyles.btnTxt}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}