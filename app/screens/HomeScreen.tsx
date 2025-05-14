/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity,
  Platform, ActionSheetIOS, Alert, TextInput,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  collection, query, where, onSnapshot, Timestamp, updateDoc, doc,
} from 'firebase/firestore';
import { db, auth } from '../../config/private-config/config/firebaseConfig';
import moment from 'moment';
import { deleteDoc } from 'firebase/firestore';

/* ───────── types ───────── */
type Status  = 'Sedang Diproses' | 'Belum Diambil' | 'Telah Diambil';
type Payment = 'cash' | 'qris' | 'transfer' | 'unpaid';

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

/* ───────── meta visual ───────── */
const STATUS_META: Record<Status, readonly [string,string,string]> = {
  'Sedang Diproses': ['#E1F0FF', '#007AFF', '🌀'],
  'Belum Diambil'  : ['#FFF3CD', '#FFA500', '📦'],
  'Telah Diambil'  : ['#E0FFE5', '#28A745', '✅'],
};
const STATUS_ORDER: Record<Status,number> = {
  'Sedang Diproses':0, 'Belum Diambil':1, 'Telah Diambil':2,
};

/* ───────── component ───────── */
export default function HomeScreen() {
  const user = auth.currentUser;
  const [data,setData]   = useState<LaundryDoc[]>([]);
  const [loading,setLoad]= useState(true);
  const [,setTick]       = useState(0);
  const [filter,setFilter]=useState<'Semua'|Status|'Belum Bayar'>('Semua');
  const [search,setSearch]=useState('');

  /* realtime listener */
  useEffect(()=>{
    if(!user) return;
    const q=query(collection(db,'laundry'),where('ownerId','==',user.uid));
    const unsub=onSnapshot(q,snap=>{
      const list=snap.docs.map(d=>({id:d.id,...d.data()}) as LaundryDoc);
      list.sort((a,b)=>
          STATUS_ORDER[a.status]-STATUS_ORDER[b.status] ||
          (a.payment==='unpaid'?1:0)-(b.payment==='unpaid'?1:0) ||
          a.orderNumber-b.orderNumber);
      setData(list); setLoad(false);
    });
    return unsub;
  },[user]);

  /* 1‑detik ticker untuk countdown */
  useEffect(()=>{const id=setInterval(()=>setTick(t=>t+1),1000);return()=>clearInterval(id);},[]);

  /* ───────── helper UI ───────── */
  const actionSheet = (
    opts: string[],
    onPick:(idx:number)=>void)=>
  {
    const cancel=opts.length-1;
    if(Platform.OS==='ios'){
      ActionSheetIOS.showActionSheetWithOptions(
        {options:opts,cancelButtonIndex:cancel},onPick);
    }else{
      Alert.alert('', '', opts.slice(0,-1)
        .map((o,i)=>({text:o,onPress:()=>onPick(i)})),
        {cancelable:true});
    }
  };

  /* ganti status */
  const changeStatus = (docId: string, current: Status) => {
    const all: Status[] = ['Sedang Diproses', 'Belum Diambil', 'Telah Diambil'];
    const opts         = [...all, 'Batal'];

    actionSheet(opts, async idx => {
      if (idx >= all.length) return;          // batal
      const newStat = all[idx];
      if (newStat === current) return;

      try {
        await updateDoc(doc(db, 'orders',  docId), { status: newStat });

        if (newStat === 'Telah Diambil') {
          await deleteDoc(doc(db, 'laundry', docId));
        } else {
          /* status masih aktif → cukup update dokumen laundry */
          await updateDoc(doc(db, 'laundry', docId), { status: newStat });
        }
      } catch (err) {
        Alert.alert('Gagal', String(err));
      }
    });
  };

  /* ganti payment */
  const markPaid = async (docId:string)=>{
    try{
      await updateDoc(doc(db,'laundry',docId),{payment:'cash'});
      await updateDoc(doc(db,'orders', docId),{payment:'cash'});
    }catch(e){Alert.alert('Gagal',String(e));}
  };

  /* filter pencarian */
/* ───── filter (status / belum bayar) ───── */
const openFilter = () => {
  // opsi yang memang valid untuk variabel filter
  const opts: ('Semua' | Status | 'Belum Bayar')[] = [
    'Semua',
    'Sedang Diproses',
    'Belum Diambil',
    'Belum Bayar',
    'Telah Diambil',
  ];

  // tambahkan tombol Cancel di iOS
  const iosOpts = [...opts, 'Batal'];
  const cancel  = iosOpts.length - 1;

  const pick = (idx: number) => {
    if (idx >= opts.length) return;      // Cancel
    setFilter(opts[idx]);
  };

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: iosOpts, cancelButtonIndex: cancel },
      pick,
    );
  } else {
    Alert.alert(
      'Filter',
      '',
      opts.map((o, i) => ({ text: o, onPress: () => pick(i) })),
      { cancelable: true },
    );
  }
};

