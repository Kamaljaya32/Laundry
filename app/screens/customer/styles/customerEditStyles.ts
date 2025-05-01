import { StyleSheet } from 'react-native';

export const customerEditStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },

  btn: {
    backgroundColor: '#0066FF',
    paddingVertical: 16, // cukup tinggi tombol
    borderRadius: 8,
    alignItems: 'center',
  },

  btnDisabled: {
    opacity: 0.7,
  },

  btnTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
