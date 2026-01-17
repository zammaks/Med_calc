import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  onAuthStateChanged,
  updateEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../src/services/firebase";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<"login" | "register">("login");

  // общие
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // регистрация / профиль
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const d = snap.data();
          setName(d.name ?? "");
          setSurname(d.surname ?? "");
          setPhone(d.phone ?? "");
          setAge(d.age?.toString() ?? "");
          setEmail(u.email ?? "");
        }
      }
    });
  }, []);

  /* ---------------- ВАЛИДАЦИЯ ---------------- */

  const validate = () => {
    const e: any = {};

    if (!email.includes("@")) e.email = "Введите корректный email";
    if (password.length < 6 && !user)
      e.password = "Пароль минимум 6 символов";

    if (mode === "register" || user) {
      if (!name) e.name = "Введите имя";
      if (!surname) e.surname = "Введите фамилию";
      if (!/^\+?\d{10,15}$/.test(phone))
        e.phone = "Телефон в формате +79991234567";
      if (+age < 1 || +age > 120)
        e.age = "Возраст должен быть от 1 до 120";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- АВТОРИЗАЦИЯ ---------------- */

  const login = async () => {
    if (!validate()) return;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Успешно", "Вы вошли в аккаунт");
    } catch (e: any) {
      Alert.alert("Ошибка", e.message);
    }
  };

  const register = async () => {
    if (!validate()) return;
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        surname,
        phone,
        age: Number(age),
        createdAt: new Date(),
      });

      Alert.alert("Успешно", "Аккаунт создан");
    } catch (e: any) {
      Alert.alert("Ошибка", e.message);
    }
  };

  /* ---------------- ПРОФИЛЬ ---------------- */

  const saveProfile = async () => {
    if (!validate()) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        surname,
        phone,
        age: Number(age),
      });

      if (email !== user.email) {
        await updateEmail(user, email);
      }

      Alert.alert("Успешно", "Профиль обновлён");
    } catch (e: any) {
      Alert.alert("Ошибка", e.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const removeAccount = async () => {
    Alert.alert("Подтверждение", "Удалить аккаунт навсегда?", [
      { text: "Отмена" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUser(user);
            Alert.alert("Аккаунт удалён");
          } catch (e: any) {
            Alert.alert("Ошибка", "Перезайдите и попробуйте снова");
          }
        },
      },
    ]);
  };

  /* ---------------- UI ---------------- */

  const Input = (props: any) => (
    <>
      <TextInput style={styles.input} {...props} />
      {errors[props.name] && (
        <Text style={styles.error}>{errors[props.name]}</Text>
      )}
    </>
  );

  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          {mode === "login" ? "Вход" : "Регистрация"}
        </Text>

        {mode === "register" && (
          <>
            <Input placeholder="Имя" value={name} onChangeText={setName} name="name" />
            <Input
              placeholder="Фамилия"
              value={surname}
              onChangeText={setSurname}
              name="surname"
            />
            <Input
              placeholder="Телефон"
              value={phone}
              onChangeText={setPhone}
              name="phone"
            />
            <Input
              placeholder="Возраст"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
              name="age"
            />
          </>
        )}

        <Input placeholder="Email" value={email} onChangeText={setEmail} name="email" />
        <Input
          placeholder="Пароль"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          name="password"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={mode === "login" ? login : register}
        >
          <Text style={styles.buttonText}>
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.link}
          onPress={() =>
            setMode(mode === "login" ? "register" : "login")
          }
        >
          {mode === "login"
            ? "Нет аккаунта? Зарегистрируйтесь"
            : "Уже есть аккаунт? Войдите"}
        </Text>
      </ScrollView>
    );
  }

  /* -------- АВТОРИЗОВАН -------- */

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Профиль</Text>

      <Input placeholder="Имя" value={name} onChangeText={setName} name="name" />
      <Input
        placeholder="Фамилия"
        value={surname}
        onChangeText={setSurname}
        name="surname"
      />
      <Input
        placeholder="Телефон"
        value={phone}
        onChangeText={setPhone}
        name="phone"
      />
      <Input
        placeholder="Возраст"
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
        name="age"
      />
      <Input placeholder="Email" value={email} onChangeText={setEmail} name="email" />

      <TouchableOpacity style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Сохранить</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.out} onPress={logout}>
        <Text>Выйти</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={removeAccount}>
        <Text style={styles.delete}>Удалить аккаунт</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------------- СТИЛИ ---------------- */

const styles = StyleSheet.create({
  container: { padding: 20,backgroundColor: "#ffffff", },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 4,
  },
  error: { color: "red", marginBottom: 8, fontSize: 12 },
  button: {
    backgroundColor: "#0066cc",
    padding: 14,
    borderRadius: 6,
    marginTop: 10,
  },
  buttonText: { color: "white", textAlign: "center", fontWeight: "600" },
  link: { marginTop: 15, color: "#0066cc", textAlign: "center" },
  out: { marginTop: 20, alignItems: "center" },
  delete: {
    color: "red",
    marginTop: 15,
    textAlign: "center",
  },
});
