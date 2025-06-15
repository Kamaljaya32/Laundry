/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
  Alert,
  TextInput,
  useWindowDimensions,
  Modal,
  Pressable,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import moment from "moment";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { db, auth } from "../../config/private-config/config/firebaseConfig";

/* ---------- TYPES ---------- */
type Status = "Sedang Diproses" | "Belum Diambil" | "Telah Diambil";
type Payment = "cash" | "qris" | "transfer" | "unpaid";

interface LaundryDoc {
  id: string;
  orderNumber: number;
  name: string;
  phone: string;
  items: string[];
  deadline?: Timestamp;
  status: Status;
  payment: Payment;
  ownerId: string;
}

/* ---------- STATUS META ---------- */
const STATUS_META: Record<Status, readonly [string, string, string]> = {
  "Sedang Diproses": ["#E1F0FF", "#007AFF", "🌀"],
  "Belum Diambil": ["#FFF3CD", "#FFA500", "📦"],
  "Telah Diambil": ["#E0FFE5", "#28A745", "✅"],
};
const STATUS_ORDER: Record<Status, number> = {
  "Sedang Diproses": 0,
  "Belum Diambil": 1,
  "Telah Diambil": 2,
};

/* ---------- HELPER: ACTION SHEET ---------- */
function showOptions(
  title: string,
  options: string[],
  cancelButtonIndex: number,
  callback: (index: number) => void
) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      { title, options, cancelButtonIndex },
      callback
    );
  } else {
    Alert.alert(
      title,
      undefined,
      options.map((opt, i) => ({
        text: opt,
        onPress: () => callback(i),
        style: i === cancelButtonIndex ? "cancel" : undefined,
      }))
    );
  }
}

