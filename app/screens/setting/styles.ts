import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

type BluetoothStatusStyle = (color: string) => TextStyle;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
  } as ViewStyle,

  containerList: {
    flex: 1,
    flexDirection: 'column',
    marginBottom: 20,
  } as ViewStyle,

  bluetoothStatusContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  } as ViewStyle,

  bluetoothInfo: {
    textAlign: 'center',
    fontSize: 15,
    color: '#FFC107',
    marginBottom: 16,
  } as TextStyle,

  sectionTitle: {
    fontWeight: '600',
    fontSize: 17,
    marginBottom: 12,
    color: '#343A40',
  } as TextStyle,

  printerInfo: {
    textAlign: 'center',
    fontSize: 15,
    color: '#6C757D',
    marginBottom: 20,
  } as TextStyle,

  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  } as ViewStyle,
});

export const getBluetoothStatusStyle: BluetoothStatusStyle = (color: string) => ({
  backgroundColor: color,
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 6,
  color: 'white',
  fontSize: 13,
});