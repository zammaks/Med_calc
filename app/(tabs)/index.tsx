import { View, Text, StyleSheet } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../../src/services/firebase";
import Calculator from "../../src/screens/CalculatorScreen";
import { router } from "expo-router";

export default function CalculatorTab() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setName(null);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setName(`${d.firstName ?? ""} ${d.lastName ?? ""}`.trim());
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      {name ? (
        <Text style={styles.welcome}>
          Добро пожаловать, {name}!
        </Text>
      ) : (
        <Text style={styles.welcome}>
          Добро пожаловать.{" "}
          <Text style={styles.link} onPress={() => router.push("/profile")}>
            Войдите
          </Text>
          , чтобы видеть историю измерений.
        </Text>
      )}

      <Calculator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  welcome: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "500",
  },
  link: {
    color: "#0066cc",
  },
});
