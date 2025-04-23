import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/private-config/config/firebaseConfig";
import moment from "moment";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface LaundryItem {
  id: string;
  name: string;
  phone: string;
  status: "Sedang Diproses" | "Telah Diambil" | "Belum Diambil";
  items: string[];
  deadline: any; // Firestore Timestamp
}

const HomeScreen = () => {
  const [laundryList, setLaundryList] = useState<LaundryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>(""); // Username from Firebase Auth

  const fetchLaundryData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "laundry"));
      const data: LaundryItem[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LaundryItem[];
      setLaundryList(data);
    } catch (error) {
      console.error("Error fetching laundry data ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaundryData();

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const nameFromEmail = user.email?.split("@")[0];
        setUsername(user.displayName || nameFromEmail || "User");
      }
    });

    return () => unsubscribe();
  }, []);

  const renderStatus = (status: string) => {
    switch (status) {
      case "Sedang Diproses":
        return (
          <Text style={[styles.status, styles.statusBlue]}>
            🌀 Sedang Diproses
          </Text>
        );
      case "Telah Diambil":
        return (
          <Text style={[styles.status, styles.statusGreen]}>
            ✅ Telah Diambil
          </Text>
        );
      case "Belum Diambil":
        return (
          <Text style={[styles.status, styles.statusOrange]}>
            ⚠️ Belum Diambil
          </Text>
        );
      default:
        return null;
    }
  };

  const renderCountdown = (deadline: any) => {
    const deadlineTime = deadline.toDate();
    const now = new Date();
    const duration = moment.duration(moment(deadlineTime).diff(moment(now)));

    const isLate = duration.asMilliseconds() < 0;

    const hours = Math.abs(duration.hours()).toString().padStart(2, "0");
    const minutes = Math.abs(duration.minutes()).toString().padStart(2, "0");
    const seconds = Math.abs(duration.seconds()).toString().padStart(2, "0");

    return (
      <Text style={[styles.deadline, isLate ? styles.late : styles.onTime]}>
        Sisa {isLate ? "-" : ""}
        {hours}:{minutes}:{seconds}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hai, {username} 👋</Text>
      <Text style={styles.subHeader}>List Laundry Hari Ini</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <ScrollView>
          {laundryList.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}</Text>
                {renderStatus(item.status)}
              </View>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.detailTitle}>Detail Cucian :</Text>
              {item.items.map((itemName, index) => (
                <Text key={index} style={styles.itemText}>
                  • {itemName}
                </Text>
              ))}
              {renderCountdown(item.deadline)}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FCFF",
    padding: 40,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderColor: "#D6EBFF",
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  phone: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailTitle: {
    marginTop: 6,
    fontWeight: "600",
  },
  itemText: {
    fontSize: 14,
  },
  status: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  statusBlue: {
    backgroundColor: "#E1F0FF",
    color: "#007AFF",
  },
  statusGreen: {
    backgroundColor: "#E0FFE5",
    color: "#28A745",
  },
  statusOrange: {
    backgroundColor: "#FFF3CD",
    color: "#FFA500",
  },
  deadline: {
    textAlign: "right",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "600",
  },
  late: {
    color: "#FF3B30",
  },
  onTime: {
    color: "#007AFF",
  },
});

export default HomeScreen;
