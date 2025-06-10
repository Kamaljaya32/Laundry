import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
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
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { auth, db } from "../../config/private-config/config/firebaseConfig";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

/* ---------- types ---------- */
type Step = 0 | 1 | 2;
type PayMethod = "cash" | "qris" | "transfer" | "unpaid";

interface LaundryItem {
  service: string;
  weight: string;
  price: string;
  note: string;
}
interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
}

/* ---------- komponen ---------- */
export default function LaundryFormScreen() {
  /* step & order */
  const [step, setStep] = useState<Step>(0);
  const [orderId, setOrderId] = useState<number | null>(null);

  /* pelanggan */
  const [phoneText, setPhoneText] = useState("");
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [selectedCust, setSelectedCust] = useState<CustomerInfo | null>(null);
  const phoneInputRef = useRef<TextInput>(null);

  /* tanggal */
  const [inDate, setInDate] = useState<Date | null>(null);
  const [outDate, setOutDate] = useState<Date | null>(null);
  const [datePicker, setDatePicker] = useState({
    open: false,
    which: "in" as "in" | "out",
  });

  /* layanan */
  const [items, setItems] = useState<LaundryItem[]>([
    { service: "", weight: "", price: "", note: "" },
  ]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [openSvcIdx, setOpenSvcIdx] = useState<number | null>(null);

  /* pembayaran */
  const [pay, setPay] = useState<PayMethod>("unpaid"); // ▶️ default belum‑bayar

  /* discount */
  const [discountType, setDiscountType] = useState<"nominal" | "percent">(
    "nominal"
  );
  const [discountInput, setDiscountInput] = useState<string>("0");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isDiscountModalVisible, setDiscountModalVisible] = useState(false);

  /* ---------- realtime pelanggan ---------- */
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const unsub = onSnapshot(
      query(collection(db, "customers"), where("ownerId", "==", u.uid)),
      (s) =>
        setCustomers(
          s.docs.map((d) => ({ id: d.id, ...d.data() } as CustomerInfo))
        )
    );
    return unsub;
  }, []);

  /* ---------- list layanan master ---------- */
  useEffect(() => {
    const col = collection(db, "list_laundry");
    const unsub = onSnapshot(col, (s) => {
      setServiceOptions(
        s.docs.flatMap((d) => {
          const data = d.data() as any;
          if (Array.isArray(data.list)) return data.list;
          if (typeof data.list === "string") return [data.list];
          if (typeof data.name === "string") return [data.name];
          return [];
        })
      );
    });
    return unsub;
  }, []);

  const filteredCust = customers.filter((c) =>
    c.phone.includes(phoneText.trim())
  );

  /* ---------- helpers ---------- */
  const totalHarga = items.reduce(
    (s, i) => s + parseFloat(i.price || "0") * parseFloat(i.weight || "0"),
    0
  );
  const totalAfterDiscount = Math.max(0, totalHarga - discountAmount);

  const addService = () =>
    setItems([...items, { service: "", weight: "", price: "", note: "" }]);
  const updateItem = (idx: number, key: keyof LaundryItem, val: string) => {
    const arr = [...items];
    arr[idx][key] = val;
    setItems(arr);
  };

  /* tanggal */
  const openPicker = (w: "in" | "out") =>
    setDatePicker({ open: true, which: w });
  const closePicker = () => setDatePicker((p) => ({ ...p, open: false }));
  const onConfirmDate = (d: Date) => {
    datePicker.which === "in" ? setInDate(d) : setOutDate(d);
    closePicker();
  };

  /* generate orderNo */
  useEffect(() => {
    if (step === 2 && !orderId) setOrderId(Date.now());
  }, [step, orderId]);

  /* ---------- simpan ---------- */
  const saveOrder = async () => {
    if (!selectedCust) return alert("Pilih pelanggan terlebih dahulu!");
    if (!orderId) return alert("ID pesanan belum dibuat.");

    try {
      /* a. tabel orders */
      await setDoc(doc(db, "orders", orderId.toString()), {
        orderNumber: orderId,
        customerId: selectedCust.id,
        customerName: selectedCust.name,
        phone: selectedCust.phone,
        inDate,
        outDate,
        items,
        total: totalHarga,
        discount: discountAmount,
        payment: pay,
        ownerId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });

      /* b. tabel laundry (dashboard) */
      await setDoc(doc(db, "laundry", orderId.toString()), {
        orderNumber: orderId,
        name: selectedCust.name,
        phone: selectedCust.phone,
        items: items.map((it) => `${it.service} ${it.weight}×`),
        status: "Sedang Diproses",
        payment: pay,
        deadline: outDate,
        discount: discountAmount,
        ownerId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });

      /* c. update total order pelanggan */
      await updateDoc(doc(db, "customers", selectedCust.id), {
        totalOrders: increment(1),
      });

      alert("Pesanan tersimpan.");
      /* reset */
      setStep(0);
      setOrderId(null);
      setSelectedCust(null);
      setPhoneText("");
      setInDate(null);
      setOutDate(null);
      setItems([{ service: "", weight: "", price: "", note: "" }]);
      setPay("unpaid");
      setDiscountAmount(0);
      setDiscountInput("0");
    } catch (e: any) {
      alert(e.message);
    }
  };

  /* ---------- export PDF ---------- */
  /* export PDF */
  const exportToPdf = async () => {
    const rows = items
      .map(
        (it) => `<tr><td>${it.service}</td><td style=\"text-align:center;\">${
          it.weight
        }</td>
      <td style=\"text-align:right;\">Rp${(+it.price || 0).toLocaleString(
        "id-ID"
      )}</td>
      <td style=\"text-align:right;\">Rp${(
        (+it.price || 0) * (+it.weight || 0)
      ).toLocaleString("id-ID")}</td></tr>`
      )
      .join("");

    const html = `
      <html><head><meta charset=\"utf-8\"/>
      <style>body{font-family:Arial; margin:24px;} table{width:100%;border-collapse:collapse;font-size:12px;}
      th,td{border:1px solid #ccc;padding:6px}</style></head><body>
      <h2>Laundry Order #${orderId}</h2>
      <p><b>Nama:</b> ${selectedCust?.name}<br/><b>No. WA:</b> ${
      selectedCust?.phone
    }</p>
      <table><thead><tr><th>Layanan</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan=\"3\" style=\"text-align:right;\">Diskon</td>
            <td style=\"text-align:right;\">- Rp${discountAmount.toLocaleString(
              "id-ID"
            )}</td></tr>
        <tr><td colspan=\"3\" style=\"text-align:right;font-weight:bold\">TOTAL</td>
            <td style=\"text-align:right;font-weight:bold\">Rp ${(
              totalHarga - discountAmount
            ).toLocaleString("id-ID")}</td></tr>
      </tfoot></table>
      <p><b>Pembayaran:</b> ${
        pay === "cash"
          ? "Cash"
          : pay === "qris"
          ? "QRIS"
          : pay === "transfer"
          ? "Transfer"
          : "Belum Bayar"
      }</p>
      </body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  };

  /* ───────────── step 0: laundry ───────────── */
  const renderLaundryStep = () => (
    <KeyboardAwareScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
    >
      {/* nomor telepon + autocomplete */}
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

        {phoneText.length > 0 && !selectedCust && (
          <ScrollView
            style={styles.autoList}
            keyboardShouldPersistTaps="handled"
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

      {/* nama readonly */}
      <TextInput
        placeholder="Nama Pelanggan"
        style={styles.input}
        value={selectedCust ? selectedCust.name : ""}
        editable={false}
      />

      {/* tanggal */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.input, { flex: 1, marginRight: 6 }]}
          onPress={() => openPicker("in")}
        >
          <Text style={{ color: inDate ? "#000" : "#888" }}>
            {inDate ? inDate.toLocaleDateString() : "Tanggal Masuk"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.input, { flex: 1, marginLeft: 6 }]}
          onPress={() => openPicker("out")}
        >
          <Text style={{ color: outDate ? "#000" : "#888" }}>
            {outDate ? outDate.toLocaleDateString() : "Tanggal Keluar"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* layanan list */}
      {items.map((it, i) => (
        <View
          key={i}
          style={[
            styles.card,
            { marginBottom: 16, backgroundColor: "#EAF4FF" },
          ]}
        >
          <Text style={styles.cardTitle}>Layanan #{i + 1}</Text>

          {/* input + autocomplete layanan */}
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

          {/* kuantitas / harga */}
          <View style={styles.row}>
            <TextInput
              placeholder="Jumlah (Kg/Pcs)"
              style={[styles.numericInput, { flex: 1, marginRight: 6 }]}
              keyboardType="decimal-pad"
              value={it.weight}
              onChangeText={(t) => updateItem(i, "weight", t)}
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

          <TextInput
            placeholder="Catatan"
            style={[styles.input, { height: 70 }]}
            multiline
            value={it.note}
            onChangeText={(t) => updateItem(i, "note", t)}
          />

          {i === items.length - 1 && (
            <TouchableOpacity onPress={addService} style={{ marginTop: 8 }}>
              <Text style={{ color: "#007AFF", textAlign: "center" }}>
                + Tambah Layanan
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={styles.totalContainer}>
        <Text style={{ fontWeight: "bold" }}>Estimasi Total :</Text>
        <Text style={{ fontWeight: "bold" }}>
          Rp {totalHarga.toLocaleString("id-ID")}
        </Text>
      </View>

      <TouchableOpacity style={styles.btnNext} onPress={() => setStep(1)}>
        <Text style={styles.btnTxt}>Lanjut Pembayaran</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );

  /* ---------- STEP 1 (pembayaran) ---------- */
  const renderPaymentStep = () => (
    <View style={{ flex: 1, padding: 16 }}>
      <TouchableOpacity
        onPress={() => setStep(0)}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
      >
        <Ionicons name="arrow-back" size={20} color="#007AFF" />
        <Text style={{ color: "#007AFF", marginLeft: 4 }}>Kembali</Text>
      </TouchableOpacity>

      {/* detail pelanggan */}
      <View style={styles.card}>
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
          Detail Pelanggan
        </Text>
        <Text>Nama  : {selectedCust?.name}</Text>
        <Text>No WA : {selectedCust?.phone}</Text>
        <Text>Total : Rp {totalHarga.toLocaleString("id-ID")}</Text>
      </View>

      {/* opsi bayar */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={{ fontWeight: "bold", marginBottom: 12 }}>
          Metode Pembayaran
        </Text>
        {(["cash", "qris", "transfer", "unpaid"] as const).map((m) => (
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
                : "Belum Bayar"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.btnNext, { marginTop: 20 }]}
        onPress={() => setStep(2)}
      >
        <Text style={styles.btnTxt}>Lanjut Review Pesanan</Text>
      </TouchableOpacity>
    </View>
  );

  /* ───────────── step 2: review ───────────── */
  const renderReviewStep = () => (
    <ScrollView style={{ padding: 16 }}>
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
        <Text>Tgl Masuk: {inDate?.toLocaleDateString()}</Text>
        <Text>Tgl Keluar: {outDate?.toLocaleDateString()}</Text>
      </View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.cardTitle}>Detail Layanan</Text>
        {items.map((it, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text>
              {it.service} · {it.weight}×Rp{it.price}
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
        <Text style={{ fontWeight: "bold", marginTop: 8 }}>
          Total: Rp {totalHarga.toLocaleString("id-ID")}
        </Text>
      </View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.cardTitle}>Metode Pembayaran</Text>
        <Text>
          {pay === "cash"
            ? "Cash"
            : pay === "qris"
            ? "QRIS"
            : pay === "transfer"
            ? "Transfer"
            : "Belum Bayar"}
        </Text>
      </View>

      {/* Tagihan & Diskon */}
      <View style={styles.cardBlue}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "bold", color: "#fff" }}>Sisa Bayar</Text>
          <Text style={{ fontWeight: "bold", color: "#fff" }}>
            Rp {totalAfterDiscount.toLocaleString("id-ID")}
          </Text>
        </View>
        {discountAmount > 0 && (
          <Text style={{ color: "#ffdddd", marginTop: 4 }}>
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

      <TouchableOpacity
        style={[styles.btnNext, { marginTop: 20 }]}
        onPress={exportToPdf}
      >
        <Text style={styles.btnTxt}>Simpan ke PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnNext, { marginTop: 12 }]}
        onPress={saveOrder}
      >
        <Text style={styles.btnTxt}>Simpan Pesanan</Text>
      </TouchableOpacity>

      {/* Modal diskon */}
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
                  discountType === "nominal" ? styles.radioActive : styles.radio
                }
              >
                <Text>Diskon (Rp)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDiscountType("percent")}
                style={
                  discountType === "percent" ? styles.radioActive : styles.radio
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
              <TouchableOpacity onPress={() => setDiscountModalVisible(false)}>
                <Text style={{ color: "red", fontWeight: "bold" }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const val = parseFloat(discountInput) || 0;
                  const amt =
                    discountType === "nominal"
                      ? val
                      : Math.round((totalHarga * val) / 100);
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

  /* ───────────── render utama ───────────── */
  return (
    <View style={{ flex: 1, backgroundColor: "#F6FCFF" }}>
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
        mode="date"
        onConfirm={onConfirmDate}
        onCancel={closePicker}
      />
    </View>
  );
}

/* ─────────────── styles ─────────────── */
const styles = StyleSheet.create({
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "#fff",
    elevation: 2,
  },
  stepItem: { alignItems: "center" },
  stepLabel: { fontSize: 12, marginTop: 4, color: "#bbb" },

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
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  cardTitle: { fontWeight: "bold", marginBottom: 12, fontSize: 16 },
  btnNext: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  btnTxt: { color: "#fff", fontWeight: "600", fontSize: 16 },
  totalContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: { color: "#555" },
  detailValue: { fontWeight: "bold", color: "#000" },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  paymentOptionSelected: { borderColor: "#007AFF", backgroundColor: "#EAF4FF" },
  paymentText: { marginLeft: 10, fontSize: 16 },

  /* autocomplete */
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

  /*__________ style baru untuk diskon/modal __________*/
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
  modalTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
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
