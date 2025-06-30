/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { auth, db } from "../../config/private-config/config/firebaseConfig";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import SamplePrint from "./setting/SamplePrint";

/* ───────────────────────────── TYPES ───────────────────────────── */
type Step = 0 | 1 | 2;
type PayMethod = "cash" | "qris" | "transfer" | "deposit" | "unpaid";

interface LaundryItem {
  service: string;
  weight: string;
  price: string;
  note: string;
  unit: "kg" | "pcs";
}
interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  isMember?: boolean;
  depositBalance?: number;
}

interface SellItem {
  id: string;
  name: string;
  stock: number;
  price: number;
  qty: string;
}

/* ---------- STYLE SHEET ---------- */
const styles = StyleSheet.create({
  /* STEP HEADER */
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "#fff",
    elevation: 2,
  },
  stepItem: { alignItems: "center" },
  stepLabel: { fontSize: 12, marginTop: 4, color: "#bbb" },

  /* INPUTS */
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: "#000",
  },
  numericInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: "#000",
    textAlign: "center",
  },
  readonlyInput: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: "#555",
  },
  row: { flexDirection: "row", marginBottom: 12 },

  /* CARD */
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  cardTitle: { fontWeight: "bold", marginBottom: 12, fontSize: 16 },

  /* BUTTON */
  btnNext: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  btnTxt: { color: "#fff", fontWeight: "600", fontSize: 16 },

  /* TOTAL */
  totalContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  /* PAYMENT */
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  paymentOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#EAF4FF",
  },
  paymentText: { marginLeft: 10, fontSize: 16 },

  /* AUTOCOMPLETE */
  autoWrap: { position: "relative", marginBottom: 12 },
  autoList: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
    zIndex: 20,
  },
  autoItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  /* REVIEW BLUE CARD */
  cardBlue: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  btnDiscount: {
    marginTop: 12,
    backgroundColor: "#28A745",
    padding: 10,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: { color: "#fff", fontWeight: "bold" },
  detailValue: { color: "#fff", fontWeight: "bold" },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  radioRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
  },
  radio: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  radioActive: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    backgroundColor: "#EAF4FF",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
});

