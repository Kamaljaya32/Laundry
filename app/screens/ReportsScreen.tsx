// src/screens/ReportsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  TextInput, TouchableOpacity, Modal, Platform,
} from 'react-native';
import { StackedBarChart } from 'react-native-chart-kit';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  collection, query, where, onSnapshot, addDoc, Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../../config/private-config/config/firebaseConfig';

/* dokumen longgar */
interface OrderDoc   { total: number | string; createdAt?: Timestamp; }
interface ExpenseDoc { amount: number | string; note: string; date?: Timestamp; }

export default function ReportsScreen() {
  /* ---------- state ---------- */
  const [orders,   setOrders]   = useState<OrderDoc[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newAmt,  setNewAmt]  = useState('');
  const [newNote, setNewNote] = useState('');

  /* ---------- listeners ---------- */
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubOrd = onSnapshot(
      query(collection(db,'orders'),   where('ownerId','==',uid)),
      s => setOrders(s.docs.map(d => d.data({ serverTimestamps:'estimate' }) as OrderDoc)),
    );
    const unsubExp = onSnapshot(
      query(collection(db,'expenses'), where('ownerId','==',uid)),
      s => setExpenses(s.docs.map(d => d.data({ serverTimestamps:'estimate' }) as ExpenseDoc)),
    );
    return () => { unsubOrd(); unsubExp(); };
  }, []);

  /* ---------- agregasi ---------- */
  const year = new Date().getFullYear();
  const monthly = useMemo(() => {
    const m: Record<string,{inc:number;exp:number}> = {};
    const ensure = (k:string)=> (m[k]??= {inc:0,exp:0});

    orders.forEach(o=>{
      if(!o.createdAt) return;
      const d=o.createdAt.toDate(); if(d.getFullYear()!==year) return;
      ensure(`0${d.getMonth()+1}`.slice(-2)).inc += +o.total||0;
    });
    expenses.forEach(e=>{
      if(!e.date) return;
      const d=e.date.toDate(); if(d.getFullYear()!==year) return;
      ensure(`0${d.getMonth()+1}`.slice(-2)).exp += +e.amount||0;
    });
    return m;
  },[orders,expenses,year]);

  const keys          = Object.keys(monthly).sort();          // ['03','05',…]
  const incomes       = keys.map(k=>monthly[k].inc);
  const expens        = keys.map(k=>monthly[k].exp);
  const incomeYTD     = incomes.reduce((s,x)=>s+x,0);
  const expenseYTD    = expens .reduce((s,x)=>s+x,0);
  const profit        = incomeYTD-expenseYTD;

  /* ---------- data chart berdampingan ---------- */
  const monthNames   = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const labels: string[]   = [];
  const rows:   number[][] = [];            // tiap row = [inc, exp]
  keys.forEach((k, i) => {
    /* bar 1 – pemasukan */
    labels.push(monthNames[+k-1]);
    rows  .push([ incomes[i]/1_000_000, 0 ]);
    /* bar 2 – pengeluaran */
    labels.push('');
    rows  .push([ 0, expens[i]/1_000_000 ]);
  });

  /* ---------- simpan expense ---------- */
  const saveExpense = async ()=>{
    const amt=+newAmt;
    if(!amt||!newNote.trim()){alert('Nominal & catatan wajib diisi');return;}
    await addDoc(collection(db,'expenses'),{
      amount:amt, note:newNote.trim(), date:Timestamp.now(), ownerId:auth.currentUser?.uid,
    });
    setNewAmt(''); setNewNote(''); setModalOpen(false);
  };

  /* ---------- UI ---------- */
  return (
    <ScrollView contentContainerStyle={{padding:16}}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Laporan {year}</Text>

        {rows.length>0 && (
          <>
            <StackedBarChart
              hideLegend
              data={{
                labels,
                legend: ['Pemasukan','Pengeluaran'],   /* ← wajib utk tipe */
                data  : rows,
                barColors: ['#0066FF','#E60000'],
              }}
              width={Dimensions.get('window').width-64}
              height={260}
              yAxisLabel=""
              yAxisSuffix=" Jt"
              withHorizontalLabels
              chartConfig={{
                backgroundGradientFrom:'#fff',
                backgroundGradientTo:'#fff',
                decimalPlaces:0,
                color:()=> '#888',
                labelColor:()=> '#666',
                propsForBackgroundLines:{strokeDasharray:'3'},
              }}
              style={{alignSelf:'center',marginVertical:8}}
            />

            <View style={{flexDirection:'row',justifyContent:'center',marginTop:6}}>
              <Legend color="#0066FF" label="Pemasukan"/>
              <Legend color="#E60000" label="Pengeluaran" style={{marginLeft:16}}/>
            </View>
          </>
        )}

        <View style={styles.rowWrap}>
          <NumberBox label="Total Pengeluaran" value={expenseYTD} color="#E60000"/>
          <NumberBox label="Total Pemasukan"   value={incomeYTD}  color="#0066FF"/>
        </View>
      </View>

      <View style={styles.rowWrap}>
        <NumberBox label="Pendapatan Bulan Ini"  value={incomes.at(-1)??0}  color="#0066FF"/>
        <NumberBox label="Pengeluaran Bulan Ini" value={expens .at(-1)??0} color="#E60000"/>
      </View>

      <View style={styles.cardCenter}>
        <Text style={{fontSize:18,fontWeight:'600',marginBottom:4}}>Laba Bersih</Text>
        <Text style={{
          fontSize:28,fontWeight:'bold',
          color: profit>=0 ? '#009F00' : '#E60000',
        }}>
          Rp {profit.toLocaleString('id-ID')}
        </Text>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={()=>setModalOpen(true)}>
        <Ionicons name="add" size={28} color="#fff"/>
      </TouchableOpacity>

      {/* modal */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={{fontSize:16,fontWeight:'bold',marginBottom:12}}>Tambah Pengeluaran</Text>
            <TextInput
              placeholder="Nominal (Rp)"
              keyboardType={Platform.select({ios:'number-pad',android:'decimal-pad'})}
              style={styles.input}
              value={newAmt}
              onChangeText={setNewAmt}
            />
            <TextInput
              placeholder="Catatan"
              style={[styles.input,{height:80}]}
              multiline
              value={newNote}
              onChangeText={setNewNote}
            />
            <View style={[styles.rowWrap,{marginTop:8}]}>
              <TouchableOpacity style={[styles.btn,{backgroundColor:'#ccc'}]} onPress={()=>setModalOpen(false)}>
                <Text>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn,{backgroundColor:'#007AFF'}]} onPress={saveExpense}>
                <Text style={{color:'#fff',fontWeight:'600'}}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ---------- komponen kecil ---------- */
