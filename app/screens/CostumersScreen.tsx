import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDocs, // tambahan untuk alternatif query
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../config/private-config/config/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

interface Customer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  ownerId: string;
}

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const navigation = useNavigation<any>();
  const auth = getAuth();

  // Check authentication status
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        Alert.alert(
          "Authentication Required",
          "You need to be logged in to access customer data."
        );
      }
    });

    return () => unsubscribe();
  }, []);

  // Load customers data with filtering by current user
  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return; // Don't try to load data if not authenticated
    }

    setLoadingData(true);

    // SOLUSI 1: Menggunakan query sederhana tanpa orderBy (tidak perlu index)
    const q = query(
      collection(db, "customers"),
      where("ownerId", "==", currentUser.uid)
    );

    try {
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(
          (d) =>
            ({
              id: d.id,
              ...(d.data() as Omit<Customer, "id">),
            } as Customer)
        );
        // Sort data pada aplikasi, bukan di query Firestore
        list.sort((a, b) => a.name.localeCompare(b.name));
        setCustomers(list);
        setLoadingData(false);
      }, (error) => {
        console.error("Snapshot listener error:", error);
        // SOLUSI 2: Jika snapshot gagal, gunakan getDocs sebagai fallback
        fetchCustomersOnce(currentUser.uid);
      });

      return unsub;
    } catch (error) {
      console.error("Error setting up listener:", error);
      // SOLUSI 2: Fallback ke metode alternatif jika listener gagal
      fetchCustomersOnce(currentUser.uid);
    }
  }, [auth.currentUser]);

  // Fungsi alternatif untuk mendapatkan data sebagai fallback
  const fetchCustomersOnce = async (userId: string) => {
    try {
      const q = query(
        collection(db, "customers"),
        where("ownerId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(
        (d) => ({
          id: d.id,
          ...(d.data() as Omit<Customer, "id">),
        } as Customer)
      );
      
      // Sort data pada aplikasi
      list.sort((a, b) => a.name.localeCompare(b.name));
      setCustomers(list);
    } catch (error) {
      console.error("Error fetching customers:", error);
      Alert.alert(
        "Error",
        "Tidak dapat memuat data pelanggan. Pastikan Anda memiliki izin yang benar."
      );
    } finally {
      setLoadingData(false);
    }
  };

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search)
      ),
    [customers, search]
  );

  const addCustomer = async () => {
    if (newCustomer.name.trim() === "" || newCustomer.phone.trim() === "") {
      Alert.alert("Input Error", "Nama dan nomor telepon harus diisi!");
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert("Authentication Error", "Anda harus login terlebih dahulu!");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "customers"), {
        name: newCustomer.name,
        phone: newCustomer.phone,
        totalOrders: 0, // Default for new customer
        ownerId: currentUser.uid,
        createdAt: new Date().getTime(), // Tambahkan timestamp
      });

      // Reset form and close modal
      setNewCustomer({ name: "", phone: "" });
      setModalVisible(false);
      
      // Alternatif: Refresh data secara manual jika listener tidak berfungsi
      await fetchCustomersOnce(currentUser.uid);
      
    } catch (error) {
      console.error("Error adding customer: ", error);
      Alert.alert("Error", "Gagal menambahkan pelanggan. Periksa izin Firebase Anda.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle edit using simple Alert
  const handleEditCustomer = (customer: Customer) => {
    Alert.alert(
      "Edit Pelanggan",
      "Pilih data yang ingin diedit:",
      [
        {
          text: "Batal",
          style: "cancel"
        },
        {
          text: "Edit Nama",
          onPress: () => {
            setTimeout(() => {
              Alert.prompt(
                "Edit Nama",
                "Masukkan nama baru:",
                [
                  {
                    text: "Batal",
                    style: "cancel"
                  },
                  {
                    text: "Simpan",
                    onPress: async (newName) => {
                      if (newName && newName.trim() !== "") {
                        try {
                          const customerRef = doc(db, "customers", customer.id);
                          await updateDoc(customerRef, {
                            name: newName.trim()
                          });
                          Alert.alert("Sukses", "Nama pelanggan berhasil diperbarui");
                          
                          // Refresh data jika perlu
                          if (auth.currentUser) {
                            fetchCustomersOnce(auth.currentUser.uid);
                          }
                        } catch (error) {
                          console.error("Error updating name:", error);
                          Alert.alert("Error", "Gagal memperbarui nama pelanggan");
                        }
                      } else {
                        Alert.alert("Error", "Nama tidak boleh kosong");
                      }
                    }
                  }
                ],
                "plain-text",
                customer.name
              );
            }, 300);
          }
        },
        {
          text: "Edit No. Telp",
          onPress: () => {
            setTimeout(() => {
              Alert.prompt(
                "Edit Nomor Telepon",
                "Masukkan nomor telepon baru:",
                [
                  {
                    text: "Batal",
                    style: "cancel"
                  },
                  {
                    text: "Simpan",
                    onPress: async (newPhone) => {
                      if (newPhone && newPhone.trim() !== "") {
                        try {
                          const customerRef = doc(db, "customers", customer.id);
                          await updateDoc(customerRef, {
                            phone: newPhone.trim()
                          });
                          Alert.alert("Sukses", "Nomor telepon berhasil diperbarui");
                          
                          // Refresh data jika perlu
                          if (auth.currentUser) {
                            fetchCustomersOnce(auth.currentUser.uid);
                          }
                        } catch (error) {
                          console.error("Error updating phone:", error);
                          Alert.alert("Error", "Gagal memperbarui nomor telepon");
                        }
                      } else {
                        Alert.alert("Error", "Nomor telepon tidak boleh kosong");
                      }
                    }
                  }
                ],
                "plain-text",
                customer.phone
              );
            }, 300);
          }
        }
      ]
    );
  };

  // Function to handle delete customer
  const handleDeleteCustomer = async (customer: Customer) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus pelanggan ${customer.name}?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "customers", customer.id));
              Alert.alert("Sukses", "Pelanggan berhasil dihapus");
              
              // Refresh data secara manual jika listener tidak berfungsi
              if (auth.currentUser) {
                fetchCustomersOnce(auth.currentUser.uid);
              }
            } catch (error) {
              console.error("Error deleting customer:", error);
              Alert.alert("Error", "Gagal menghapus pelanggan");
            }
          },
        },
      ]
    );
  };

  // Show customer detail
  const showCustomerDetail = (customer: Customer) => {
    Alert.alert(
      "Detail Pelanggan",
      `Nama: ${customer.name}\nNo.telp: ${customer.phone}\nTotal Order: ${customer.totalOrders}`,
      [
        {
          text: "Tutup",
          style: "cancel",
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => showCustomerDetail(item)}
    >
      <Text style={styles.name}>Nama: {item.name}</Text>
      <Text style={styles.phone}>No.telp: {item.phone}</Text>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Ionicons
            name="cart-outline"
            size={14}
            color="#0066FF"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.badgeTxt}>{item.totalOrders} Order</Text>
        </View>
        
        <TouchableOpacity
          style={styles.badge}
          onPress={() => showCustomerDetail(item)}
        >
          <Ionicons
            name="person-circle-outline"
            size={14}
            color="#0066FF"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.badgeTxt}>Detail</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.badge, styles.editBadge]}
          onPress={() => handleEditCustomer(item)}
        >
          <Ionicons
            name="create-outline"
            size={14}
            color="#FF9500"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.editBadgeTxt}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.badge, styles.deleteBadge]}
          onPress={() => handleDeleteCustomer(item)}
        >
          <Ionicons
            name="trash-outline"
            size={14}
            color="#FF3B30"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.deleteBadgeTxt}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Customer Input Modal
  const renderModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tambah Pelanggan Baru</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.inputLabel}>Nama Pelanggan</Text>
            <TextInput
              style={styles.input}
              value={newCustomer.name}
              onChangeText={(text) =>
                setNewCustomer({ ...newCustomer, name: text })
              }
              placeholder="Masukkan nama pelanggan"
            />

            <Text style={styles.inputLabel}>Nomor Telepon</Text>
            <TextInput
              style={styles.input}
              value={newCustomer.phone}
              onChangeText={(text) =>
                setNewCustomer({ ...newCustomer, phone: text })
              }
              placeholder="Masukkan nomor telepon"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={addCustomer}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={20}
          color="#888"
          style={{ marginRight: 6 }}
        />
        <TextInput
          placeholder="Cari nama pelanggan / No. telp…"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1 }}
        />
      </View>

      {loadingData ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Memuat data pelanggan...</Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>Belum ada data pelanggan</Text>
          <Text style={styles.emptySubText}>Tambahkan pelanggan dengan menekan tombol + di bawah</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FCFF",
    padding: 16,
    position: "relative",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
    marginBottom: 12,
    marginTop:30,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  name: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  phone: { color: "#666" },
  badgeRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E6F0FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTxt: { color: "#0066FF", fontWeight: "600", fontSize: 12 },
  editBadge: {
    backgroundColor: "#FFF5E6",
  },
  editBadgeTxt: {
    color: "#FF9500",
    fontWeight: "600",
    fontSize: 12,
  },
  deleteBadge: {
    backgroundColor: "#FFF0F0",
  },
  deleteBadgeTxt: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: 16,
    bottom: 16,
    backgroundColor: "#0066FF",
    borderRadius: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  formContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  saveButton: {
    backgroundColor: "#0066FF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#A0C0FF",
  },
});