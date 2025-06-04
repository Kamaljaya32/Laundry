import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle } from 'react-native';

type ItemListProps = {
  label?: string;
  value: string;
  onPress: () => void;
  connected?: boolean;
  actionText: string;
  color?: string;
};

const ItemList: React.FC<ItemListProps> = ({
  label,
  value,
  onPress,
  connected = false,
  actionText,
  color = '#00BCD4',
}) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>{label || 'UNKNOWN'}</Text>
        <Text>{value}</Text>
      </View>
      {connected ? (
        <Text style={styles.connected}>Terhubung</Text>
      ) : (
        <TouchableOpacity onPress={onPress} style={[styles.button, { backgroundColor: color }]}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ItemList;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E7E7E7',
    marginBottom: 12,
    padding: 12,
    borderRadius: 4,
  },
  label: { fontWeight: 'bold' },
  connected: { fontWeight: 'bold', color: '#00BCD4' },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
  } as ViewStyle,
  actionText: { color: 'white' },
});
