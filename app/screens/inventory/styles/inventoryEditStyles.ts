import { StyleSheet } from 'react-native';

export const inventoryEditStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imgPicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  delBtn: {
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnTxt: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