/* ---------- data yang ditampilkan ---------- */
const shown = data.filter(d => {
  /* filter status / belum‑bayar */
  const statusOK =
    filter === 'Semua'        ? true :
    filter === 'Belum Bayar'  ? d.payment === 'unpaid' :
                                d.status  === filter;

  /* filter pencarian nama / nomor nota */
  const q   = search.trim().toLowerCase();
  const termOK = q === '' ||
    d.name.toLowerCase().includes(q) ||
    String(d.orderNumber).includes(q);

  return statusOK && termOK;
});


  /* ───────── render card ───────── */
  const renderItem=({item}:{item:LaundryDoc})=>{
    const [bg,fg,ico]=STATUS_META[item.status];
    let cd=''; let late=false;
    if(item.deadline){
      const diff=item.deadline.toDate().getTime()-Date.now();
      late=diff<0; const dur=moment.duration(diff);
      cd=`${late?'-':''}${Math.abs(dur.hours()).toString().padStart(2,'0')}:`+
         `${Math.abs(dur.minutes()).toString().padStart(2,'0')}:`+
         `${Math.abs(dur.seconds()).toString().padStart(2,'0')}`;
    }
    return(
      <View style={styles.card}>
        {/* header + chip status (tap ➜ ganti) */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
          <TouchableOpacity
            onPress={()=>changeStatus(item.id,item.status)}
            style={[styles.statusChip,{backgroundColor:bg}]}>
            <Text style={{color:fg,fontSize:12,fontWeight:'600'}}>{ico} {item.status}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.detailTitle}>Detail Cucian :</Text>
        {item.items.map((it,i)=>(
          <Text key={i} style={styles.itemText}>• {it}</Text>
        ))}

        <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:6}}>
          {cd!=='' && (
            <Text style={[
              styles.deadline,
              late?styles.late:styles.onTime,
            ]}>
              Sisa {cd}
            </Text>
          )}
          {item.payment==='unpaid' && (
            <TouchableOpacity onPress={()=>markPaid(item.id)}>
              <Text style={styles.unpaid}>Belum Bayar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if(loading) return <ActivityIndicator style={{flex:1}} color="#007AFF" size="large"/>;

  /* ───────── UI utama ───────── */
  return(
    <View style={styles.container}>
      <Text style={styles.header}>Hai, {user?.displayName||'User'} 👋</Text>
      <Text style={styles.subHeader}>List Laundry</Text>

      {/* search & filter */}
      <View style={styles.toolsRow}>
        <TextInput
          placeholder="Cari nama / nota"
          style={styles.search}
          value={search}
          onChangeText={setSearch}/>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
          <Ionicons name="funnel" size={18} color="#007AFF"/>
        </TouchableOpacity>
      </View>

      <FlatList
        data={shown}
        keyExtractor={i=>i.id}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom:120}}
        ListEmptyComponent={<Text>Tidak ada data</Text>}
      />
    </View>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#F6FCFF',padding:20},
  header:{fontSize:20,fontWeight:'bold',marginBottom:2},
  subHeader:{fontSize:16,marginBottom:10},
  toolsRow:{flexDirection:'row',marginBottom:12},
  search:{flex:1,backgroundColor:'#fff',borderRadius:10,paddingHorizontal:12,
          borderWidth:1,borderColor:'#D6EBFF'},
  filterBtn:{marginLeft:8,backgroundColor:'#EAF4FF',borderRadius:10,padding:10,
             borderWidth:1,borderColor:'#007AFF'},

  card:{backgroundColor:'#fff',borderRadius:12,padding:12,marginBottom:12,
        borderColor:'#D6EBFF',borderWidth:1},
  cardHeader:{flexDirection:'row',justifyContent:'space-between',marginBottom:4},
  name:{fontWeight:'700',fontSize:16}, phone:{fontSize:14},
  statusChip:{borderRadius:8,paddingHorizontal:6,paddingVertical:2},
  detailTitle:{marginTop:4,fontWeight:'600'}, itemText:{fontSize:14},
  deadline:{fontSize:12,fontWeight:'600'},
  onTime:{color:'#007AFF'}, late:{color:'#FF3B30'},
  unpaid:{color:'#FF3B30',fontWeight:'700',fontSize:12},
});
