import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  ToastAndroid,
  View,
  Button,
  EmitterSubscription,
} from 'react-native';
import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';
import { PERMISSIONS, requestMultiple, RESULTS } from 'react-native-permissions';
import ItemList from './ItemList';
import SamplePrint from './SamplePrint';
import { styles, getBluetoothStatusStyle } from './styles';

type BluetoothDevice = {
  name?: string;
  address: string;
};

type ScanDevicesResult = {
  found: string;
  paired: string;
};

function App() {
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
  const [foundDs, setFoundDs] = useState<BluetoothDevice[]>([]);
  const [bleOpend, setBleOpend] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [boundAddress, setBoundAddress] = useState<string>('');

  const deviceAlreadPaired = useCallback(
    (rsp: any) => {
      let ds: BluetoothDevice[] | null = null;
      if (typeof rsp.devices === 'object') {
        ds = rsp.devices;
      } else {
        try {
          ds = JSON.parse(rsp.devices);
        } catch (e) {}
      }
      if (ds && ds.length) {
        let pared = pairedDevices;
        if (pared.length < 1) {
          pared = pared.concat(ds);
        }
        setPairedDevices(pared);
      }
    },
    [pairedDevices]
  );

  const deviceFoundEvent = useCallback(
    (rsp: any) => {
      let r: BluetoothDevice | null = null;
      try {
        r = typeof rsp.device === 'object' ? rsp.device : JSON.parse(rsp.device);
      } catch (e) {}

      if (r) {
        const found = [...foundDs];
        if (!found.find(x => x.address === r!.address)) {
          found.push(r);
          setFoundDs(found);
        }
      }
    },
    [foundDs]
  );

  const scanDevices = useCallback(() => {
  setLoading(true);
  BluetoothManager.scanDevices().then(
    (s: ScanDevicesResult) => {
      let found: BluetoothDevice[] = [];
      try {
        found = JSON.parse(s.found);
      } catch (e) {}
      if (found && found.length) {
        setFoundDs(found);
      }
      setLoading(false);
    },
    (_: unknown) => {
      setLoading(false);
    }
  );
}, []);


  const scan = useCallback(() => {
    const permissions = {
      title: 'HSD bluetooth meminta izin untuk mengakses bluetooth',
      message: 'HSD bluetooth memerlukan akses ke bluetooth untuk proses koneksi ke bluetooth printer',
      buttonNeutral: 'Lain Waktu',
      buttonNegative: 'Tidak',
      buttonPositive: 'Boleh',
    };

    async function blueTooth() {
      try {
        const grantedConnect = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          permissions
        );

        if (grantedConnect === PermissionsAndroid.RESULTS.GRANTED) {
          const grantedScan = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            permissions
          );

          if (grantedScan === PermissionsAndroid.RESULTS.GRANTED) {
            scanDevices();
          }
        }
      } catch (err) {
        console.warn(err);
      }
    }

    blueTooth();
  }, [scanDevices]);

  const connect = (row: BluetoothDevice) => {
    setLoading(true);
    BluetoothManager.connect(row.address).then(
      (_: unknown) => {
        setLoading(false);
        setBoundAddress(row.address);
        setName(row.name || 'UNKNOWN');
      },
      (e: unknown) => {
        setLoading(false);
        alert(e);
      }
    );
  };

  const unPair = (address: string) => {
    setLoading(true);
    BluetoothManager.unpaire(address).then(
      (_: unknown) => {
        setLoading(false);
        setBoundAddress('');
        setName('');
      },
      (e: unknown) => {
        setLoading(false);
        alert(e);
      }
    );
  };

  const scanBluetoothDevice = async () => {
    setLoading(true);
    try {
      const request = await requestMultiple([
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ]);

      if (request['android.permission.ACCESS_FINE_LOCATION'] === RESULTS.GRANTED) {
        scanDevices();
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    BluetoothManager.isBluetoothEnabled().then(
      (enabled: boolean) => {
        setBleOpend(Boolean(enabled));
        setLoading(false);
      },
      (_: unknown) => {}
    );

    if (Platform.OS === 'ios') {
      const bluetoothManagerEmitter = new NativeEventEmitter(BluetoothManager);
      bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED, deviceAlreadPaired);
      bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_FOUND, deviceFoundEvent);
      bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_CONNECTION_LOST, () => {
        setName('');
        setBoundAddress('');
      });
    } else if (Platform.OS === 'android') {
      DeviceEventEmitter.addListener(BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED, deviceAlreadPaired);
      DeviceEventEmitter.addListener(BluetoothManager.EVENT_DEVICE_FOUND, deviceFoundEvent);
      DeviceEventEmitter.addListener(BluetoothManager.EVENT_CONNECTION_LOST, () => {
        setName('');
        setBoundAddress('');
      });
      DeviceEventEmitter.addListener(BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT, () => {
        ToastAndroid.show('Device Not Support Bluetooth !', ToastAndroid.LONG);
      });
    }

    if (pairedDevices.length < 1) {
      scan();
    }
  }, [boundAddress, deviceAlreadPaired, deviceFoundEvent, pairedDevices, scan]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.bluetoothStatusContainer}>
        <Text style={getBluetoothStatusStyle(bleOpend ? '#47BF34' : '#A8A9AA')}>
          Bluetooth {bleOpend ? 'Aktif' : 'Non Aktif'}
        </Text>
      </View>
      {!bleOpend && <Text style={styles.bluetoothInfo}>Mohon aktifkan bluetooth anda</Text>}
      <Text style={styles.sectionTitle}>Printer yang terhubung ke aplikasi:</Text>
      {boundAddress.length > 0 ? (
        <ItemList
          label={name}
          value={boundAddress}
          onPress={() => unPair(boundAddress)}
          actionText="Putus"
          color="#E9493F"
        />
      ) : (
        <Text style={styles.printerInfo}>Belum ada printer yang terhubung</Text>
      )}
      <Text style={styles.sectionTitle}>Bluetooth yang terhubung ke HP ini:</Text>
      {loading && <ActivityIndicator animating />}
      <View style={styles.containerList}>
        {pairedDevices.map((item, index) => (
          <ItemList
            key={index}
            onPress={() => connect(item)}
            label={item.name}
            value={item.address}
            connected={item.address === boundAddress}
            actionText="Hubungkan"
            color="#00BCD4"
          />
        ))}
      </View>
      <SamplePrint />
      <Button title="Scan Bluetooth" onPress={scanBluetoothDevice} />
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

export default App;
