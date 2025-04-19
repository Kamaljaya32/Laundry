import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';     
import { authStyles } from './styles/authStyles';        

export default function LoginScreen() {
  const router = useRouter();                          
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getLoginErrorMessage = (error: unknown) => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/invalid-email':
          return 'Format email tidak valid.';
        case 'auth/user-disabled':
          return 'Akun ini telah dinonaktifkan.';
        case 'auth/user-not-found':
          return 'Akun ini tidak ditemukan.'
        case 'auth/wrong-password':
          return 'Email atau password salah.';
        case 'auth/invalid-credential':       
        case 'auth/invalid-login-credentials': 
        case 'auth/user-not-found':           
        case 'auth/wrong-password':            
          return 'Email atau password salah.';
        case 'auth/network-request-failed':
          return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        default:
          return 'Terjadi kesalahan. Coba lagi sebentar.';
      }
    }
    return 'Terjadi kesalahan tak terduga. Coba lagi.';
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Login gagal', 'Email dan password wajib diisi!');
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/tabs')
    } catch (err) {
      const msg = getLoginErrorMessage(err);
      Alert.alert('Login gagal', msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Masuk Akun</Text>

      <Image 
        source={require("../../assets/images/prjct-(pic-only).png")}
        style={authStyles.logo}
        resizeMode='contain'
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={authStyles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={authStyles.input}
      />

      <TouchableOpacity style={authStyles.btn} onPress={handleLogin} disabled={loading}>
        <Text style={authStyles.btnTxt}>{loading ? 'Memproses…' : 'Masuk'}</Text>
      </TouchableOpacity>

      <Text
        style={authStyles.link}
        onPress={() => router.replace('/auth/SignupScreen')}
      >
        Belum punya akun? Daftar
      </Text>
    </View>
  );
}
