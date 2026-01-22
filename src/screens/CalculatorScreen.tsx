import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";

const toNumber = (v: string): number => {
  const n = Number(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
};

export default function CalculatorScreen() {
  const [pao2, setPao2] = useState("");
  const [fio2, setFio2] = useState("");
  const [patientName, setPatientName] = useState("");

  const [pao2Error, setPao2Error] = useState("");
  const [fio2Error, setFio2Error] = useState("");
  const [patientError, setPatientError] = useState("");

  const [result, setResult] = useState<number | null>(null);
  const [severity, setSeverity] = useState("");

  const [isDoctor, setIsDoctor] = useState<boolean | null>(null); // null = загрузка
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  // Надёжное определение роли врача
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsDoctor(false);
        setCurrentUserUid(null);
        return;
      }

      setCurrentUserUid(user.uid);

      try {
        const userQuery = query(
          collection(db, "users"),
          where("__name__", "==", user.uid)
        );
        const userSnap = await getDocs(userQuery);

        if (!userSnap.empty) {
          const data = userSnap.docs[0].data();
          setIsDoctor(data.role === "doctor");
        } else {
          setIsDoctor(false);
        }
      } catch (err) {
        console.error("Ошибка при проверке роли:", err);
        setIsDoctor(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const calculate = async () => {
    setPao2Error("");
    setFio2Error("");
    setPatientError("");
    setResult(null);
    setSeverity("");

    const pao2Num = toNumber(pao2);
    const fio2Percent = toNumber(fio2);

    let hasError = false;

    if (pao2Num <= 0) {
      setPao2Error("Введите PaO₂ больше 0");
      hasError = true;
    }

    if (fio2Percent < 21 || fio2Percent > 100) {
      setFio2Error("FiO₂ должно быть в диапазоне 21–100%");
      hasError = true;
    }

    if (isDoctor && !patientName.trim()) {
      setPatientError("Укажите ФИО пациента");
      hasError = true;
    }

    if (hasError || isDoctor === null) return;

    const ratio = pao2Num / (fio2Percent / 100);
    const rounded = Number(ratio.toFixed(1));

    let level = "";
    if (rounded > 300) level = "Норма";
    else if (rounded > 200) level = "Лёгкая ОРДС";
    else if (rounded > 100) level = "Средняя ОРДС";
    else level = "Тяжёлая ОРДС";

    setResult(rounded);
    setSeverity(level);

    try {
      if (!currentUserUid) {
        Alert.alert("Ошибка", "Пользователь не авторизован");
        return;
      }

      let targetUid = currentUserUid;

      // Для врача — пытаемся найти пациента по ФИО
      if (isDoctor) {
        const nameParts = patientName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts[1] || "";

        const patientsQuery = query(
          collection(db, "users"),
          where("firstName", "==", firstName),
          where("lastName", "==", lastName)
        );

        const patientsSnap = await getDocs(patientsQuery);

        if (!patientsSnap.empty) {
          targetUid = patientsSnap.docs[0].id;
        } else {
          Alert.alert("Внимание", "Пациент с таким ФИО не найден. Сохраняем под вашим аккаунтом.");
        }
      }

      const targetCollection = collection(db, "users", targetUid, "calculations");

      // Проверка на одну запись сегодня (закомментировано в оригинале)
      // ... (оставляем как было)

      await saveCalculation(targetCollection, rounded, level, pao2Num, fio2Percent);

      // ────────────────────────────────────────────────
      // Очистка полей после успешного сохранения
      setPao2("");
      setFio2("");
      if (isDoctor) {
        setPatientName("");
      }
      // ────────────────────────────────────────────────

    } catch (e: any) {
      console.error("Ошибка сохранения:", e);
      Alert.alert("Ошибка", `Не удалось сохранить расчёт\n${e.message || ""}`);
      // поля НЕ очищаем при ошибке
    }
  };

  const saveCalculation = async (
    coll: any,
    ratio: number,
    sev: string,
    pao2Val: number,
    fio2Val: number
  ) => {
    const data: any = {
      pao2: pao2Val,
      fio2Percent: fio2Val,
      ratio,
      severity: sev,
      createdAt: serverTimestamp(), // лучше использовать серверное время
    };

    if (isDoctor) {
      data.doctorId = currentUserUid;
      data.patientName = patientName.trim();
    }

    await addDoc(coll, data);
    Alert.alert("Успешно", "Расчёт сохранён");
  };

  const getResultColor = () => {
    if (severity === "Норма") return "#d4edda";
    if (severity === "Лёгкая ОРДС") return "#fff3cd";
    if (severity === "Средняя ОРДС") return "#ffe0b2";
    if (severity === "Тяжёлая ОРДС") return "#f8d7da";
    return "#eef6ff";
  };

  const rowHighlight = (label: string) =>
    severity === label ? { backgroundColor: "#e6f0ff" } : undefined;

  if (isDoctor === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Индекс оксигенации</Text>
      <Text style={styles.subtitle}>
        Расчёт PaO₂ / FiO₂ для оценки степени дыхательной недостаточности
      </Text>

      {isDoctor && (
        <>
          <Text style={styles.label}>ФИО пациента</Text>
          <TextInput
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Иванов Иван Иванович"
          />
          {!!patientError && <Text style={styles.error}>{patientError}</Text>}
        </>
      )}

      <Text style={styles.label}>PaO₂ (мм рт. ст.)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={pao2}
        onChangeText={setPao2}
        placeholder="Например: 80"
      />
      {!!pao2Error && <Text style={styles.error}>{pao2Error}</Text>}

      <Text style={styles.label}>FiO₂ (%)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={fio2}
        onChangeText={setFio2}
        placeholder="21–100"
      />
      {!!fio2Error && <Text style={styles.error}>{fio2Error}</Text>}

      <TouchableOpacity style={styles.calculateButton} onPress={calculate}>
        <Text style={styles.calculateText}>Рассчитать</Text>
      </TouchableOpacity>

      {result !== null && (
        <View style={[styles.resultBox, { backgroundColor: getResultColor() }]}>
          <Text style={styles.resultText}>Индекс: {result}</Text>
          <Text style={styles.resultText}>Степень: {severity}</Text>
        </View>
      )}

      <View style={styles.table}>
        <Text style={styles.tableTitle}>Интерпретация</Text>

        <View style={styles.tableRowHeader}>
          <Text style={styles.tableCellHeader}>Степень</Text>
          <Text style={styles.tableCellHeader}>PaO₂ / FiO₂</Text>
          <Text style={styles.tableCellHeader}>Летальность</Text>
        </View>

        <View style={[styles.tableRow, rowHighlight("Норма")]}>
          <Text style={styles.tableCell}>Норма</Text>
          <Text style={styles.tableCell}>{"> 300"}</Text>
          <Text style={styles.tableCell}>—</Text>
        </View>

        <View style={[styles.tableRow, rowHighlight("Лёгкая ОРДС")]}>
          <Text style={styles.tableCell}>Лёгкая</Text>
          <Text style={styles.tableCell}>200–300</Text>
          <Text style={styles.tableCell}>27%</Text>
        </View>

        <View style={[styles.tableRow, rowHighlight("Средняя ОРДС")]}>
          <Text style={styles.tableCell}>Средняя</Text>
          <Text style={styles.tableCell}>100–200</Text>
          <Text style={styles.tableCell}>32%</Text>
        </View>

        <View style={[styles.tableRow, rowHighlight("Тяжёлая ОРДС")]}>
          <Text style={styles.tableCell}>Тяжёлая</Text>
          <Text style={styles.tableCell}>{"< 100"}</Text>
          <Text style={styles.tableCell}>45%</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// стили остаются те же
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#444",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    marginBottom: 12,
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
  calculateButton: {
    backgroundColor: "#007bff",
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 16,
    marginBottom: 24,
  },
  calculateText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  resultBox: {
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  resultText: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 4,
  },
  table: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableTitle: {
    backgroundColor: "#e8f0fe",
    padding: 12,
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCellHeader: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontWeight: "600",
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ddd",
  },
  tableCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ddd",
  },
});