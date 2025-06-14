// // Updated ReportsScreen.tsx
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Dimensions,
//   TextInput,
//   TouchableOpacity,
//   Modal,
//   Platform,
// } from "react-native";
// import { LineChart } from "react-native-chart-kit";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import {
//   collection,
//   query,
//   where,
//   onSnapshot,
//   addDoc,
//   Timestamp,
// } from "firebase/firestore";
// import { db, auth } from "../../config/private-config/config/firebaseConfig";
// import { exportPDFReport } from "../utils/pdfReport";

// interface OrderDoc {
//   total: number | string;
//   createdAt?: Timestamp;
//   payment?: string;
//   note?: string;
// }
// interface ExpenseDoc {
//   amount: number | string;
//   note: string;
//   date?: Timestamp;
// }

// const monthNames = [
//   "Jan",
//   "Feb",
//   "Mar",
//   "Apr",
//   "Mei",
//   "Jun",
//   "Jul",
//   "Agu",
//   "Sep",
//   "Okt",
//   "Nov",
//   "Des",
// ];
// const screenWidth = Dimensions.get("window").width;

// export default function ReportsScreen() {
//   const [orders, setOrders] = useState<OrderDoc[]>([]);
//   const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
//   const [modal, setModal] = useState(false);
//   const [modalType, setModalType] = useState<"income" | "expense">("expense");
//   const [newAmt, setNewAmt] = useState("");
//   const [newNote, setNewNote] = useState("");
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

//   useEffect(() => {
//     const uid = auth.currentUser?.uid;
//     if (!uid) return;
//     const oUn = onSnapshot(
//       query(collection(db, "orders"), where("ownerId", "==", uid)),
//       (s) =>
//         setOrders(
//           s.docs.map(
//             (d) => d.data({ serverTimestamps: "estimate" }) as OrderDoc
//           )
//         )
//     );
//     const eUn = onSnapshot(
//       query(collection(db, "expenses"), where("ownerId", "==", uid)),
//       (s) =>
//         setExpenses(
//           s.docs.map(
//             (d) => d.data({ serverTimestamps: "estimate" }) as ExpenseDoc
//           )
//         )
//     );
//     return () => {
//       oUn();
//       eUn();
//     };
//   }, []);

//   const filtered = useMemo(() => {
//     let income = 0;
//     let expense = 0;

//     orders.forEach((o) => {
//       if (o.payment === "unpaid" || !o.createdAt) return;
//       const d = o.createdAt.toDate();
//       if (d.getFullYear() !== selectedYear) return;
//       if (selectedMonth !== null && d.getMonth() !== selectedMonth) return;
//       income += +o.total || 0;
//     });

//     expenses.forEach((e) => {
//       if (!e.date) return;
//       const d = e.date.toDate();
//       if (d.getFullYear() !== selectedYear) return;
//       if (selectedMonth !== null && d.getMonth() !== selectedMonth) return;
//       expense += +e.amount || 0;
//     });

//     return { income, expense, profit: income - expense };
//   }, [orders, expenses, selectedYear, selectedMonth]);

//   const chartData = useMemo(() => {
//     const monthlyIncome = Array(12).fill(0);
//     orders.forEach((o) => {
//       if (o.payment === "unpaid" || !o.createdAt) return;
//       const d = o.createdAt.toDate();
//       if (d.getFullYear() !== selectedYear) return;
//       monthlyIncome[d.getMonth()] += +o.total || 0;
//     });
//     return {
//       labels: monthNames,
//       datasets: [
//         {
//           data: monthlyIncome.map((i) => i / 1_000_000),
//           strokeWidth: 2,
//           color: () => "#4CAF50",
//         },
//       ],
//     };
//   }, [orders, selectedYear]);

//   const saveTransaction = async () => {
//     const amt = +newAmt;
//     if (!amt || !newNote.trim()) return alert("Nominal & catatan wajib");
//     const uid = auth.currentUser?.uid;
//     if (!uid) return alert("User tidak ditemukan");

