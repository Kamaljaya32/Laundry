import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/private-config/config/firebaseConfig'
import { BarChart } from 'react-native-chart-kit';

interface MonthlyStat {
  month: string;      
  income: number;
  expense: number;
}

export default function ReportsScreen() {
  const [stats, setStats] = useState<MonthlyStat[]>([]);
  const [operational, setOperational] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'summaries'), (snap) => {
      const arr = snap.docs.map((d) => d.data() as MonthlyStat);
      setStats(arr);
      const op = arr.reduce((s, m) => s + m.expense, 0);
      setOperational(op);
    });
    return unsub;
  }, []);

  const incomeYTD = stats.reduce((s, m) => s + m.income, 0);
  const expenseYTD = stats.reduce((s, m) => s + m.expense, 0);
  const profit = incomeYTD - expenseYTD;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>2025</Text>
        {stats.length > 0 && (
          <BarChart
            data={{
              labels: stats.map((s) => s.month),
              datasets: [{ data: stats.map((s) => s.income) }],
            }}
            width={Dimensions.get('screen').width - 64}
            height={220}
            fromZero
            showValuesOnTopOfBars
            yAxisLabel='Rp'
            yAxisSuffix=''
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: () => '#007AFF',
              labelColor: () => '#666',
              barPercentage: 0.6,
            }}
            style={{ alignSelf: 'center', marginVertical: 8 }}
          />

        )}

        <View style={styles.rowWrap}>
          <NumberBox label="Total Pengeluaran" value={expenseYTD} color="#E60000" />
          <NumberBox label="Total Pemasukan" value={incomeYTD} color="#0066FF" />
        </View>
      </View>

      <View style={styles.rowWrap}>
        <NumberBox label="Pendapatan Bulan Ini" value={stats.at(-1)?.income || 0} color="#0066FF" />
        <NumberBox label="Biaya Operasional" value={operational} color="#E60000" />
      </View>

      <View style={styles.cardCenter}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>Laba Bersih</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#009F00' }}>
          Rp {profit.toLocaleString('id-ID')}
        </Text>
      </View>
    </ScrollView>
  );
}

function NumberBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.smallCard]}>
      <Text style={{ fontSize: 12, color: '#444' }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color, marginTop: 4 }}>
        {value >= 1_000_000
          ? (value / 1_000_000).toFixed(1) + ' Juta'
          : value.toLocaleString('id-ID')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  rowWrap: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  smallCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    marginHorizontal: 4,
  },
  cardCenter: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 1,
  },
});
