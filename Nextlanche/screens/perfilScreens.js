import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PerfilScreens() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Seu Perfil</Text>
      <Text style={styles.texto}>Informações básicas do usuário.</Text>
      <Text style={styles.texto}>(Em breve: editar foto, senha, etc.)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  texto: { fontSize: 16, marginBottom: 10, color: "#444" },
});