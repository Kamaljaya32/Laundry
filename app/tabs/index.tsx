import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import MDI from '@expo/vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/HomeScreen';
import CustomersScreen from '../screens/customer';
import InventoryScreen from '../screens/inventory';
import ReportsScreen from '../screens/ReportsScreen';
import LaundryFormScreen from '../screens/LaundryFormScreen';

export type BottomTabParamList = {
  Beranda: undefined;
  Pelanggan: undefined;
  LaundryAction: undefined;      
  Inventory: undefined;
  Laporan: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function HomeTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Beranda"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarStyle: {
          height: 60,
          paddingBottom: Platform.OS === 'android' ? 6 : 10,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Beranda"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Pelanggan"
        component={CustomersScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />

      <Tab.Screen
        name="LaundryAction"
        component={LaundryFormScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => null,         
          tabBarButton: (props) => <CenterFAB {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('LaundryAction');
          },
        })}
      />

      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Laporan"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function CenterFAB({ accessibilityState, onPress }: any) {
  const focused = accessibilityState?.selected;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.fabContainer}
    >
      <View style={[styles.fab, focused && styles.fabFocused]}>
        <MDI name="washing-machine" size={28} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
  },
  fabFocused: {
    backgroundColor: '#005BBB',
  },
});
