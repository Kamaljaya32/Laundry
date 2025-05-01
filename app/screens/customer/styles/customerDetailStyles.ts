import { StyleSheet } from 'react-native';
export const customerDetailStyles = StyleSheet.create({
  container:{ flex:1, padding:24, backgroundColor:'#fff' },
  label:{ color:'#666', marginTop:14 },
  value:{ fontSize:18, fontWeight:'600' },
  badge:{ flexDirection:'row', alignItems:'center', alignSelf:'flex-start',
          backgroundColor:'#E6F0FF', borderRadius:8,
          paddingHorizontal:8, paddingVertical:3, marginTop:20 },
  badgeTxt:{ color:'#0066FF', fontWeight:'600' },
});