/* ───────────────────────── COMPONENT ───────────────────────── */
export default function LaundryFormScreen() {
  /* ---------- STATE ---------- */
  const [step, setStep] = useState<Step>(0);
  const [orderId, setOrderId] = useState<number | null>(null);

  const [sellItems, setSellItems] = useState<SellItem[]>([]);
  const [inventorySellList, setInventorySellList] = useState<SellItem[]>([]);

  const [phoneText, setPhoneText] = useState("");
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [selectedCust, setSelectedCust] = useState<CustomerInfo | null>(null);
  const phoneInputRef = useRef<TextInput>(null);

  const [inDate, setInDate] = useState<Date | null>(null);
  const [outDate, setOutDate] = useState<Date | null>(null);
  const [datePicker, setDatePicker] = useState({
    open: false,
    which: "in" as "in" | "out",
  });

  const [items, setItems] = useState<LaundryItem[]>([
    { service: "", weight: "", price: "", note: "", unit: "kg" },
  ]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [openSvcIdx, setOpenSvcIdx] = useState<number | null>(null);

  const [pay, setPay] = useState<PayMethod>("unpaid");
  const [discountType, setDiscountType] = useState<"nominal" | "percent">(
    "nominal"
  );
  const [discountInput, setDiscountInput] = useState<string>("0");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isDiscountModalVisible, setDiscountModalVisible] =
    useState<boolean>(false);

  /* ─── LOAD FIRESTORE DATA ─── */
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    return onSnapshot(
      query(collection(db, "customers"), where("ownerId", "==", u.uid)),
      (snap) =>
        setCustomers(
          snap.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              name: data.name,
              phone: data.phone,
              isMember: data.isMember ?? false,
              depositBalance: data.depositBalance ?? 0,
            } as CustomerInfo;
          })
        )
    );
  }, []);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const q = query(
      collection(db, "inventory"),
      where("ownerId", "==", u.uid),
      where("isSellable", "==", true)
    );
    return onSnapshot(q, (snap) => {
      setInventorySellList(
        snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name,
            stock: data.stock,
            price: data.price || 0,
            qty: "0",
          };
        })
      );
    });
  }, []);

  useEffect(() => {
    const col = collection(db, "list_laundry");
    return onSnapshot(col, (snap) =>
      setServiceOptions(
        snap.docs.flatMap((d) => {
          const data = d.data() as any;
          if (Array.isArray(data.list)) return data.list;
          if (typeof data.list === "string") return [data.list];
          if (typeof data.name === "string") return [data.name];
          return [];
        })
      )
    );
  }, []);

  /* generate orderId ketika review */
  useEffect(() => {
    if (step === 2 && !orderId) setOrderId(Date.now());
  }, [step, orderId]);

  /* ─── COMPUTED ─── */
  const filteredCust = customers.filter((c) =>
    c.phone.includes(phoneText.trim())
  );
  const totalHarga = items.reduce((s, it) => s + +it.weight * +it.price, 0);
  // total harga barang jualan
  const totalSell = inventorySellList.reduce(
    (sum, it) =>
      sum +
      parseFloat(it.price?.toString() || "0") *
        (parseInt(it.qty || "0", 10) || 0),
    0
  );

  // grand total = layanan + barang – diskon
  const grandTotal = totalHarga + totalSell - discountAmount;

  const totalAfterDiscount = Math.max(0, totalHarga - discountAmount);
  const roundedCashTotal =
    pay === "cash"
      ? Math.ceil(totalAfterDiscount / 1000) * 1000
      : totalAfterDiscount;

  /* ─── HELPERS ─── */
  const addService = () =>
    setItems([
      ...items,
      { service: "", weight: "", price: "", note: "", unit: "kg" },
    ]);

  const updateItem = <K extends keyof LaundryItem>(
    idx: number,
    key: K,
    val: LaundryItem[K]
  ) => {
    const next = [...items];
    next[idx][key] = val;
    setItems(next);
  };

  const handleWeightBlur = (idx: number) => {
    const w = parseFloat(items[idx].weight || "0");
    if (w > 0 && w < 3 && items[idx].unit === "kg") {
      Alert.alert(
        "Konfirmasi Satuan",
        `Jumlah ${w} kurang dari minimum 3 kg. Hitung per PCS atau tetap 3 kg?`,
        [
          { text: "Per PCS", onPress: () => updateItem(idx, "unit", "pcs") },
          {
            text: "Minimal 3 KG",
            onPress: () => updateItem(idx, "weight", "3"),
          },
        ]
      );
    }
  };

  const openPicker = (which: "in" | "out") =>
    setDatePicker({ open: true, which });
  const closePicker = () => setDatePicker((p) => ({ ...p, open: false }));
  const onConfirmDate = (d: Date) => {
    datePicker.which === "in" ? setInDate(d) : setOutDate(d);
    closePicker();
  };

  /* ─── SAVE ORDER ─── */
  const saveOrder = async () => {
    if (!selectedCust)
      return Alert.alert("Perhatian", "Pilih pelanggan dahulu!");
    if (!orderId) return Alert.alert("Perhatian", "ID pesanan belum dibuat.");
    // (Opsional) cek saldo deposit
    if (pay === "deposit" && (selectedCust.depositBalance ?? 0) < grandTotal) {
      return alert("Saldo deposit tidak mencukupi!");
    }
    try {
      const total = grandTotal;

      /* ORDERS */
      await setDoc(doc(db, "orders", orderId.toString()), {
        orderNumber: orderId,
        customerId: selectedCust.id,
        customerName: selectedCust.name,
        phone: selectedCust.phone,
        inDate,
        outDate,
        items,
        total,
        discount: discountAmount,
        payment: pay,
        ownerId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });

      /* LAUNDRY (dashboard) */
      await setDoc(doc(db, "laundry", orderId.toString()), {
        orderNumber: orderId,
        name: selectedCust.name,
        phone: selectedCust.phone,
        items: items.map((it) => {
          const sub = (+it.weight * +it.price).toLocaleString("id-ID");
          const note = it.note ? ` - ${it.note}` : "";
          return `${it.service} ${it.weight}${
            it.unit === "pcs" ? " pcs" : " kg"
          } × Rp${it.price}${note} = Rp${sub}`;
        }),
        status: "Sedang Diproses",
        payment: pay,
        deadline: outDate,
        discount: discountAmount,
        ownerId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });

      /* increment customer */
      await updateDoc(doc(db, "customers", selectedCust.id), {
        totalOrders: increment(1),
      });

      // d. potong deposit pelanggan jika perlu
      if (pay === "deposit") {
        await updateDoc(doc(db, "customers", selectedCust.id), {
          depositBalance: increment(-grandTotal),
        });
      }

      /* e. update stok inventory */
      const sold = inventorySellList
        .map((it) => ({ id: it.id, qty: parseInt(it.qty, 10) || 0 }))
        .filter((it) => it.qty > 0);

      await Promise.all(
        sold.map((it) =>
          updateDoc(doc(db, "inventory", it.id), {
            stock: increment(-it.qty),
          })
        )
      );

      Alert.alert("Berhasil", "Pesanan tersimpan.");

      /* reset */
      setStep(0);
      setOrderId(null);
      setSelectedCust(null);
      setPhoneText("");
      setInDate(null);
      setOutDate(null);
      setItems([{ service: "", weight: "", price: "", note: "", unit: "kg" }]);
      setPay("unpaid");
      setDiscountAmount(0);
      setDiscountInput("0");
    } catch (e: any) {
      Alert.alert("Gagal", String(e.message || e));
    }
  };

  /* ─── EXPORT PDF ─── */
  const exportToPdf = async () => {
    const rows = items
      .map(
        (it) => `<tr>
          <td>${it.service}${it.note ? `<br/><i>${it.note}</i>` : ""}</td>
          <td style="text-align:center;">${it.weight}${
          it.unit === "pcs" ? " pcs" : " kg"
        }</td>
          <td style="text-align:right;">Rp${(+it.price).toLocaleString(
            "id-ID"
          )}</td>
          <td style="text-align:right;">Rp${(
            +it.price * +it.weight
          ).toLocaleString("id-ID")}</td>
        </tr>`
      )
      .join("");

    const totalTxt = roundedCashTotal.toLocaleString("id-ID");

    const html = `
      <html><head><meta charset="utf-8"/>
      <style>
        body{font-family:Arial;margin:24px;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        th,td{border:1px solid #ccc;padding:6px;word-wrap:break-word;white-space:pre-wrap;}
        hr{border:none;border-top:1px solid #000;margin:12px 0}
      </style>
      </head><body>
      <h2 style="text-align:center;margin:0">IFA CELL &amp; LAUNDRY</h2>
      <p style="text-align:center;margin:0">
        Jln. Bumi Tamalanrea Permai No.18<br/>
        Tamalanrea, Makassar, Sulawesi Selatan 90245<br/>
        Telp: 0821-9482-2418
      </p>
      <hr/>
      <h3>Nota Order #${orderId}</h3>
      <p>
        <b>Nama&nbsp;&nbsp;&nbsp;&nbsp;:</b> ${selectedCust?.name}<br/>
        <b>No. WA&nbsp;:</b> ${selectedCust?.phone}<br/>
        <b>Tgl/Jam Masuk&nbsp;&nbsp;&nbsp;&nbsp;:</b> ${inDate?.toLocaleString(
          "id-ID"
        )}<br/>
        <b>Tgl/Jam Estimasi :</b> ${outDate?.toLocaleString("id-ID")}
      </p>
      <table>
        <thead>
          <tr><th style="width:45%">Layanan</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align:right;">Diskon</td>
            <td style="text-align:right;">- Rp${discountAmount.toLocaleString(
              "id-ID"
            )}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align:right;font-weight:bold">TOTAL</td>
            <td style="text-align:right;font-weight:bold">Rp ${totalTxt}</td>
          </tr>
        </tfoot>
      </table>
      <p><b>Pembayaran:</b> ${
        pay === "deposit"
          ? "Deposit"
          : pay === "cash"
          ? "Cash"
          : pay === "qris"
          ? "QRIS"
          : pay === "transfer"
          ? "Transfer"
          : "Belum Bayar"
      }</p>
      </body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      UTI: ".pdf",
      mimeType: "application/pdf",
    });
  };

  /* ─── CETAK STRUK OWNER (BARU) ─── */
  const printOwnerReceipt = async () => {
    // Ganti logika di sini jika sudah terhubung ke printer.
    Alert.alert("Cetak Struk Owner", "Perintah cetak berhasil dijalankan!");
  };

  /* ─── STEP 0 : Laundry ─── */
  const renderLaundryStep = () => (
    <KeyboardAwareScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
    >
      {/* PHONE + AUTOCOMPLETE */}
      <View style={styles.autoWrap}>
        <TextInput
          ref={phoneInputRef}
          style={styles.input}
          placeholder="Nomor Telepon / WhatsApp"
          value={selectedCust ? selectedCust.phone : phoneText}
          keyboardType="phone-pad"
          onChangeText={(t) => {
            setSelectedCust(null);
            setPhoneText(t);
          }}
          blurOnSubmit={false}
          returnKeyType="done"
        />
        {!selectedCust && phoneText.length > 0 && (
          <ScrollView
            style={styles.autoList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {filteredCust.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  setSelectedCust(c);
                  setPhoneText(c.phone);
                }}
              >
                <Text style={styles.autoItem}>
                  {c.phone} · {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* NAMA & DATE TIME */}
      <TextInput
        placeholder="Nama Pelanggan"
        style={styles.input}
        value={selectedCust?.name || ""}
        editable={false}
      />

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.input, { flex: 1, marginRight: 6 }]}
          onPress={() => openPicker("in")}
        >
          <Text style={{ color: inDate ? "#000" : "#888" }}>
            {inDate ? inDate.toLocaleString("id-ID") : "Tanggal & Jam Masuk"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.input, { flex: 1, marginLeft: 6 }]}
          onPress={() => openPicker("out")}
        >
          <Text style={{ color: outDate ? "#000" : "#888" }}>
            {outDate ? outDate.toLocaleString("id-ID") : "Tanggal & Jam Keluar"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ITEM LIST */}
      {items.map((it, i) => (
        <View
          key={i}
          style={[
            styles.card,
            { marginBottom: 16, backgroundColor: "#EAF4FF" },
          ]}
        >
          <Text style={styles.cardTitle}>Layanan #{i + 1}</Text>

          {/* SERVICE + AUTOCOMPLETE */}
          <View style={styles.autoWrap}>
            <TextInput
              style={styles.input}
              placeholder="Jenis Layanan"
              value={it.service}
              onChangeText={(t) => {
                updateItem(i, "service", t);
                setOpenSvcIdx(i);
              }}
              onFocus={() => setOpenSvcIdx(i)}
              onBlur={() => setTimeout(() => setOpenSvcIdx(null), 150)}
            />
            {openSvcIdx === i && it.service.length > 0 && (
              <ScrollView
                style={styles.autoList}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {serviceOptions
                  .filter((opt) =>
                    opt.toLowerCase().includes(it.service.toLowerCase())
                  )
                  .map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        updateItem(i, "service", opt);
                        setOpenSvcIdx(null);
                      }}
                    >
                      <Text style={styles.autoItem}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}
          </View>

          {/* QTY & PRICE */}
          <View style={styles.row}>
            <TextInput
              placeholder={`Jumlah (${it.unit === "pcs" ? "Pcs" : "Kg"})`}
              style={[styles.numericInput, { flex: 1, marginRight: 6 }]}
              keyboardType="decimal-pad"
              value={it.weight}
              onChangeText={(t) => updateItem(i, "weight", t)}
              onEndEditing={() => handleWeightBlur(i)}
            />
            <TextInput
              placeholder="Harga Satuan"
              style={[styles.numericInput, { flex: 1, marginLeft: 6 }]}
              keyboardType="decimal-pad"
              value={it.price}
              onChangeText={(t) => updateItem(i, "price", t)}
            />
            <TextInput
              placeholder="Subtotal (Rp)"
              style={[
                styles.readonlyInput,
                { flex: 1, marginLeft: 6, textAlign: "center" },
              ]}
              value={(
                parseFloat(it.weight || "0") * parseFloat(it.price || "0")
              ).toLocaleString("id-ID")}
              editable={false}
            />
          </View>

          {/* NOTE */}
          <TextInput
            placeholder="Catatan"
            style={[styles.input, { height: 70 }]}
            multiline
            value={it.note}
            onChangeText={(t) => updateItem(i, "note", t)}
          />

          {/* === SECTION BARANG JUALAN === */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.cardTitle}>Item Lain</Text>

            {inventorySellList.map((prod, idx) => {
              const qtyNum = parseInt(prod.qty, 10) || 0;
              const lineTotal = prod.price * qtyNum;
              return (
                <View
                  key={prod.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  {/* 1. Nama Produk (flex 1) */}
                  <Text
                    style={{ flex: 1, fontWeight: "600" }}
                    numberOfLines={1}
                  >
                    {prod.name}
                  </Text>

                  {/* 2. Kontainer scroll horizontal untuk Qty + Subtotal */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ flexDirection: "row" }}
                    style={{ flexShrink: 0 }}
                  >
                    {/* Card Qty */}
                    <View
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        paddingHorizontal: 8,
                        marginRight: 8,
                        flexShrink: 0,
                        justifyContent: "center",
                      }}
                    >
                      <TextInput
                        style={{ height: 36, textAlign: "center" }}
                        keyboardType="numeric"
                        placeholder="0"
                        value={prod.qty}
                        onChangeText={(v) => {
                          const arr = [...inventorySellList];
                          arr[idx].qty = v.replace(/[^0-9]/g, "");
                          setInventorySellList(arr);
                        }}
                      />
                    </View>

                    {/* Card Subtotal */}
                    <View
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        paddingHorizontal: 8,
                        flexShrink: 0,
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>
                        Rp{lineTotal.toLocaleString()}
                      </Text>
                    </View>
                  </ScrollView>
                </View>
              );
            })}

            {/* Subtotal Barang */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderTopWidth: 1,
                borderTopColor: "#ddd",
                paddingTop: 6,
                marginTop: 4,
              }}
            >
              <Text style={{ fontWeight: "bold" }}>Subtotal Barang</Text>
              <Text style={{ fontWeight: "bold" }}>
                Rp{totalSell.toLocaleString()}
              </Text>
            </View>
          </View>
          {/* === END SECTION BARANG JUALAN === */}

          {i === items.length - 1 && (
            <TouchableOpacity onPress={addService} style={{ marginTop: 8 }}>
              <Text style={{ color: "#007AFF", textAlign: "center" }}>
                + Tambah Layanan
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* TOTAL */}
      <View style={styles.totalContainer}>
        <Text style={{ fontWeight: "bold" }}>Estimasi Total :</Text>
        <Text style={{ fontWeight: "bold" }}>
          Rp {grandTotal.toLocaleString("id-ID")}
        </Text>
      </View>

      <TouchableOpacity style={styles.btnNext} onPress={() => setStep(1)}>
        <Text style={styles.btnTxt}>Lanjut Pembayaran</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );

  /* ─── STEP 1 : Payment ─── */
  const renderPaymentStep = () => (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
      <TouchableOpacity
        onPress={() => setStep(0)}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
      >
        <Ionicons name="arrow-back" size={20} color="#007AFF" />
        <Text style={{ color: "#007AFF", marginLeft: 4 }}>Kembali</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
          Detail Pelanggan
        </Text>
        <Text>Nama : {selectedCust?.name}</Text>
        <Text>No WA : {selectedCust?.phone}</Text>
        <Text>Total : Rp {totalHarga.toLocaleString("id-ID")}</Text>
      </View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={{ fontWeight: "bold", marginBottom: 12 }}>
          Metode Pembayaran
        </Text>
        {(["cash", "qris", "transfer", "deposit", "unpaid"] as const).map(
          (m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.paymentOption,
                pay === m && styles.paymentOptionSelected,
              ]}
              onPress={() => setPay(m)}
            >
              <Ionicons
                name={
                  m === "cash"
                    ? "cash"
                    : m === "qris"
                    ? "qr-code-outline"
                    : m === "transfer"
                    ? "swap-horizontal-outline"
                    : m === "deposit"
                    ? "wallet-outline"
                    : "alert-circle-outline"
                }
                size={20}
                color="#555"
              />
              <Text style={styles.paymentText}>
                {m === "cash"
                  ? "Cash"
                  : m === "qris"
                  ? "QRIS"
                  : m === "transfer"
                  ? "Transfer"
                  : m === "deposit"
                  ? "Deposit"
                  : "Belum Bayar"}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <TouchableOpacity
        style={[styles.btnNext, { marginTop: 20 }]}
        onPress={() => setStep(2)}
      >
        <Text style={styles.btnTxt}>Lanjut Review Pesanan</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  /* ─── STEP 2 : Review ─── */
  const renderReviewStep = () => {
    const orderData = {
      orderNumber: orderId,
      customerName: selectedCust?.name,
      phone: selectedCust?.phone,
      inDate,
      outDate,
      items,
      total: roundedCashTotal,
      discount: discountAmount,
      payment: pay,
    };
    return (
      /* objek yang akan dikirim ke komponen SamplePrint */
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <TouchableOpacity
          onPress={() => setStep(1)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#007AFF" />
          <Text style={{ color: "#007AFF", marginLeft: 4 }}>Kembali</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
          Review Pesanan
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nomor Pesanan</Text>
          <Text>{orderId}</Text>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Pelanggan</Text>
          <Text>Nama: {selectedCust?.name}</Text>
          <Text>No. WA: {selectedCust?.phone}</Text>
          <Text>Tgl Masuk: {inDate?.toLocaleString("id-ID")}</Text>
          <Text>Tgl Keluar: {outDate?.toLocaleString("id-ID")}</Text>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Detail Layanan</Text>
          {items.map((it, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <Text>
                {it.service} · {it.weight}×Rp
                {parseFloat(it.price || "0").toLocaleString("id-ID")}
                {it.unit === "pcs" ? "pcs" : "kg"}×Rp{it.price}
              </Text>
              <Text>
                Subtotal: Rp{" "}
                {(
                  parseFloat(it.weight || "0") * parseFloat(it.price || "0")
                ).toLocaleString("id-ID")}
              </Text>
              {it.note ? <Text>Catatan: {it.note}</Text> : null}
            </View>
          ))}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Layanan</Text>
            <Text style={styles.detailValue}>
              Rp {totalHarga.toLocaleString("id-ID")}
            </Text>
          </View>
        </View>

        {/* Barang Terjual (jika ada) */}
        {inventorySellList.filter((it) => parseInt(it.qty, 10) > 0).length >
          0 && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.cardTitle}>Detail Item</Text>
            {inventorySellList
              .filter((it) => parseInt(it.qty, 10) > 0)
              .map((it, i) => (
                <View key={i} style={styles.detailRow}>
                  <Text>
                    {it.name} ×{it.qty}
                  </Text>
                  <Text>
                    Rp{" "}
                    {(it.price * parseInt(it.qty, 10)).toLocaleString("id-ID")}
                  </Text>
                </View>
              ))}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Barang</Text>
              <Text style={styles.detailValue}>
                Rp {totalSell.toLocaleString("id-ID")}
              </Text>
            </View>
          </View>
        )}

        {/* Grand Total */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Total Pesanan</Text>
          <Text style={[styles.detailValue, { fontSize: 18 }]}>
            Rp {grandTotal.toLocaleString("id-ID")}
          </Text>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Metode Pembayaran</Text>
          <Text>
            {pay === "deposit"
              ? "Deposit"
              : pay === "cash"
              ? "Cash"
              : pay === "qris"
              ? "QRIS"
              : pay === "transfer"
              ? "Transfer"
              : "Belum Bayar"}
          </Text>
        </View>

        <View style={styles.cardBlue}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sisa Bayar</Text>
            <Text style={styles.detailValue}>
              Rp {grandTotal.toLocaleString("id-ID")}
            </Text>
          </View>
          {discountAmount > 0 && (
            <Text style={{ color: "#ffdddd" }}>
              Diskon: -Rp {discountAmount.toLocaleString("id-ID")}
            </Text>
          )}
          <TouchableOpacity
            style={styles.btnDiscount}
            onPress={() => setDiscountModalVisible(true)}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              Gunakan Diskon
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===== BUTTONS ===== */}
        <TouchableOpacity
          style={[styles.btnNext, { marginTop: 20 }]}
          onPress={exportToPdf}
        >
          <Text style={styles.btnTxt}>Simpan ke PDF</Text>
        </TouchableOpacity>

        <SamplePrint orderData={orderData} />

        <TouchableOpacity
          style={[styles.btnNext, { marginTop: 12 }]}
          onPress={saveOrder}
        >
          <Text style={styles.btnTxt}>Simpan Pesanan</Text>
        </TouchableOpacity>

        {/* DISCOUNT MODAL */}
        <Modal
          visible={isDiscountModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDiscountModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Tambah Diskon</Text>
              <View style={styles.radioRow}>
                <TouchableOpacity
                  onPress={() => setDiscountType("nominal")}
                  style={
                    discountType === "nominal"
                      ? styles.radioActive
                      : styles.radio
                  }
                >
                  <Text>Diskon (Rp)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDiscountType("percent")}
                  style={
                    discountType === "percent"
                      ? styles.radioActive
                      : styles.radio
                  }
                >
                  <Text>Diskon (%)</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={discountInput}
                onChangeText={setDiscountInput}
                placeholder={
                  discountType === "nominal"
                    ? "Masukkan jumlah Rp"
                    : "Masukkan persen"
                }
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setDiscountModalVisible(false)}
                >
                  <Text style={{ color: "red", fontWeight: "bold" }}>
                    Batal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const v = parseFloat(discountInput) || 0;
                    const amt =
                      discountType === "nominal"
                        ? v
                        : Math.round((totalHarga * v) / 100);
                    setDiscountAmount(amt);
                    setDiscountModalVisible(false);
                  }}
                >
                  <Text style={{ color: "green", fontWeight: "bold" }}>
                    Konfirmasi
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  };

  /* ─── CONTAINER ─── */
  return (
    <View style={{ flex: 1, backgroundColor: "#F6FCFF" }}>
      {/* HEADER STEP */}
      <View style={styles.stepRow}>
        {["bag-add-outline", "wallet", "checkmark-done"].map((ic, i) => (
          <View key={ic} style={styles.stepItem}>
            <Ionicons
              name={ic as any}
              size={24}
              color={step >= i ? "#007AFF" : "#bbb"}
            />
            <Text style={[styles.stepLabel, step >= i && { color: "#007AFF" }]}>
              {["Laundry", "Bayar", "Review"][i]}
            </Text>
          </View>
        ))}
      </View>

      {step === 0 && renderLaundryStep()}
      {step === 1 && renderPaymentStep()}
      {step === 2 && renderReviewStep()}

      <DateTimePickerModal
        isVisible={datePicker.open}
        mode="datetime"
        onConfirm={onConfirmDate}
        onCancel={closePicker}
      />
    </View>
  );
}
