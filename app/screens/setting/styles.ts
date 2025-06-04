import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

type BluetoothStatusStyle = (color: string) => TextStyle;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  } as ViewStyle,

  containerList: {
    flex: 1,
    flexDirection: 'column',
  } as ViewStyle,

  bluetoothStatusContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  } as ViewStyle,

  bluetoothInfo: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FFC806',
    marginBottom: 20,
  } as TextStyle,

  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
  } as TextStyle,

  printerInfo: {
    textAlign: 'center',
    fontSize: 16,
    color: '#E9493F',
    marginBottom: 20,
  } as TextStyle,
});

// Fungsi terpisah untuk style dinamis
export const getBluetoothStatusStyle: BluetoothStatusStyle = (color: string) => ({
  backgroundColor: color,
  padding: 8,
  borderRadius: 2,
  color: 'white',
  paddingHorizontal: 14,
  marginBottom: 20,
});
