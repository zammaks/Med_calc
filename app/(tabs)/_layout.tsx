import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../src/services/firebase";

export default function TabLayout() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#ffffff"},
          headerTintColor: "#000000",
          tabBarStyle: { backgroundColor: "#ffffff" },

          headerRight: () =>
            user ? (
              <Text style={{ marginRight: 15, fontSize: 12 }}>
                {user.email}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/profile")}
                style={{ marginRight: 15 }}
              >
                <Text style={{ color: "#0066cc" }}>Войти</Text>
              </TouchableOpacity>
            ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Калькулятор",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calculator" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "История",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Профиль",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
