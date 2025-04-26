import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  collection, query, where, onSnapshot,
  doc, setDoc, updateDoc, serverTimestamp, increment
} from 'firebase/firestore';
import { auth, db } from '../../config/private-config/config/firebaseConfig';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type Step = 0 | 1 | 2;

interface LaundryItem { service:string; weight:string; price:string; note:string }
interface CustomerInfo { id:string; name:string; phone:string }

export default function LaundryFormScreen() {
  /* ────────────────────── state dasar ────────────────────── */
  const [step,setStep]   = useState<Step>(0);
  const [orderId,setOrderId] = useState<number|null>(null);   // id pesanan numeric

  /* pelanggan */
  const [phoneText,setPhoneText] = useState('');              // teks input nomor
  const [customers,setCustomers] = useState<CustomerInfo[]>([]);
  const [selectedCust,setSelectedCust] = useState<CustomerInfo|null>(null);
  const phoneInputRef = useRef<TextInput>(null);

  /* tanggal */
  const [inDate,setInDate] = useState<Date|null>(null);
  const [outDate,setOutDate] = useState<Date|null>(null);
  const [datePicker,setDP] = useState({open:false,which:'in' as 'in'|'out'});

  /* layanan */
  const [items,setItems] = useState<LaundryItem[]>([
    {service:'',weight:'',price:'',note:''}
  ]);

  /* pembayaran */
  const [pay,setPay] = useState<'cash'|'qris'|'transfer'>('qris');

  /* ─────────────────── load customers realtime ───────────── */
  useEffect(()=>{ 
    const u=auth.currentUser; if(!u) return;
    const q=query(collection(db,'customers'),where('ownerId','==',u.uid));
    const unsub=onSnapshot(q,snap=>setCustomers(
      snap.docs.map(d=>({id:d.id,...d.data() as Omit<CustomerInfo,'id'>}))
    ));
    return ()=>unsub();
  },[]);

  const filteredCust = customers.filter(c =>
    c.phone.includes(phoneText)
  );

  /* ────────────────────── helpers ─────────────────────────── */
  const totalHarga = items.reduce(
    (s,i)=>s+parseFloat(i.price||'0')*parseFloat(i.weight||'0'),0);

  const addService = ()=>setItems([...items,{service:'',weight:'',price:'',note:''}]);
  const updItem = (i:number,k:keyof LaundryItem,v:string)=>{
    const arr=[...items]; arr[i][k]=v; setItems(arr);
  };

  const openDP = (w:'in'|'out')=>setDP({open:true,which:w});
  const closeDP = ()=>setDP(prev=>({...prev,open:false}));
  const onConfirmDate = (d:Date)=>{datePicker.which==='in'?setInDate(d):setOutDate(d); closeDP();};

  /* ─── generate orderId numeric ketika masuk step 2 ───────── */
  useEffect(()=>{
    if(step===2 && !orderId){
      const idNum = Date.now();          // milisecond timestamp → unik & numeric
      setOrderId(idNum);
    }
  },[step,orderId]);

  /* ──────────────────── simpan order ─────────────────────── */
  const saveOrder = async ()=>{
    if(!selectedCust) { alert('Pilih pelanggan'); return; }
    try{
      await setDoc(
        doc(db,'orders',orderId!.toString()),    // id dokumen = string dari angka
        {
          orderNumber: orderId,                  // simpan versi number juga
          customerId  : selectedCust.id,
          customerName: selectedCust.name,
          phone       : selectedCust.phone,
          inDate, outDate,
          items,
          total       : totalHarga,
          payment     : pay,
          ownerId     : auth.currentUser?.uid,
          createdAt   : serverTimestamp()
        }
      );
      await updateDoc(doc(db,'customers',selectedCust.id),{
        totalOrders: increment(1)
      });
      alert('Pesanan tersimpan.');

      /* reset form */
      setStep(0);
      setOrderId(null);
      setSelectedCust(null);
      setPhoneText('');
      setItems([{service:'',weight:'',price:'',note:''}]);
    }catch(e:any){ alert(e.message); }
  };

  /* ────────────────────── langkah 0 ──────────────────────── */
  const StepLaundry = () => (
    <KeyboardAwareScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
    >
      {/* Autocomplete nomor telepon */}
      <View style={styles.autoWrap}>
        <TextInput
          ref={phoneInputRef}
          style={styles.input}
          placeholder="Nomor Telepon / WhatsApp"
          value={selectedCust ? selectedCust.phone : phoneText}
          keyboardType="phone-pad"
          onChangeText={t => {
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
            {filteredCust.map(c => (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  setSelectedCust(c);
                  setPhoneText(c.phone);
                }}
              >
                <Text style={styles.autoItem}>{c.phone} · {c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Nama pelanggan tampil otomatis */}
      <TextInput
        placeholder="Nama Pelanggan"
        style={styles.input}
        value={selectedCust ? selectedCust.name : ''}
        editable={false}
      />

      {/* Tanggal */}
      <View style={styles.row}>
        <TouchableOpacity style={[styles.input,{flex:1,marginRight:6}]} onPress={()=>openDP('in')}>
          <Text style={{color:inDate?'#000':'#888'}}>
            {inDate?inDate.toLocaleDateString():'Tanggal Masuk'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.input,{flex:1,marginLeft:6}]} onPress={()=>openDP('out')}>
          <Text style={{color:outDate?'#000':'#888'}}>
            {outDate?outDate.toLocaleDateString():'Tanggal Keluar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Layanan */}
      {items.map((it,i)=>(
        <View key={i} style={[styles.card,{backgroundColor:'#EAF4FF',marginBottom:16}]}>
          <Text style={styles.cardTitle}>Layanan #{i+1}</Text>

          <TextInput placeholder="Jenis Layanan" style={styles.input}
            value={it.service} onChangeText={t=>updItem(i,'service',t)}/>

          <View style={styles.row}>
            <TextInput placeholder="Jumlah (Kg/Pcs)" style={[styles.input,{flex:1,marginRight:6}]}
              keyboardType='decimal-pad' value={it.weight}
              onChangeText={t=>updItem(i,'weight',t)}/>
            <TextInput placeholder="Harga Satuan" style={[styles.input,{flex:1,marginLeft:6}]}
              keyboardType='decimal-pad' value={it.price}
              onChangeText={t=>updItem(i,'price',t)}/>
            <TextInput placeholder="Subtotal (Rp)" style={[styles.readonlyInput,{flex:1,marginLeft:6}]}
              value={(parseFloat(it.weight||'0')*parseFloat(it.price||'0')).toLocaleString('id-ID')}
              editable={false}/>
          </View>

          <TextInput placeholder="Catatan" style={[styles.input,{height:70}]}
            multiline value={it.note} onChangeText={t=>updItem(i,'note',t)}/>

          {i===items.length-1 && (
            <TouchableOpacity onPress={addService}>
              <Text style={{color:'#007AFF',textAlign:'center'}}>+ Tambah Layanan</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={styles.totalContainer}>
        <Text style={{fontWeight:'bold'}}>Estimasi Total :</Text>
        <Text style={{fontWeight:'bold'}}>Rp {totalHarga.toLocaleString('id-ID')}</Text>
      </View>

      <TouchableOpacity style={styles.btnNext} onPress={()=>setStep(1)}>
        <Text style={styles.btnTxt}>Lanjut Pembayaran</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );

  /* ────────────────────── langkah 1 ──────────────────────── */
  const StepPay = () => (
    <View style={{flex:1,padding:16}}>
      <TouchableOpacity onPress={()=>setStep(0)}>
        <Text style={{color:'#007AFF'}}>← Kembali</Text>
      </TouchableOpacity>

      <View style={[styles.card,{marginTop:16}]}>
        <Text style={styles.cardTitle}>Detail Pelanggan</Text>
        <Text>{selectedCust?.name}</Text>
        <Text>{selectedCust?.phone}</Text>
        <Text>Total: Rp {totalHarga.toLocaleString('id-ID')}</Text>
      </View>

      <View style={[styles.card,{marginTop:16}]}>
        <Text style={styles.cardTitle}>Metode Pembayaran</Text>
        {(['cash','qris','transfer'] as const).map(m=>(
          <TouchableOpacity key={m}
            style={[styles.paymentOption, pay===m && styles.paymentOptionSelected]}
            onPress={()=>setPay(m)}>
            <Ionicons name={m==='cash'?'cash':m==='qris'?'qr-code-outline':'swap-horizontal-outline'} size={20} color="#555"/>
            <Text style={styles.paymentText}>{m==='cash'?'Cash':m==='qris'?'QRIS':'Transfer'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.btnNext,{marginTop:24}]} onPress={()=>setStep(2)}>
        <Text style={styles.btnTxt}>Lanjut Review</Text>
      </TouchableOpacity>
    </View>
  );

  /* ────────────────────── langkah 2 ──────────────────────── */
  const StepReview = () => (
    <ScrollView style={{padding:16}}>
      <Text style={{fontSize:18,fontWeight:'bold',marginBottom:16}}>Review Pesanan</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nomor Pesanan</Text>
        <Text>{orderId}</Text>
      </View>

      <View style={[styles.card,{marginTop:16}]}>
        <Text style={styles.cardTitle}>Pelanggan</Text>
        <Text>Nama: {selectedCust?.name}</Text>
        <Text>No. WA: {selectedCust?.phone}</Text>
        <Text>Tgl Masuk: {inDate?.toLocaleDateString()}</Text>
        <Text>Tgl Keluar: {outDate?.toLocaleDateString()}</Text>
      </View>

      <View style={[styles.card,{marginTop:16}]}>
        <Text style={styles.cardTitle}>Detail Layanan</Text>
        {items.map((it,i)=>(
          <View key={i} style={{marginBottom:8}}>
            <Text>{it.service} · {it.weight}×Rp{it.price}</Text>
            <Text>Subtotal: Rp {(parseFloat(it.weight||'0')*parseFloat(it.price||'0')).toLocaleString('id-ID')}</Text>
            {it.note?<Text>Catatan: {it.note}</Text>:null}
          </View>
        ))}
        <Text style={{fontWeight:'bold',marginTop:8}}>Total: Rp {totalHarga.toLocaleString('id-ID')}</Text>
      </View>

      <View style={[styles.card,{marginTop:16}]}>
        <Text style={styles.cardTitle}>Metode Pembayaran</Text>
        <Text>{pay==='cash'?'Cash':pay==='qris'?'QRIS':'Transfer'}</Text>
      </View>

      <TouchableOpacity style={[styles.btnNext,{marginTop:24}]} onPress={saveOrder}>
        <Text style={styles.btnTxt}>Simpan Pesanan</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  /* ────────────────── render utama ───────────────── */
  return(
    <View style={{flex:1,backgroundColor:'#F6FCFF'}}>
      {/* indikator step */}
      <View style={styles.stepRow}>
        {['washer','wallet','checkmark-done'].map((ic,i)=>(
          <View key={i} style={styles.stepItem}>
            <Ionicons name={ic as any} size={24} color={step>=i?'#007AFF':'#bbb'}/>
            <Text style={[styles.stepLabel, step>=i && {color:'#007AFF'}]}>
              {['Laundry','Bayar','Review'][i]}
            </Text>
          </View>
        ))}
      </View>

      {step===0 && <StepLaundry/>}
      {step===1 && <StepPay/>}
      {step===2 && <StepReview/>}

      <DateTimePickerModal
        isVisible={datePicker.open}
        mode="date"
        onConfirm={onConfirmDate}
        onCancel={closeDP}
      />
    </View>
  );
}

/* ────────────────── style ───────────────────────── */
const styles = StyleSheet.create({
  stepRow:{flexDirection:'row',justifyContent:'space-around',paddingVertical:15,
           backgroundColor:'#fff',elevation:2},
  stepItem:{alignItems:'center'}, stepLabel:{fontSize:12,marginTop:4,color:'#bbb'},

  input:{backgroundColor:'#fff',borderRadius:10,padding:12,marginBottom:12,color:'#000'},
  readonlyInput:{backgroundColor:'#f2f2f2',borderRadius:10,padding:12,marginBottom:12,color:'#555'},
  row:{flexDirection:'row',marginBottom:12},
  card:{backgroundColor:'#fff',borderRadius:12,padding:16,elevation:1},
  cardTitle:{fontWeight:'bold',marginBottom:12,fontSize:16},
  btnNext:{backgroundColor:'#007AFF',borderRadius:12,paddingVertical:14,alignItems:'center',marginTop:16},
  btnTxt:{color:'#fff',fontWeight:'600',fontSize:16},
  totalContainer:{backgroundColor:'#fff',padding:16,borderRadius:12,marginBottom:16,
                  flexDirection:'row',justifyContent:'space-between'},

  paymentOption:{flexDirection:'row',alignItems:'center',padding:12,borderRadius:10,
                 borderWidth:1,borderColor:'#ccc',marginBottom:10},
  paymentOptionSelected:{borderColor:'#007AFF',backgroundColor:'#EAF4FF'},
  paymentText:{marginLeft:10,fontSize:16,color:'#000'},

  /* autocomplete */
  autoWrap:{position:'relative',marginBottom:12},
  autoList:{position:'absolute',top:52,left:0,right:0,maxHeight:200,
            backgroundColor:'#fff',borderRadius:10,elevation:2,zIndex:20},
  autoItem:{padding:12,borderBottomWidth:1,borderBottomColor:'#eee'},
});
