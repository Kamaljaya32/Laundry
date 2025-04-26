import React,{useEffect,useState} from 'react';
import { View,Text,TextInput,TouchableOpacity,Alert } from 'react-native';
import { doc,getDoc,updateDoc } from 'firebase/firestore';
import { db } from '../../../../config/private-config/config/firebaseConfig';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { customerEditStyles as s } from '../styles/customerEditStyles';

export default function CustomerEdit(){
  const { id } = useLocalSearchParams<{id:string}>(); const router=useRouter();
  const [name,setName]=useState(''); const [phone,setPhone]=useState('');
  const [loading,setLoading]=useState(false);

  useEffect(()=>{ if(!id) return;
    (async()=>{
      const snap=await getDoc(doc(db,'customers',id));
      if(!snap.exists()){Alert.alert('Error','Data tidak ada'); router.back(); return;}
      const d=snap.data(); setName(d.name); setPhone(d.phone);
    })();
  },[id]);

  const save=async()=>{
    if(!name.trim()||!phone.trim()){Alert.alert('Error','Semua field wajib');return;}
    setLoading(true);
    try{
      await updateDoc(doc(db,'customers',id),{name:name.trim(),phone:phone.trim()});
      router.back();
    }catch(e:any){Alert.alert('Error',e.message)}
    finally{setLoading(false);}
  };

  return(
    <View style={s.container}>
      <Text style={s.title}>Edit Pelanggan</Text>
      <TextInput style={s.input} value={name} onChangeText={setName}/>
      <TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType='phone-pad'/>
      <TouchableOpacity style={s.btn} onPress={save} disabled={loading}>
        <Text style={s.btnTxt}>{loading?'Memproses…':'Simpan'}</Text>
      </TouchableOpacity>
    </View>
  );
}