function NumberBox({label,value,color}:{label:string;value:number;color:string}){
  return(
    <View style={styles.smallCard}>
      <Text style={{fontSize:12,color:'#444'}}>{label}</Text>
      <Text style={{fontSize:18,fontWeight:'bold',color,marginTop:4}}>
        {value>=1_000_000 ? (value/1_000_000).toFixed(1)+' Juta'
                          : value.toLocaleString('id-ID')}
      </Text>
    </View>
  );
}
function Legend({color,label,style}:{color:string;label:string;style?:object}){
  return(
    <View style={[{flexDirection:'row',alignItems:'center'},style]}>
      <View style={{width:10,height:10,borderRadius:5,backgroundColor:color,marginRight:6}}/>
      <Text style={{fontSize:12,color:'#555'}}>{label}</Text>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  card:{backgroundColor:'#fff',borderRadius:12,padding:16,marginBottom:16,elevation:1},
  cardTitle:{fontSize:18,fontWeight:'bold',marginBottom:4},
  rowWrap:{flexDirection:'row',justifyContent:'space-between',marginBottom:16},
  smallCard:{flex:1,backgroundColor:'#fff',borderRadius:12,padding:16,elevation:1,marginHorizontal:4},
  cardCenter:{backgroundColor:'#fff',borderRadius:12,padding:20,alignItems:'center',elevation:1},

  fab:{position:'absolute',right:24,bottom:24,backgroundColor:'#007AFF',
       width:56,height:56,borderRadius:28,justifyContent:'center',alignItems:'center',elevation:4},

  modalBg:{flex:1,backgroundColor:'rgba(0,0,0,0.3)',justifyContent:'center',padding:24},
  modalCard:{backgroundColor:'#fff',borderRadius:12,padding:20},
  input:{backgroundColor:'#fff',borderRadius:10,padding:12,marginBottom:12,borderWidth:1,borderColor:'#ddd'},
  btn:{flex:1,paddingVertical:12,borderRadius:10,alignItems:'center',marginHorizontal:4},
});
