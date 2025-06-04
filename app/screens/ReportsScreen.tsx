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

/* tipe longgar */
interface OrderDoc{ total:number|string; createdAt?:Timestamp; payment?:string; }
interface ExpenseDoc{ amount:number|string; note:string; date?:Timestamp; }

export default function ReportsScreen(){
  const [orders,setOrders]=useState<OrderDoc[]>([]);
  const [expenses,setExpenses]=useState<ExpenseDoc[]>([]);
  const [modal,setModal]=useState(false);
  const [newAmt,setNewAmt]=useState(''); const [newNote,setNewNote]=useState('');

  /* realtime */
  useEffect(()=>{
    const uid=auth.currentUser?.uid; if(!uid) return;
    const oUn=onSnapshot(query(collection(db,'orders'  ),where('ownerId','==',uid)),
      s=>setOrders(s.docs.map(d=>d.data({serverTimestamps:'estimate'}) as OrderDoc)));
    const eUn=onSnapshot(query(collection(db,'expenses'),where('ownerId','==',uid)),
      s=>setExpenses(s.docs.map(d=>d.data({serverTimestamps:'estimate'}) as ExpenseDoc)));
    return ()=>{oUn();eUn();};
  },[]);

  /* agregasi */
  const year=new Date().getFullYear();
  const monthly=useMemo(()=>{
    const obj:Record<string,{inc:number;exp:number}>={};
    const ensure=(k:string)=>obj[k]??= {inc:0,exp:0};

    orders.forEach(o=>{
      if(o.payment==='unpaid') return;                 /* ⬅️ skip belum bayar */
      if(!o.createdAt) return;
      const d=o.createdAt.toDate(); if(d.getFullYear()!==year) return;
      ensure(`0${d.getMonth()+1}`.slice(-2)).inc+=+o.total||0;
    });
    expenses.forEach(e=>{
      if(!e.date) return;
      const d=e.date.toDate(); if(d.getFullYear()!==year) return;
      ensure(`0${d.getMonth()+1}`.slice(-2)).exp+=+e.amount||0;
    });
    return obj;
  },[orders,expenses,year]);

  const keys   =Object.keys(monthly).sort();
  const incomes=keys.map(k=>monthly[k].inc);
  const expens =keys.map(k=>monthly[k].exp);
  const incomeYTD=incomes.reduce((s,x)=>s+x,0);
  const expenseYTD=expens.reduce((s,x)=>s+x,0);
  const profit=incomeYTD-expenseYTD;

  /* data chart berdampingan */
  const monthNames=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const labels:string[]=[]; const rows:number[][]=[];
  keys.forEach((k,i)=>{
    labels.push(monthNames[+k-1]);  rows.push([incomes[i]/1_000_000,0]);
    labels.push('');                rows.push([0,expens[i]/1_000_000]);
  });

  /* save pengeluaran */
  const saveExpense=async()=>{
    const amt=+newAmt; if(!amt||!newNote.trim()) return alert('Nominal & catatan wajib');
    await addDoc(collection(db,'expenses'),{
      amount:amt,note:newNote.trim(),date:Timestamp.now(),ownerId:auth.currentUser?.uid,
    });
    setNewAmt('');setNewNote('');setModal(false);
  };

  /* ---------- UI ---------- */
  return(
    <ScrollView contentContainerStyle={{padding:16}}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Laporan {year}</Text>

        {rows.length>0 && (
          <>
            <StackedBarChart
              hideLegend
              data={{
                labels,
                legend:['Pemasukan','Pengeluaran'],
                data:rows, barColors:['#0066FF','#E60000'],
              }}
              width={Dimensions.get('window').width-64}
              height={260}
              yAxisLabel="" yAxisSuffix=" Jt" withHorizontalLabels
              chartConfig={{
                backgroundGradientFrom:'#fff',backgroundGradientTo:'#fff',
                decimalPlaces:0,color:()=>'#888',labelColor:()=>'#666',
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
        <NumberBox label="Pendapatan Bulan Ini"  value={incomes.at(-1)??0} color="#0066FF"/>
        <NumberBox label="Pengeluaran Bulan Ini" value={expens .at(-1)??0} color="#E60000"/>
      </View>

      <View style={styles.cardCenter}>
        <Text style={{fontSize:18,fontWeight:'600',marginBottom:4}}>Laba Bersih</Text>
        <Text style={{
          fontSize:28,fontWeight:'bold',
          color:profit>=0?'#009F00':'#E60000'}}>Rp {profit.toLocaleString('id-ID')}</Text>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={()=>setModal(true)}>
        <Ionicons name="add" size={28} color="#fff"/>
      </TouchableOpacity>

      {/* modal */}
      <Modal visible={modal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={{fontSize:16,fontWeight:'bold',marginBottom:12}}>Tambah Pengeluaran</Text>
            <TextInput placeholder="Nominal (Rp)" keyboardType={Platform.select({ios:'number-pad',android:'decimal-pad'})}
              style={styles.input} value={newAmt} onChangeText={setNewAmt}/>
            <TextInput placeholder="Catatan" style={[styles.input,{height:80}]} multiline
              value={newNote} onChangeText={setNewNote}/>
            <View style={[styles.rowWrap,{marginTop:8}]}>
              <TouchableOpacity style={[styles.btn,{backgroundColor:'#ccc'}]} onPress={()=>setModal(false)}>
                <Text>Batal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn,{backgroundColor:'#007AFF'}]} onPress={saveExpense}>
                <Text style={{color:'#fff',fontWeight:'600'}}>Simpan</Text></TouchableOpacity>
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
        {value>=1_000_000?(value/1_000_000).toFixed(1)+' Juta':value.toLocaleString('id-ID')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16, 
    elevation: 2 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  yearInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
  },
  monthBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  monthBtnActive: {
    backgroundColor: '#007AFF',
  },
  monthText: {
    fontSize: 14,
    color: '#333',
  },
  monthTextActive: {
    color: '#fff',
  },
  rowWrap: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  numberBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  numberLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  numberValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profitBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  profitLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  profitValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  modalBg: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20 
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
});