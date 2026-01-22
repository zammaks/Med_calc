import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { collection, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../src/services/firebase";

type HistoryItem = {
  id: string;
  pao2: number;
  fio2Percent: number;
  ratio: number;
  severity: string;
  createdAt: Date;
  patientName?: string;
};

type SortMode = "new" | "old";

export default function HistoryScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("new");
  const [dateInput, setDateInput] = useState("");       // ДД.ММ.ГГГГ
  const [patientFilter, setPatientFilter] = useState(""); // фильтр по ФИО

  // 🔐 авторизация + роль
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userSnap = await getDoc(doc(db, "users", u.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            setIsDoctor(data.role === "doctor");
          }
        } catch (err) {
          console.error("Ошибка получения роли:", err);
        }
      }
      setLoading(false);
    });
  }, []);

  // 📜 загрузка истории (только свои записи)
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
        if (typeof d.ratio === "number" && !isNaN(d.ratio)) {
          safe.push({
            id: doc.id,
            pao2: d.pao2,
            fio2Percent: d.fio2Percent,
            ratio: Number(d.ratio.toFixed(1)),
            severity: d.severity,
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
            patientName: d.patientName,
          });
        }
      });
      setItems(safe);
    });

    return unsub;
  }, [user]);

  // 🧠 фильтрация и сортировка
  const filtered = useMemo(() => {
    let data = [...items];

    // 1. фильтр по дате
    if (dateInput.trim().length === 10) {
      data = data.filter(
        (i) => i.createdAt.toLocaleDateString("ru-RU") === dateInput.trim()
      );
    }

    // 2. фильтр по пациенту (только для врача и если введено значение)
    if (isDoctor && patientFilter.trim().length > 0) {
      const search = patientFilter.trim().toLowerCase();
      data = data.filter((i) =>
        i.patientName && i.patientName.toLowerCase().includes(search)
      );
    }

    // 3. сортировка
    data.sort((a, b) =>
      sort === "new"
        ? b.createdAt.getTime() - a.createdAt.getTime()
        : a.createdAt.getTime() - b.createdAt.getTime()
    );

    return data;
  }, [items, sort, dateInput, patientFilter, isDoctor]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Загрузка…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Войдите, чтобы видеть историю</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ===== ФИЛЬТРЫ ===== */}
      <View style={styles.filterCard}>
        <View style={styles.row}>
          <FilterButton
            active={sort === "new"}
            text="Сначала новые"
            onPress={() => setSort("new")}
          />
          <FilterButton
            active={sort === "old"}
            text="Сначала старые"
            onPress={() => setSort("old")}
          />
        </View>

        <Text style={styles.filterLabel}>Фильтр по дате (ДД.ММ.ГГГГ)</Text>
        <TextInput
          style={styles.input}
          placeholder="например, 21.01.2026"
          value={dateInput}
          onChangeText={setDateInput}
          keyboardType="numeric"
          maxLength={10}
        />

        {isDoctor && (
          <>
            <Text style={[styles.filterLabel, { marginTop: 12 }]}>
              ФИО пациента
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Введите часть ФИО..."
              value={patientFilter}
              onChangeText={setPatientFilter}
              autoCapitalize="words"
            />
          </>
        )}
      </View>

      {/* ===== СПИСОК ===== */}
      <ScrollView>
        {filtered.length === 0 && (
          <Text style={styles.empty}>
            {patientFilter.trim() || dateInput.trim()
              ? "Нет записей, удовлетворяющих фильтру"
              : "Нет записей"}
          </Text>
        )}

        {filtered.map((item) => (
          <View
            key={item.id}
            style={[styles.card, severityColor(item.severity)]}
          >
            <Text style={styles.date}>
              {item.createdAt.toLocaleDateString("ru-RU")}{" "}
              {item.createdAt.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>

            {isDoctor && item.patientName && (
              <Text style={styles.patientName}>
                Пациент: {item.patientName}
              </Text>
            )}

            <Text style={styles.index}>
              Индекс PaO₂ / FiO₂: {item.ratio}
            </Text>

            <View style={styles.rowBetween}>
              <Text style={styles.value}>PaO₂: {item.pao2}</Text>
              <Text style={styles.value}>FiO₂: {item.fio2Percent}%</Text>
            </View>

            <Text style={styles.severity}>Степень: {item.severity}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function FilterButton({
  text,
  active,
  onPress,
}: {
  text: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterBtn, active && styles.filterBtnActive]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const severityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case "норма":
      return { borderLeftColor: "#2ecc71" };
    case "лёгкая ордс":
    case "легкая ордс":
      return { borderLeftColor: "#f1c40f" };
    case "средняя ордс":
      return { borderLeftColor: "#e67e22" };
    case "тяжёлая ордс":
    case "тяжелая ордс":
      return { borderLeftColor: "#e74c3c" };
    default:
      return { borderLeftColor: "#95a5a6" };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef1f5",
    padding: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef1f5",
  },
  centerText: {
    color: "#555",
  },
  filterCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 12,
    color: "#555",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  filterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#f1f3f6",
  },
  filterBtnActive: {
    backgroundColor: "#0066cc",
  },
  filterText: {
    fontSize: 13,
    color: "#333",
  },
  filterTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 6,
  },
  date: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  patientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 6,
  },
  index: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
    color: "#333",
  },
  severity: {
    marginTop: 4,
    fontWeight: "600",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
    fontSize: 15,
  },
});