//     try {
//       if (modalType === "expense") {
//         await addDoc(collection(db, "expenses"), {
//           amount: amt,
//           note: newNote.trim(),
//           date: Timestamp.now(),
//           ownerId: uid,
//         });
//       } else {
//         await addDoc(collection(db, "orders"), {
//           total: amt,
//           createdAt: Timestamp.now(),
//           payment: "paid",
//           ownerId: uid,
//           note: newNote.trim(),
//         });
//       }
//       setNewAmt("");
//       setNewNote("");
//       setModal(false);
//     } catch (err) {
//       console.error(err);
//       alert("Gagal menyimpan data");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={{ padding: 16 }}>
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Laporan Keuangan</Text>
//         <View style={styles.filterRow}>
//           <Text>Tahun: </Text>
//           <TextInput
//             style={styles.yearInput}
//             keyboardType="number-pad"
//             value={selectedYear.toString()}
//             onChangeText={(t) =>
//               setSelectedYear(parseInt(t) || new Date().getFullYear())
//             }
//           />
//         </View>

//         <View style={styles.filterRow}>
//           <Text>Bulan: </Text>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             <TouchableOpacity
//               style={[
//                 styles.monthBtn,
//                 selectedMonth === null && styles.monthBtnActive,
//               ]}
//               onPress={() => setSelectedMonth(null)}
//             >
//               <Text
//                 style={[
//                   styles.monthText,
//                   selectedMonth === null && styles.monthTextActive,
//                 ]}
//               >
//                 Semua
//               </Text>
//             </TouchableOpacity>
//             {monthNames.map((name, i) => (
//               <TouchableOpacity
//                 key={i}
//                 style={[
//                   styles.monthBtn,
//                   selectedMonth === i && styles.monthBtnActive,
//                 ]}
//                 onPress={() => setSelectedMonth(i === selectedMonth ? null : i)}
//               >
//                 <Text
//                   style={[
//                     styles.monthText,
//                     selectedMonth === i && styles.monthTextActive,
//                   ]}
//                 >
//                   {name}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>

//         <TouchableOpacity
//           style={[
//             styles.actionBtn,
//             { backgroundColor: "#007AFF", marginTop: 10, marginBottom: 10 },
//           ]}
//           onPress={() => {
//             exportPDFReport({
//               year: selectedYear,
//               month: selectedMonth,
//               orders,
//               expenses,
//             });
//           }}
//         >
//           <Ionicons name="download" size={20} color="#fff" />
//           <Text style={styles.btnText}>Ekspor PDF</Text>
//         </TouchableOpacity>

//         <View style={styles.rowWrap}>
//           <NumberBox
//             label="Pemasukan"
//             value={filtered.income}
//             color="#4CAF50"
//           />
//           <NumberBox
//             label="Pengeluaran"
//             value={filtered.expense}
//             color="#F44336"
//           />
//         </View>
//         <TouchableOpacity
//           style={styles.profitBox}
//           onPress={() => {
//             setModalType("income");
//             setModal(true);
//           }}
//         >
//           <Text style={styles.profitLabel}>Laba Bersih</Text>
//           <Text
//             style={[
//               styles.profitValue,
//               { color: filtered.profit >= 0 ? "#4CAF50" : "#F44336" },
//             ]}
//           >
//             Rp. {filtered.profit.toLocaleString("id-ID")}
//           </Text>
//           <Ionicons
//             name="add-circle"
//             size={20}
//             color="#4CAF50"
//             style={{ marginTop: 6 }}
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Grafik Pemasukan {selectedYear}</Text>
//         <LineChart
//           data={chartData}
//           width={screenWidth - 48}
//           height={200}
//           chartConfig={{
//             backgroundColor: "#fff",
//             backgroundGradientFrom: "#fff",
//             backgroundGradientTo: "#fff",
//             decimalPlaces: 0,
//             color: () => "#4CAF50",
//             labelColor: () => "#333",
//             propsForDots: { r: "4", strokeWidth: "1", stroke: "#4CAF50" },
//             propsForBackgroundLines: { stroke: "#eee" },
//           }}
//           bezier
//           style={{ marginVertical: 8 }}
//         />
//         <Text style={styles.chartNote}>*Nilai dalam jutaan Rupiah</Text>
//       </View>