/* ---------- TOP SECTION ---------- */
interface TopSectionProps {
  date: string;
  balance: number;
  income: number;
  expense: number;
  loading: boolean;
  search: string;
  onSearch: (t: string) => void;
  onFilter: () => void;
  onSettings: () => void;
}
function TopSection({
  date,
  balance,
  income,
  expense,
  loading,
  search,
  onSearch,
  onFilter,
  onSettings,
}: TopSectionProps) {
  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.header}>
          Hai, {auth.currentUser?.displayName || "User"} 👋
        </Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={onSettings}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>List Laundry Hari Ini</Text>

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceDate}>{date}</Text>
        {loading ? (
          <View style={styles.balanceRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={{ marginLeft: 8, color: "#666" }}>
              Memuat data keuangan...
            </Text>
          </View>
        ) : (
          <View style={styles.balanceRow}>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceTitle}>Total Saldo</Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: balance >= 0 ? "#28A745" : "#FF3B30" },
                ]}
              >
                Rp {balance.toLocaleString("id-ID")}
              </Text>
            </View>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceTitle}>Pemasukan</Text>
              <Text style={styles.incomeValue}>
                Rp {income.toLocaleString("id-ID")}
              </Text>
            </View>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceTitle}>Pengeluaran</Text>
              <Text style={styles.expenseValue}>
                Rp {expense.toLocaleString("id-ID")}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.toolsRow}>
        <TextInput
          placeholder="Cari nama / nota"
          style={styles.search}
          value={search}
          onChangeText={onSearch}
        />
        <TouchableOpacity style={styles.filterBtn} onPress={onFilter}>
          <Ionicons name="funnel" size={18} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </>
  );
}

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function HomeScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const { height } = useWindowDimensions();

  const [data, setData] = useState<LaundryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const [filter, setFilter] = useState<"Semua" | Status | "Belum Bayar">(
    "Semua"
  );
  const [search, setSearch] = useState("");

  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [dateToday] = useState(moment().format("dddd, DD MMMM YYYY"));
  const [financeLoading, setFinanceLoading] = useState(true);

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  /* ---------- LOAD LAUNDRY LIST ---------- */
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "laundry"),
      where("ownerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as LaundryDoc))
        .sort(
          (a, b) =>
            STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
            (a.payment === "unpaid" ? 1 : 0) -
              (b.payment === "unpaid" ? 1 : 0) ||
            a.orderNumber - b.orderNumber
        );
      setData(list);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  /* ---------- TICK FOR COUNTDOWN ---------- */
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* ---------- DAILY FINANCE ---------- */
  useEffect(() => {
    if (!user) return;
    setFinanceLoading(true);
    const start = moment().startOf("day").toDate();
    const end = moment().add(1, "day").startOf("day").toDate();
    const PAID = ["cash", "qris", "transfer"] as const;

    const qInc = query(
      collection(db, "orders"),
      where("ownerId", "==", user.uid),
      where("payment", "in", PAID),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<", Timestamp.fromDate(end))
    );
    const qExp = query(
      collection(db, "expenses"),
      where("ownerId", "==", user.uid),
      where("date", ">=", Timestamp.fromDate(start)),
      where("date", "<", Timestamp.fromDate(end))
    );

    let doneInc = false,
      doneExp = false;
    const finish = () => doneInc && doneExp && setFinanceLoading(false);

    const unsubInc = onSnapshot(qInc, (snap) => {
      setIncome(snap.docs.reduce((s, d) => s + (+d.data().total || 0), 0));
      doneInc = true;
      finish();
    });
    const unsubExp = onSnapshot(qExp, (snap) => {
      setExpense(snap.docs.reduce((s, d) => s + (+d.data().amount || 0), 0));
      doneExp = true;
      finish();
    });

    return () => {
      unsubInc();
      unsubExp();
    };
  }, [user]);

  useEffect(() => setBalance(income - expense), [income, expense]);

  /* ---------- STATUS CHANGE ---------- */
  const changeStatus = (id: string, curr: Status) => {
    const choices: Status[] = [
      "Sedang Diproses",
      "Belum Diambil",
      "Telah Diambil",
    ];
    showOptions(
      "Ganti Status Laundry",
      [...choices, "Batal"],
      choices.length,
      async (i) => {
        if (i >= choices.length) return;
        const ns = choices[i];
        if (ns === curr) return;
        try {
          await updateDoc(doc(db, "orders", id), { status: ns });
          if (ns === "Telah Diambil") await deleteDoc(doc(db, "laundry", id));
          else await updateDoc(doc(db, "laundry", id), { status: ns });
        } catch (e) {
          Alert.alert("Gagal", String(e));
        }
      }
    );
  };

  /* ---------- PAYMENT ---------- */
  const openPaymentModal = (id: string) => {
    setActiveDocId(id);
    setPayModalVisible(true);
  };
  const selectPaymentMethod = async (method: Payment) => {
    if (!activeDocId) return;
    try {
      await updateDoc(doc(db, "laundry", activeDocId), { payment: method });
      await updateDoc(doc(db, "orders", activeDocId), { payment: method });
    } catch (e) {
      Alert.alert("Gagal", String(e));
    } finally {
      setPayModalVisible(false);
      setActiveDocId(null);
    }
  };

  /* ---------- FILTER ---------- */
  const openFilter = () => {
    const opts: ("Semua" | Status | "Belum Bayar")[] = [
      "Semua",
      "Sedang Diproses",
      "Belum Diambil",
      "Belum Bayar",
      "Telah Diambil",
    ];
    showOptions(
      "Filter Status Laundry",
      [...opts, "Batal"],
      opts.length,
      (i) => {
        if (i < opts.length) setFilter(opts[i]);
      }
    );
  };

  /* ---------- FILTERED DATA ---------- */
  const shown = data.filter((d) => {
    const okStat =
      filter === "Semua"
        ? true
        : filter === "Belum Bayar"
        ? d.payment === "unpaid"
        : d.status === filter;
    const q = search.trim().toLowerCase();
    return (
      okStat &&
      (q === "" ||
        d.name.toLowerCase().includes(q) ||
        String(d.orderNumber).includes(q))
    );
  });

  /* ---------- RENDER ITEM ---------- */
  const renderItem = ({ item }: { item: LaundryDoc }) => {
    const [bg, fg, ico] = STATUS_META[item.status];

    /* ====== COUNTDOWN d + HH:MM:SS ====== */
    let cd = "",
      late = false;
    if (item.deadline) {
      const diff = item.deadline.toDate().getTime() - Date.now();
      late = diff < 0;
      const absSec = Math.abs(Math.floor(diff / 1000));
      const d = Math.floor(absSec / 86400);
      const h = Math.floor((absSec % 86400) / 3600);
      const m = Math.floor((absSec % 3600) / 60);
      const s = absSec % 60;
      cd = `${late ? "-" : ""}${d}d ${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
          <TouchableOpacity
            style={[styles.statusChip, { backgroundColor: bg }]}
            onPress={() => changeStatus(item.id, item.status)}
          >
            <Text style={[styles.statusText, { color: fg }]}>
              {ico} {item.status}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.detailTitle}>Detail Cucian :</Text>
        {item.items.map((it, i) => (
          <Text key={i} style={styles.itemText}>
            • {it}
          </Text>
        ))}

        <View style={styles.bottomRow}>
          {cd ? (
            <Text style={[styles.deadline, late ? styles.late : styles.onTime]}>
              Sisa {cd}
            </Text>
          ) : null}
          {item.payment === "unpaid" && (
            <TouchableOpacity onPress={() => openPaymentModal(item.id)}>
              <Text style={styles.unpaid}>Belum Bayar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  /* ---------- LOADING STATE ---------- */
  if (loading)
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#007AFF" />
    );

  /* ---------- JSX ---------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6FCFF" }}>
      <FlatList
        data={shown}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <TopSection
            date={dateToday}
            balance={balance}
            income={income}
            expense={expense}
            loading={financeLoading}
            search={search}
            onSearch={setSearch}
            onFilter={openFilter}
            onSettings={() => router.push("/screens/setting/setting")}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: height * 0.15,
        }}
        ListEmptyComponent={<Text>Tidak ada data</Text>}
      />

      {/* ---------- MODAL PEMBAYARAN ---------- */}
      <Modal
        visible={payModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPayModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPayModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Metode Pembayaran</Text>
            <View style={styles.modalButtonRow}>
              {(["cash", "qris", "transfer"] as Payment[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={styles.modalButton}
                  onPress={() => selectPaymentMethod(m)}
                >
                  <Text style={styles.modalButtonText}>{m.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- STYLE SHEET ---------- */
const styles = StyleSheet.create({
  /* --- HEADER --- */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  header: { fontSize: 20, fontWeight: "bold" },
  subHeader: { fontSize: 16, marginBottom: 10, color: "#333" },
  settingsBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 18,
    padding: 5,
    elevation: 4,
    marginTop: 5,
    marginLeft: 3,
  },

  /* --- BALANCE --- */
  balanceContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderColor: "#D6EBFF",
    borderWidth: 1,
  },
  balanceDate: { fontSize: 14, fontWeight: "600", color: "#666" },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceBox: { flex: 1, alignItems: "center" },
  balanceTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  balanceValue: { fontSize: 18, fontWeight: "bold" },
  incomeValue: { fontSize: 18, fontWeight: "bold", color: "#28A745" },
  expenseValue: { fontSize: 18, fontWeight: "bold", color: "#FF3B30" },

  /* --- TOOL ROW --- */
  toolsRow: { flexDirection: "row", marginBottom: 12 },
  search: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D6EBFF",
  },
  filterBtn: {
    marginLeft: 8,
    backgroundColor: "#EAF4FF",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#007AFF",
  },

  /* --- CARD (ITEM) --- */
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderColor: "#D6EBFF",
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  name: { fontWeight: "700", fontSize: 16 },
  phone: { fontSize: 14 },

  statusChip: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 12, fontWeight: "600" },

  detailTitle: { marginTop: 4, fontWeight: "600" },
  itemText: {      /* ← memastikan detail tidak terpotong */
    fontSize: 14,
    marginTop: 2,
    flexWrap: "wrap",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  deadline: { fontSize: 12, fontWeight: "600" },
  onTime: { color: "#007AFF" },
  late: { color: "#FF3B30" },
  unpaid: { color: "#FF3B30", fontWeight: "700", fontSize: 12 },

  /* --- MODAL --- */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
});
