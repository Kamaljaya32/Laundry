// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator
} from "react-native";
import { Ionicons }   from "@expo/vector-icons";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db, auth }   from "../../config/private-config/config/firebaseConfig";
import moment         from "moment";

type Status = "Sedang Diproses" | "Belum Diambil" | "Telah Diambil";

interface LaundryDoc {
  id: string;
  name: string;
  phone: string;
  items: string[];
  deadline?: Timestamp;
  status: Status;
}

/* ---------- util warna & ikon ---------- */
const STATUS_META: Record<Status, readonly [string,string,string]> = {
  "Sedang Diproses": ["#E1F0FF", "#007AFF", "🌀"],
  "Belum Diambil"   : ["#FFF3CD", "#FFA500", "⚠️"],
  "Telah Diambil"   : ["#E0FFE5", "#28A745", "✅"],
};

/* ---------- komponen ---------- */
export default function HomeScreen() {
  const [data,setData] = useState<LaundryDoc[]>([]);
  const [loading,setLoading] = useState(true);
  const [tick,setTick] = useState(0);         // trigger re‑render tiap 1 detik
  const user = auth.currentUser;

  /* realtime listener */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db,"laundry"), where("ownerId","==",user.uid));
    const unsub = onSnapshot(q, snap => {
      const list: LaundryDoc[] = snap.docs.map(d => ({ id:d.id, ...d.data() } as any));
      // urutkan: yang belum diambil / proses di atas
      list.sort((a,b) => a.status.localeCompare(b.status));
      setData(list);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  /* 1 detik ticker */
  useEffect(() => {
    const id = setInterval(() => setTick(t=>t+1), 1000);
    return () => clearInterval(id);
  }, []);

  /* render ----- */
  const renderItem = ({item}: {item: LaundryDoc}) => {
    const [bg,fg,icon] = STATUS_META[item.status];
    /* countdown */
    let countdown = "";
    if (item.deadline instanceof Timestamp) {
      const diff = item.deadline.toDate().getTime() - Date.now();
      const dur  = moment.duration(diff);
      const h = Math.abs(dur.hours()).toString().padStart(2,"0");
      const m = Math.abs(dur.minutes()).toString().padStart(2,"0");
      const s = Math.abs(dur.seconds()).toString().padStart(2,"0");
      countdown = `${diff<0?"-":""}${h}:${m}:${s}`;
    }

    return (
      <View style={styles.card}>
        {/* header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
          <View style={[styles.statusChip,{backgroundColor:bg}]}>
            <Text style={{color:fg,fontSize:12, fontWeight:"700"}}>
              {icon} {item.status}
            </Text>
          </View>
        </View>

        {/* detail items */}
        <Text style={styles.detailTitle}>Detail Cucian :</Text>
        {item.items.map((it,idx)=>(
          <Text key={idx} style={styles.itemText}>• {it}</Text>
        ))}

        {/* countdown */}
        {item.deadline &&
          <Text style={[
              styles.deadline,
              (item.deadline.toMillis() < Date.now()) ? styles.late : styles.onTime
            ]}>
            Sisa {countdown}
          </Text>}
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#007AFF" style={{flex:1}}/>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hai, {user?.displayName ?? "User"} 👋</Text>
      <Text style={styles.subHeader}>List Laundry Hari Ini</Text>

      <FlatList
        data={data}
        keyExtractor={i=>i.id}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom:120}}
      />
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#F6FCFF",padding:20},
  header:{fontSize:20,fontWeight:"bold",marginBottom:8},
  subHeader:{fontSize:16,marginBottom:12},
  card:{backgroundColor:"#fff",borderRadius:12,padding:12,marginBottom:12,
        borderColor:"#D6EBFF",borderWidth:1},
  cardHeader:{flexDirection:"row",justifyContent:"space-between",marginBottom:4},
  name:{fontWeight:"700",fontSize:16},
  phone:{fontSize:14},
  statusChip:{borderRadius:8,paddingHorizontal:6,paddingVertical:2,alignSelf:"flex-start"},
  detailTitle:{marginTop:4,fontWeight:"600"},
  itemText:{fontSize:14},
  deadline:{textAlign:"right",fontSize:12,fontWeight:"600",marginTop:6},
  onTime:{color:"#007AFF"},
  late:{color:"#FF3B30"},
});
