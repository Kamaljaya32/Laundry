import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';    
import { authStyles } from './styles/authStyles';         

export default function SignupScreen() {
  const router = useRouter();                                   

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const getSignupErrorMessage = (error: unknown) => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          return 'Email sudah terdaftar. Coba masuk atau gunakan email lain.';
        case 'auth/invalid-email':
          return 'Format email tidak valid.';
        case 'auth/weak-password':
          return 'Password minimal 6 karakter.';
        case 'auth/network-request-failed':
          return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        default:
          return 'Terjadi kesalahan. Coba lagi sebentar.';
      }
    }
    // Fallback untuk error tak terduga
    return 'Terjadi kesalahan tak terduga. Coba lagi.';
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      return Alert.alert('Pendaftaran gagal', 'Semua field wajib diisi!');
    }

    try {
      setLoading(true);

      // 1. buat akun auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });

      // 2. simpan profil dasar di Firestore
      await setDoc(doc(collection(db, 'users'), cred.user.uid), {
        uid: cred.user.uid,
        name,
        email,
        phone,
        createdAt: Date.now(),
      });

      Alert.alert('Berhasil', 'Pendaftaran berhasil!');
      router.replace('/tabs')
    } catch (err) {
      const msg = getSignupErrorMessage(err);
      Alert.alert('Pendaftaran gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Buat Akun</Text>

      <Image 
        source={require("../../assets/images/prjct-(pic-only).png")}
        style={authStyles.logo}
        resizeMode='contain'
      />

      <TextInput
        placeholder="Nama Lengkap"
        value={name}
        onChangeText={setName}
        style={authStyles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={authStyles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="No. Telepon / WhatsApp"
        value={phone}
        onChangeText={setPhone}
        style={authStyles.input}
        keyboardType="phone-pad"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={authStyles.input}
      />

      <TouchableOpacity style={authStyles.btn} onPress={handleSignup} disabled={loading}>
        <Text style={authStyles.btnTxt}>{loading ? 'Memproses…' : 'Daftar'}</Text>
      </TouchableOpacity>

      <Text
        style={authStyles.link}
        onPress={() => router.replace('/auth/LoginScreen')}
      >
        Sudah punya akun? Masuk
      </Text>
    </View>
  );
}
