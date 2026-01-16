import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../src/services/firebase";

interface Calculation {
  id: string;
  pao2: number;
  fio2Percent: number;
  ratio: number;
  severity: string;
  createdAt: any;
}

export default function HistoryScreen() {
  const [data, setData] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const q = query(
          collection(db, "calculations"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);

        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Calculation[];

        setData(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>История расчётов</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>PaO₂: {item.pao2}</Text>
            <Text>FiO₂: {item.fio2Percent}%</Text>
            <Text>Индекс: {item.ratio.toFixed(1)}</Text>
            <Text>Состояние: {item.severity}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center" }}>
            История пока пуста
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  card: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#f2f6fa",
  },
});
