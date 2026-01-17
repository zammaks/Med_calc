import { View, Text, StyleSheet } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../src/services/firebase";
import Calculator from "../../src/screens/CalculatorScreen";
import { router } from "expo-router";

export default function IndexScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <View style={styles.container}>
      {user ? (
        <Text style={styles.welcome}>Добро пожаловать!</Text>
      ) : (
        <Text style={styles.welcome}>
          Добро пожаловать.{" "}
          <Text style={styles.link} onPress={() => router.push("/profile")}>
            Войдите
          </Text>{" "}
          или{" "}
          <Text style={styles.link} onPress={() => router.push("/profile")}>
            зарегистрируйтесь
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
