import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import {
  db,
  auth,
  app,
} from "../../../config/private-config/config/firebaseConfig";

const storage = getStorage(app);

export default function Akun() {
  const navigation = useNavigation();

  const [uid, setUid] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [avatar, setAvatar] = useState<string | null>(null);

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
          setAvatar(data.avatarUrl || null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin diperlukan", "Akses kamera diperlukan.");
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin diperlukan", "Akses galeri diperlukan.");
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (!(await requestMediaLibraryPermissions())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (!(await requestCameraPermissions())) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleEditPhoto = () => {
    if (Platform.OS === "ios") {
      import("react-native").then(({ ActionSheetIOS }) =>
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["Cancel", "Choose Photo", "Take Photo", "Delete Photo"],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 3,
          },
          (buttonIndex) => {
            if (buttonIndex === 1) pickImage();
            else if (buttonIndex === 2) takePhoto();
            else if (buttonIndex === 3) setAvatar(null);
          }
        )
      );
    } else {
      Alert.alert("Edit Foto", "Pilih tindakan", [
        { text: "Choose Photo", onPress: pickImage, style: "default" },
        { text: "Take Photo", onPress: takePhoto, style: "default" },
        {
          text: "Delete Photo",
          onPress: () => setAvatar(null),
          style: "destructive",
        },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const uploadPhotoToFirebase = async (): Promise<string | null> => {
    if (avatar && !avatar.startsWith("http")) {
      const fileRef = storageRef(storage, `profile_photos/${uid}.jpg`);
      const response = await fetch(avatar);
      const blob = await response.blob();
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    }
    return avatar;
  };

  const handleUpdate = async () => {
    if (!uid) return;
    try {
      const newAvatarUrl = await uploadPhotoToFirebase();
      await updateDoc(doc(db, "users", uid), {
        name,
        phone,
        email,
        address,
        avatarUrl: newAvatarUrl,
      });
      setAvatar(newAvatarUrl);
      Alert.alert("Sukses", "Data berhasil diperbarui!");
    } catch (error) {
      console.error(error);
      Alert.alert("Gagal", "Terjadi kesalahan saat memperbarui data.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Tombol Kembali */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      <Text style={styles.header}>Pengaturan Akun</Text>
      <ScrollView contentContainerStyle={styles.card}>
        <View style={styles.profilePhotoContainer}>
          <Image
            source={
              avatar
                ? { uri: avatar }
                : require("../../../assets/images/default-avatar.jpg")
            }
            style={styles.photoCircle}
          />
          <TouchableOpacity onPress={handleEditPhoto}>
            <Text style={styles.editPhotoLink}>Edit Photo</Text>
          </TouchableOpacity>
        </View>

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

        <TouchableOpacity
          style={styles.updateButtonWrapper}
          onPress={handleUpdate}
        >
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F" },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 20,
    marginTop: 40,
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
    marginBottom: 16,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#d9d9d9",
    resizeMode: "cover",
  },
  editPhotoLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
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
  updateButtonWrapper: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
