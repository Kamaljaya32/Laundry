/* eslint-disable react-native/no-inline-styles */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../config/private-config/config/firebaseConfig";
import { authStyles } from "./styles/authStyles";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getLoginErrorMessage = (error: unknown) => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case "auth/invalid-email":
          return "Format email tidak valid.";
        case "auth/user-disabled":
          return "Akun ini telah dinonaktifkan.";
        case "auth/user-not-found":
        case "auth/invalid-credential":
        case "auth/invalid-login-credentials":
        case "auth/wrong-password":
          return "Email atau password salah.";
        case "auth/network-request-failed":
          return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
        default:
          return "Terjadi kesalahan. Coba lagi sebentar.";
      }
    }
    return "Terjadi kesalahan tak terduga. Coba lagi.";
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Login gagal", "Email dan password wajib diisi!");
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/tabs");
    } catch (err) {
      Alert.alert("Login gagal", getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* —— layout ————————————————————————————— */
  const { height } = useWindowDimensions(); // agar minHeight menyesuaikan rotasi

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ minHeight: height, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.container}>
            <Text style={authStyles.title}>Masuk Akun</Text>

            <Image
              source={require("../../assets/images/prjct-(pic-only).png")}
              style={authStyles.logo}
              resizeMode="contain"
            />

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={authStyles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={authStyles.input}
            />

            <TouchableOpacity
              style={authStyles.btn}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={authStyles.btnTxt}>
                {loading ? "Memproses…" : "Masuk"}
              </Text>
            </TouchableOpacity>

            <Text
              style={authStyles.link}
              onPress={() => router.replace("/auth/SignupScreen")}
            >
              Belum punya akun? Daftar
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
