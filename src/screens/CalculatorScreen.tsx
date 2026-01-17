import React, { useState } from "react";
import { auth } from "../services/auth";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from "react-native";
import { doc,collection, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function CalculatorScreen() {
  const [pao2, setPao2] = useState("");
  const [fio2, setFio2] = useState("");

  const [pao2Error, setPao2Error] = useState("");
  const [fio2Error, setFio2Error] = useState("");

  const [result, setResult] = useState<number | null>(null);
  const [severity, setSeverity] = useState("");

  const isNumeric = (value: string) => /^[0-9]*\.?[0-9]*$/.test(value);

  const calculate = async () => {
    setPao2Error("");
    setFio2Error("");

    let hasError = false;

    if (!isNumeric(pao2) || Number(pao2) <= 0) {
      setPao2Error("Введите числовое значение PaO₂ больше 0");
      hasError = true;
    }

    if (!isNumeric(fio2) || Number(fio2) < 21 || Number(fio2) > 100) {
      setFio2Error("FiO₂ должно быть числом в диапазоне 21–100 %");
      hasError = true;
    }

    if (hasError) return;

    const pao2Num = Number(pao2);
    const fio2Fraction = Number(fio2) / 100;

    const ratio = pao2Num / fio2Fraction;

    let level = "";
    if (ratio > 300) level = "Норма";
    else if (ratio > 200) level = "Лёгкая ОРДС";
    else if (ratio > 100) level = "Средняя ОРДС";
    else level = "Тяжёлая ОРДС";

    setResult(ratio);
    setSeverity(level);

    try {
        const user = auth.currentUser;
        if (!user) return;

        await addDoc(
        collection(db, "users", user.uid, "calculations"),
        {
            pao2: pao2Num,
            fio2Percent: Number(fio2),
            ratio,
            severity: level,
            createdAt: new Date(),
        }
        );

    } catch (e) {
      console.error("Ошибка сохранения:", e);
    }
  };

  const getRowStyle = (type: string) => {
    if (severity.includes(type)) {
      return { backgroundColor: "#d6eaff" };
    }
    return {};
  };

  const getResultColor = () => {
    if (severity.includes("Норма")) return "#d4edda";
    if (severity.includes("Лёгкая")) return "#fff3cd";
    if (severity.includes("Средняя")) return "#ffe0b2";
    return "#f8d7da";
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Индекс Аливерти (PaO₂ / FiO₂)</Text>

      {/* PaO2 */}
      <Text style={styles.label}>PaO₂ (мм рт. ст.)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={pao2}
        onChangeText={setPao2}
        placeholder="Например: 80"
      />
      {pao2Error !== "" && <Text style={styles.error}>{pao2Error}</Text>}

      {/* FiO2 */}
      <Text style={styles.label}>FiO₂ (%)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={fio2}
        onChangeText={setFio2}
        placeholder="Введите число в диапазоне 21–100"
      />
      {fio2Error !== "" && <Text style={styles.error}>{fio2Error}</Text>}

      <Button title="Рассчитать" onPress={calculate} />

      {/* Result */}
      {result !== null && (
        <View style={[styles.resultBox, { backgroundColor: getResultColor() }]}>
          <Text style={styles.resultText}>
            Индекс оксигенации: {result.toFixed(1)}
          </Text>
          <Text style={styles.resultText}>
            Степень: {severity}
          </Text>
        </View>
      )}

      {/* Table */}
      <View style={styles.table}>
        <Text style={styles.tableTitle}>
          Интерпретация индекса оксигенации
        </Text>

        <View style={styles.tableRowHeader}>
          <Text style={styles.tableCellHeader}>Степень</Text>
          <Text style={styles.tableCellHeader}>PaO₂ / FiO₂</Text>
          <Text style={styles.tableCellHeader}>Летальность</Text>
        </View>

        <View style={[styles.tableRow, getRowStyle("Норма")]}>
          <Text style={styles.tableCell}>Норма</Text>
          <Text style={styles.tableCell}>{"> 300"}</Text>
          <Text style={styles.tableCell}>—</Text>
        </View>

        <View style={[styles.tableRow, getRowStyle("Лёгкая")]}>
          <Text style={styles.tableCell}>Лёгкая ОРДС</Text>
          <Text style={styles.tableCell}>200–300</Text>
          <Text style={styles.tableCell}>27%</Text>
        </View>

        <View style={[styles.tableRow, getRowStyle("Средняя")]}>
          <Text style={styles.tableCell}>Средняя ОРДС</Text>
          <Text style={styles.tableCell}>100–200</Text>
          <Text style={styles.tableCell}>32%</Text>
        </View>

        <View style={[styles.tableRow, getRowStyle("Тяжёлая")]}>
          <Text style={styles.tableCell}>Тяжёлая ОРДС</Text>
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
