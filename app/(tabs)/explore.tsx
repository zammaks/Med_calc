import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../src/services/firebase";

type HistoryItem = {
  id: string;
  pao2: number;
  fio2Percent: number;
  ratio: number;
  severity: string;
};

export default function HistoryScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔐 слушаем авторизацию
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // 📜 грузим историю ТОЛЬКО когда user есть
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "calculations"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const safe: HistoryItem[] = [];

      snap.forEach((doc) => {
        const d = doc.data();
        if (
          typeof d.ratio === "number" &&
          !isNaN(d.ratio)
        ) {
          safe.push({
            id: doc.id,
            pao2: d.pao2,
            fio2Percent: d.fio2Percent,
            ratio: Number(d.ratio.toFixed(1)),
            severity: d.severity,
          });
        }
      });

      setItems(safe);
    });

    return unsub;
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Загрузка…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Войдите, чтобы видеть историю</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text>История измерений пуста</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.bold}>Индекс: {item.ratio}</Text>
          <Text>PaO₂: {item.pao2}</Text>
          <Text>FiO₂: {item.fio2Percent}%</Text>
          <Text>Степень: {item.severity}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  bold: {
    fontWeight: "600",
    marginBottom: 4,
  },
});
