import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "../services/supabase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function Config() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const navigation = useNavigation();

  const logout = async () => {
    await supabase.auth.signOut();
    navigation.replace("Login"); // garante que não dá pra voltar com o botão de voltar
  };

  return (
    <View style={[styles.container, isDarkMode ? styles.dark : styles.light]}>
      <Text style={[styles.title, isDarkMode && styles.darkText]}>
        Configurações
      </Text>

      {/* Modo escuro */}
      <View style={styles.setting}>
        <View style={styles.row}>
          <Ionicons
            name="moon"
            size={22}
            color={isDarkMode ? "#fff" : "#222"}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
            Modo Escuro
          </Text>
        </View>

        <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
      </View>

      {/* Notificações */}
      <View style={styles.setting}>
        <View style={styles.row}>
          <Ionicons
            name="notifications"
            size={22}
            color={isDarkMode ? "#fff" : "#222"}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
            Notificações
          </Text>
        </View>

        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </View>

      {/* Versão */}
      <View style={styles.info}>
        <Text style={[styles.versionText, isDarkMode && styles.darkText]}>
          Versão do App: 1.0.0
        </Text>
      </View>

      {/* Botão sair */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out" size={18} color="#fff" />
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  light: { backgroundColor: "#f9f9f9" },
  dark: { backgroundColor: "#1c1c1c" },

  title: {
    fontSize: 26,
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "bold",
    color: "#222",
  },

  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#eaeaea",
    borderRadius: 10,
    marginBottom: 15,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  settingText: {
    fontSize: 18,
    color: "#222",
  },

  info: {
    marginTop: 40,
    alignItems: "center",
  },

  versionText: {
    fontSize: 16,
    color: "#666",
  },

  logoutButton: {
    marginTop: 40,
    backgroundColor: "#e53935",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },

  logoutText: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 8,
    fontWeight: "bold",
  },

  darkText: {
    color: "#fff",
  },
});