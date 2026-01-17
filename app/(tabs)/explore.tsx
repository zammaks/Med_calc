import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  collection,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../src/services/firebase";

export default function HistoryScreen() {
  const [data, setData] = useState<any[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
    });
  }, []);

  useEffect(() => {
    if (!uid) return;

    const q = collection(db, "users", uid, "calculations");
    const unsub = onSnapshot(q, (snap) => {
      const res = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setData(res);
    });

    return unsub;
  }, [uid]);

  if (!uid) {
    return (
      <Text style={styles.info}>
        Войдите, чтобы увидеть историю измерений
      </Text>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 20 }}
      data={data}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text>Индекс: {item.ratio.toFixed(1)}</Text>
          <Text>Степень: {item.severity}</Text>
          <Text>
            Дата: {new Date(item.createdAt.seconds * 1000).toLocaleString()}
          </Text>

          <TouchableOpacity
            onPress={() =>
              deleteDoc(
                doc(db, "users", uid, "calculations", item.id)
              )
            }
          >
            <Text style={styles.delete}>Удалить</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f2f6fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  delete: { color: "red", marginTop: 5 },
  info: { textAlign: "center", marginTop: 40 },
});
