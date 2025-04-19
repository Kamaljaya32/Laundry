import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title:     { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', color: '#007AFF' },
  logo:      { width: 240, height: 240, alignSelf: 'center', marginBottom: 24 },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },

  btn:         { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  btnTxt:      { color: '#fff', fontWeight: 'bold' },
  link:        { marginTop: 16, color: '#007AFF', textAlign: 'center' },
});
