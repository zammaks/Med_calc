import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "../../src/services/firebase";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

export default function HistoryScreen() {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setHistory([]);
        return;
      }

      const q = query(
        collection(db, "users", u.uid, "calculations"),
        orderBy("createdAt", "asc")
      );

      return onSnapshot(q, (snap) => {
        setHistory(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      });
    });
  }, []);

  const remove = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "calculations", id));
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Войдите, чтобы видеть историю</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>История измерений</Text>

        {history.map((h) => (
          <View key={h.id} style={styles.card}>
            <Text>PaO₂: {h.pao2}</Text>
            <Text>FiO₂: {h.fio2Percent} %</Text>
            <Text style={styles.index}>Индекс: {h.index}</Text>
            <Text style={styles.date}>
              {h.createdAt?.toDate().toLocaleString()}
            </Text>

            <TouchableOpacity onPress={() => remove(h.id)}>
              <Text style={styles.delete}>Удалить</Text>
            </TouchableOpacity>
          </View>
        ))}

        {history.length > 1 && (
          <>
            <Text style={styles.graphTitle}>Динамика индекса</Text>
            <LineChart
              data={{
                labels: history.map((_, i) => (i + 1).toString()),
                datasets: [{ data: history.map((h) => h.index) }],
              }}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: () => "#0066cc",
                labelColor: () => "#333",
              }}
              style={{ borderRadius: 8 }}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 10 },
  card: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  index: { fontWeight: "600", marginTop: 5 },
  date: { fontSize: 12, color: "#666", marginTop: 5 },
  delete: { color: "red", marginTop: 5 },
  graphTitle: { marginVertical: 10, fontWeight: "600" },
});
