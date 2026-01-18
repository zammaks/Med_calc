import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

/** безопасное преобразование в число (Android-safe) */
const toNumber = (v: string): number => {
  const n = Number(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
};

export default function CalculatorScreen() {
  const [pao2, setPao2] = useState("");
  const [fio2, setFio2] = useState("");

  const [pao2Error, setPao2Error] = useState("");
  const [fio2Error, setFio2Error] = useState("");

  const [result, setResult] = useState<number | null>(null);
  const [severity, setSeverity] = useState("");

  const calculate = async () => {
    setPao2Error("");
    setFio2Error("");
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

    if (hasError) return;

    const fio2Fraction = fio2Percent / 100;
    if (fio2Fraction === 0) return;

    const ratio = pao2Num / fio2Fraction;
    const rounded = Number(ratio.toFixed(1));

    let level = "";
    if (rounded > 300) level = "Норма";
    else if (rounded > 200) level = "Лёгкая ОРДС";
    else if (rounded > 100) level = "Средняя ОРДС";
    else level = "Тяжёлая ОРДС";

    setResult(rounded);
    setSeverity(level);

    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(
        collection(db, "users", user.uid, "calculations"),
        {
          pao2: pao2Num,
          fio2Percent,
          ratio: rounded,
          severity: level,
          createdAt: new Date(),
        }
      );
    } catch (e) {
      console.error("Ошибка сохранения:", e);
    }
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Индекс оксигенации (PaO₂ / FiO₂)</Text>

      {/* PaO2 */}
      <Text style={styles.label}>PaO₂ (мм рт. ст.)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={pao2}
        onChangeText={setPao2}
        placeholder="Например: 80"
      />
      {!!pao2Error && <Text style={styles.error}>{pao2Error}</Text>}

      {/* FiO2 */}
      <Text style={styles.label}>FiO₂ (%)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={fio2}
        onChangeText={setFio2}
        placeholder="21–100"
      />
      {!!fio2Error && <Text style={styles.error}>{fio2Error}</Text>}

      <Button title="Рассчитать" onPress={calculate} />

      {/* Result */}
      {result !== null && (
        <View style={[styles.resultBox, { backgroundColor: getResultColor() }]}>
          <Text style={styles.resultText}>
            Индекс: {result}
          </Text>
          <Text style={styles.resultText}>
            Степень: {severity}
          </Text>
        </View>
      )}

      {/* Table */}
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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  table: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableTitle: {
    backgroundColor: "#e3ecf5",
    padding: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCellHeader: {
    flex: 1,
    padding: 8,
    fontWeight: "600",
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  tableCell: {
    flex: 1,
    padding: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
});
