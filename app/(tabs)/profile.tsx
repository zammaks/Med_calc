import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");

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
      setRole(d.role ?? "patient");
    }
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setUser(auth.currentUser);
    } catch (e: any) {
      Alert.alert("Ошибка входа", e.message);
    }
  };

  const register = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        firstName,
        lastName,
        phone,
        age: Number(age),
        email,
        role,
        createdAt: new Date(),
      });
      setUser(cred.user);
    } catch (e: any) {
      Alert.alert("Ошибка регистрации", e.message);
    }
  };

  const saveProfile = async () => {
    await setDoc(
      doc(db, "users", user.uid),
      { firstName, lastName, phone, age: Number(age), role },
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
    <ScrollView style={styles.container}>
      {/* ===== КАРТОЧКА ПРОФИЛЯ ===== */}
      <View style={styles.card}>
        {user ? (
          <>
            <Text style={styles.title}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.subtitle}>{user.email}</Text>
            <Text style={styles.subtitle}>
              Роль: {role === "doctor" ? "Врач" : "Пациент"}
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

                <Text style={styles.label}>Роль</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleBtn,
                      role === "patient" && styles.selectedBtn,
                    ]}
                    onPress={() => setRole("patient")}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        role === "patient" && styles.selectedText,
                      ]}
                    >
                      Пациент
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleBtn,
                      role === "doctor" && styles.selectedBtn,
                    ]}
                    onPress={() => setRole("doctor")}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        role === "doctor" && styles.selectedText,
                      ]}
                    >
                      Врач
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={saveProfile}>
                  <Text style={styles.btnText}>Сохранить</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.outlineBtn} onPress={() => setEditing(true)}>
                <Text style={styles.outlineText}>Редактировать профиль</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.dangerBtn} onPress={removeAccount}>
              <Text style={styles.btnText}>Удалить аккаунт</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={logout}>
              <Text style={styles.btnText}>Выйти</Text>
            </TouchableOpacity>
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

                <Text style={styles.label}>Роль</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleBtn,
                      role === "patient" && styles.selectedBtn,
                    ]}
                    onPress={() => setRole("patient")}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        role === "patient" && styles.selectedText,
                      ]}
                    >
                      Пациент
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleBtn,
                      role === "doctor" && styles.selectedBtn,
                    ]}
                    onPress={() => setRole("doctor")}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        role === "doctor" && styles.selectedText,
                      ]}
                    >
                      Врач
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={mode === "login" ? login : register}>
              <Text style={styles.btnText}>
                {mode === "login" ? "Войти" : "Зарегистрироваться"}
              </Text>
            </TouchableOpacity>

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

      {/* ===== ИНФОРМАЦИЯ О ПРИЛОЖЕНИИ ===== */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>О приложении</Text>
        <Text style={styles.infoText}>
          Данное приложение предназначено для расчёта индекса Аливерти (PaO₂ / FiO₂),
          используемого для оценки степени дыхательной недостаточности и диагностики ОРДС.
        </Text>

        <Text style={styles.infoSubtitle}>Научная основа</Text>
        <Text style={styles.infoText}>
          • Berlin Definition of ARDS (JAMA){`\n`}
          • Индекс оксигенации в интенсивной терапии{`\n`}
          • Рекомендации по интерпретации PaO₂ / FiO₂
        </Text>

        <Text style={styles.infoNote}>
          Приложение не заменяет клиническое решение врача и носит справочный характер.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f8",
    padding: 16,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "#666",
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },

  primaryBtn: {
    backgroundColor: "#0066cc",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  secondaryBtn: {
    backgroundColor: "#6c757d",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  dangerBtn: {
    backgroundColor: "#dc3545",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  outlineBtn: {
    borderWidth: 1,
    borderColor: "#0066cc",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  btnText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  outlineText: {
    color: "#0066cc",
    fontWeight: "600",
  },

  link: {
    color: "#0066cc",
    textAlign: "center",
    marginTop: 12,
  },

  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },

  infoSubtitle: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 4,
  },

  infoText: {
    color: "#444",
    lineHeight: 20,
  },

  infoNote: {
    marginTop: 10,
    fontSize: 12,
    color: "#777",
  },

  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0066cc",
    alignItems: "center",
    marginHorizontal: 5,
  },

  selectedBtn: {
    backgroundColor: "#0066cc",
  },

  roleText: {
    color: "#0066cc",
    fontWeight: "600",
  },

  selectedText: {
    color: "#ffffff",
  },
});