//       <View style={styles.buttonRow}>
//         <TouchableOpacity
//           style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
//           onPress={() => {
//             setModalType("income");
//             setModal(true);
//           }}
//         >
//           <Ionicons name="add" size={20} color="#fff" />
//           <Text style={styles.btnText}>Pemasukan</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.actionBtn, { backgroundColor: "#F44336" }]}
//           onPress={() => {
//             setModalType("expense");
//             setModal(true);
//           }}
//         >
//           <Ionicons name="remove" size={20} color="#fff" />
//           <Text style={styles.btnText}>Pengeluaran</Text>
//         </TouchableOpacity>
//       </View>

//       <Modal visible={modal} transparent animationType="slide">
//         <View style={styles.modalBg}>
//           <View style={styles.modalCard}>
//             <Text style={styles.modalTitle}>
//               {modalType === "expense"
//                 ? "Tambah Pengeluaran"
//                 : "Tambah Pemasukan"}
//             </Text>
//             <TextInput
//               placeholder="Nominal (Rp.)"
//               keyboardType={Platform.select({
//                 ios: "number-pad",
//                 android: "decimal-pad",
//               })}
//               style={styles.input}
//               value={newAmt}
//               onChangeText={setNewAmt}
//             />
//             <TextInput
//               placeholder="Catatan"
//               style={[styles.input, { height: 60 }]}
//               multiline
//               value={newNote}
//               onChangeText={setNewNote}
//             />
//             <View style={styles.modalBtns}>
//               <TouchableOpacity
//                 style={[styles.modalBtn, { backgroundColor: "#ccc" }]}
//                 onPress={() => setModal(false)}
//               >
//                 <Text>Batal</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalBtn, { backgroundColor: "#007AFF" }]}
//                 onPress={saveTransaction}
//               >
//                 <Text style={{ color: "#fff", fontWeight: "600" }}>Simpan</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// }

// function NumberBox({
//   label,
//   value,
//   color,
// }: {
//   label: string;
//   value: number;
//   color: string;
// }) {
//   return (
//     <View style={styles.numberBox}>
//       <Text style={styles.numberLabel}>{label}</Text>
//       <Text style={[styles.numberValue, { color }]}>
//         Rp. {value.toLocaleString("id-ID")}
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     elevation: 2,
//   },
//   cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
//   filterRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
//   yearInput: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 8,
//     width: 80,
//     textAlign: "center",
//   },
//   monthBtn: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     marginRight: 8,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 16,
//   },
//   monthBtnActive: { backgroundColor: "#007AFF" },
//   monthText: { fontSize: 14, color: "#333" },
//   monthTextActive: { color: "#fff" },
//   rowWrap: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 16,
//   },
//   numberBox: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//     borderRadius: 8,
//     padding: 12,
//     marginHorizontal: 4,
//   },
//   numberLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
//   numberValue: { fontSize: 16, fontWeight: "bold" },
//   profitBox: {
//     backgroundColor: "#f8f9fa",
//     borderRadius: 8,
//     padding: 16,
//     alignItems: "center",
//   },
//   profitLabel: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
//   profitValue: { fontSize: 24, fontWeight: "bold" },
//   chartNote: { fontSize: 12, color: "#666", textAlign: "center", marginTop: 8 },
//   buttonRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
//   actionBtn: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 12,
//     borderRadius: 8,
//   },
//   btnText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
//   modalBg: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     padding: 20,
//   },
//   modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 20 },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 16,
//     textAlign: "center",
//   },
//   input: {
//     backgroundColor: "#f8f9fa",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "#ddd",
//   },
//   modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
//   modalBtn: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   exportBtnWrapper: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginBottom: 16,
//   },
// });


// ReportsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../config/private-config/config/firebaseConfig";
import { exportPDFReport } from "../utils/pdfReport";

interface OrderDoc {
  total: number | string;
  createdAt?: Timestamp;
  payment?: string;
  note?: string;
}
interface ExpenseDoc {
  amount: number | string;
  note: string;
  date?: Timestamp;
}

const monthNames = [
  "Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"
];

export default function ReportsScreen() {
  const { width: screenWidth } = useWindowDimensions();

  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
  const [modal, setModal] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("expense");
  const [newAmt, setNewAmt] = useState("");
  const [newNote, setNewNote] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const oUn = onSnapshot(
      query(collection(db, "orders"), where("ownerId", "==", uid)),
      s => setOrders(s.docs.map(d => d.data({ serverTimestamps: "estimate" }) as OrderDoc))
    );
    const eUn = onSnapshot(
      query(collection(db, "expenses"), where("ownerId", "==", uid)),
      s => setExpenses(s.docs.map(d => d.data({ serverTimestamps: "estimate" }) as ExpenseDoc))
    );
    return () => { oUn(); eUn(); };
  }, []);

  const filtered = useMemo(() => {
    let income = 0, expense = 0;
    orders.forEach(o => {
      if (o.payment === "unpaid" || !o.createdAt) return;
      const d = o.createdAt.toDate();
      if (d.getFullYear() !== selectedYear) return;
      if (selectedMonth !== null && d.getMonth() !== selectedMonth) return;
      income += +o.total || 0;
    });
    expenses.forEach(e => {
      if (!e.date) return;
      const d = e.date.toDate();
      if (d.getFullYear() !== selectedYear) return;
      if (selectedMonth !== null && d.getMonth() !== selectedMonth) return;
      expense += +e.amount || 0;
    });
    return { income, expense, profit: income - expense };
  }, [orders, expenses, selectedYear, selectedMonth]);

  const chartData = useMemo(() => {
    const monthlyIncome = Array(12).fill(0);
    orders.forEach(o => {
      if (o.payment === "unpaid" || !o.createdAt) return;
      const d = o.createdAt.toDate();
      if (d.getFullYear() !== selectedYear) return;
      monthlyIncome[d.getMonth()] += +o.total || 0;
    });
    return {
      labels: monthNames,
      datasets: [{
        data: monthlyIncome.map(i => i / 1_000_000),
        strokeWidth: 2,
        color: () => "#4CAF50",
      }],
    };
  }, [orders, selectedYear]);

  const saveTransaction = async () => {
    const amt = +newAmt;
    if (!amt || !newNote.trim()) return alert("Nominal & catatan wajib");
    const uid = auth.currentUser?.uid;
    if (!uid) return alert("User tidak ditemukan");
    try {
      if (modalType === "expense") {
        await addDoc(collection(db, "expenses"), {
          amount: amt,
          note: newNote.trim(),
          date: Timestamp.now(),
          ownerId: uid,
        });
      } else {
        await addDoc(collection(db, "orders"), {
          total: amt,
          createdAt: Timestamp.now(),
          payment: "paid",
          ownerId: uid,
          note: newNote.trim(),
        });
      }
      setNewAmt(""); setNewNote(""); setModal(false);
    } catch {
      alert("Gagal menyimpan data");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Header Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Laporan Keuangan</Text>

        {/* Year Filter */}
        <View style={styles.filterRow}>
          <Text>Tahun: </Text>
          <TextInput
            style={styles.yearInput}
            keyboardType="number-pad"
            value={selectedYear.toString()}
            onChangeText={t => setSelectedYear(parseInt(t) || new Date().getFullYear())}
          />
        </View>

        {/* Month Filter */}
        <View style={styles.filterRow}>
          <Text>Bulan: </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.monthBtn, selectedMonth === null && styles.monthBtnActive]}
              onPress={() => setSelectedMonth(null)}
            >
              <Text style={[styles.monthText, selectedMonth === null && styles.monthTextActive]}>Semua</Text>
            </TouchableOpacity>
            {monthNames.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.monthBtn, selectedMonth === i && styles.monthBtnActive]}
                onPress={() => setSelectedMonth(i === selectedMonth ? null : i)}
              >
                <Text style={[styles.monthText, selectedMonth === i && styles.monthTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#007AFF", marginVertical: 10 }]}
          onPress={() => exportPDFReport({ year: selectedYear, month: selectedMonth, orders, expenses })}
        >
          <Ionicons name="download" size={20} color="#fff" />
          <Text style={styles.btnText}>Ekspor PDF</Text>
        </TouchableOpacity>

        {/* Income/Expense Boxes */}
        <View style={styles.rowWrap}>
          <NumberBox label="Pemasukan" value={filtered.income} color="#4CAF50" />
          <NumberBox label="Pengeluaran" value={filtered.expense} color="#F44336" />
        </View>

        {/* Profit Box */}
        <TouchableOpacity
          style={styles.profitBox}
          onPress={() => { setModalType("income"); setModal(true); }}
        >
          <Text style={styles.profitLabel}>Laba Bersih</Text>
          <Text style={[styles.profitValue, { color: filtered.profit >= 0 ? "#4CAF50" : "#F44336" }]}>
            Rp. {filtered.profit.toLocaleString("id-ID")}
          </Text>
          <Ionicons name="add-circle" size={20} color="#4CAF50" style={{ marginTop: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Chart Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Grafik Pemasukan {selectedYear}</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 35}   // <-- dynamic width
          height={200}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: () => "#4CAF50",
            labelColor: () => "#333",
            propsForDots: { r: "4", strokeWidth: "1", stroke: "#4CAF50" },
            propsForBackgroundLines: { stroke: "#eee" },
          }}
          bezier
          style={styles.chart}
        />
        <Text style={styles.chartNote}>*Nilai dalam jutaan Rupiah</Text>
      </View>

      {/* Add Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
          onPress={() => { setModalType("income"); setModal(true); }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.btnText}>Pemasukan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#F44336" }]}
          onPress={() => { setModalType("expense"); setModal(true); }}
        >
          <Ionicons name="remove" size={20} color="#fff" />
          <Text style={styles.btnText}>Pengeluaran</Text>
        </TouchableOpacity>
      </View>

      {/* Add Transaction Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalType === "expense" ? "Tambah Pengeluaran" : "Tambah Pemasukan"}
            </Text>
            <TextInput
              placeholder="Nominal (Rp.)"
              keyboardType={Platform.select({ ios: "number-pad", android: "decimal-pad" })}
              style={styles.input}
              value={newAmt}
              onChangeText={setNewAmt}
            />
            <TextInput
              placeholder="Catatan"
              style={[styles.input, { height: 60 }]}
              multiline
              value={newNote}
              onChangeText={setNewNote}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#ccc" }]} onPress={() => setModal(false)}>
                <Text>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#007AFF" }]} onPress={saveTransaction}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function NumberBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.numberBox}>
      <Text style={styles.numberLabel}>{label}</Text>
      <Text style={[styles.numberValue, { color }]}>Rp. {value.toLocaleString("id-ID")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  filterRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  yearInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: "center",
  },
  monthBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
  },
  monthBtnActive: { backgroundColor: "#007AFF" },
  monthText: { fontSize: 14, color: "#333" },
  monthTextActive: { color: "#fff" },
  rowWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  numberBox: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  numberLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
  numberValue: { fontSize: 16, fontWeight: "bold" },
  profitBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  profitLabel: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  profitValue: { fontSize: 24, fontWeight: "bold" },
  chartNote: { fontSize: 12, color: "#666", textAlign: "center", marginTop: 8 },
  buttonRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  chartWrapper: {
  alignItems: "center",        // membuat konten di dalamnya rata tengah
  marginVertical: 8,
  },
  chart: {
    alignSelf: "center",        // memastikan chart berada di tengah
    marginLeft: -2 
  },

});
