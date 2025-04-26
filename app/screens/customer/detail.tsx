import React,{useEffect,useState} from 'react';
import { View,Text,Alert } from 'react-native';
import { doc,getDoc } from 'firebase/firestore';
import { db } from '../../../config/private-config/config/firebaseConfig';
import { useLocalSearchParams,useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { customerDetailStyles as s } from './styles/customerDetailStyles';

interface Cust{ name:string; phone:string; totalOrders:number }

export default function CustomerDetail(){
  const { id } = useLocalSearchParams<{id:string}>(); const router=useRouter();
  const [data,setData]=useState<Cust|null>(null);

  useEffect(()=>{ if(!id) return;
    (async()=>{
      const snap=await getDoc(doc(db,'customers',id));
      if(!snap.exists()){Alert.alert('Error','Tidak ditemukan'); router.back(); return;}
      setData(snap.data() as Cust);
    })();
  },[id]);

  if(!data) return null;

  return(
    <View style={s.container}>
      <Text style={s.label}>Nama</Text><Text style={s.value}>{data.name}</Text>
      <Text style={s.label}>Telepon</Text><Text style={s.value}>{data.phone}</Text>

      <View style={s.badge}>
        <Ionicons name="cart-outline" size={16} color="#0066FF" style={{marginRight:4}}/>
        <Text style={s.badgeTxt}>{data.totalOrders} Order</Text>
      </View>
    </View>
  );
}
