import React, { useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";

export default function Config() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>

      <View style={styles.setting}>
        <Text>Modo Escuro</Text>
        <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
      </View>

      <View style={styles.setting}>
        <Text>Notificações</Text>
        <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
      </View>

      <View style={styles.info}>
        <Text>Versão do App: 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, marginBottom: 30, textAlign: "center" },
  setting: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  info: { marginTop: 50, alignItems: "center" },
});