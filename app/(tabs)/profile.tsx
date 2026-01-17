import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  deleteUser,
} from "firebase/auth";
import { auth, db } from "../../src/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(auth.currentUser);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [editing, setEditing] = useState(false);

  // общие
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // профиль
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const d = snap.data();
      setFirstName(d.firstName ?? "");
      setLastName(d.lastName ?? "");
      setPhone(d.phone ?? "");
      setAge(d.age?.toString() ?? "");
    }
  };

  // ---------- ВХОД ----------
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setUser(auth.currentUser);
    } catch (e: any) {
      Alert.alert("Ошибка входа", e.message);
    }
  };

  // ---------- РЕГИСТРАЦИЯ ----------
  const register = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", cred.user.uid), {
        firstName,
        lastName,
        phone,
        age: Number(age),
        email,
        createdAt: new Date(),
      });

      setUser(cred.user);
    } catch (e: any) {
      Alert.alert("Ошибка регистрации", e.message);
    }
  };

  // ---------- СОХРАНЕНИЕ ПРОФИЛЯ ----------
  const saveProfile = async () => {
    await setDoc(
      doc(db, "users", user.uid),
      {
        firstName,
        lastName,
        phone,
        age: Number(age),
      },
      { merge: true }
    );
    setEditing(false);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const removeAccount = async () => {
    Alert.alert("Удалить аккаунт?", "Это действие необратимо", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          await deleteUser(user);
          setUser(null);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.title}>
            Вы вошли как {firstName} {lastName}
          </Text>

          {editing ? (
            <>
              <Text style={styles.label}>Имя</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

              <Text style={styles.label}>Фамилия</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

              <Text style={styles.label}>Телефон</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} />

              <Text style={styles.label}>Возраст</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />

              <Button title="Сохранить изменения" onPress={saveProfile} />
            </>
          ) : (
            <>
              <Button title="Редактировать профиль" onPress={() => setEditing(true)} />
            </>
          )}

          <View style={{ height: 10 }} />
          <Button title="Удалить аккаунт" color="red" onPress={removeAccount} />
          <View style={{ height: 10 }} />
          <Button title="Выйти" onPress={logout} />
        </>
      ) : (
        <>
          <Text style={styles.title}>
            {mode === "login" ? "Вход" : "Регистрация"}
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} />

          <Text style={styles.label}>Пароль</Text>
          <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />

          {mode === "register" && (
            <>
              <Text style={styles.label}>Имя</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

              <Text style={styles.label}>Фамилия</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

              <Text style={styles.label}>Телефон</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} />

              <Text style={styles.label}>Возраст</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
            </>
          )}

          <Button
            title={mode === "login" ? "Войти" : "Зарегистрироваться"}
            onPress={mode === "login" ? login : register}
          />

          <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")}>
            <Text style={styles.link}>
              {mode === "login"
                ? "Нет аккаунта? Зарегистрируйтесь"
                : "Уже есть аккаунт? Войдите"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", padding: 20 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 15 },
  label: { fontSize: 13, color: "#444", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  link: { color: "#0066cc", marginTop: 10, textAlign: "center" },
});
