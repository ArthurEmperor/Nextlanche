import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SobreScreens() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Sobre o App</Text>
      <Text style={styles.texto}>
        Este aplicativo foi desenvolvido para facilitar as compras na cantina,
        agilizar o atendimento e melhorar a organização dos pedidos.
      </Text>

      <Text style={styles.texto}>
        Desenvolvido por: <Text style={{fontWeight:"bold"}}>Arthur,Robson, e João Guilherme</Text>
      </Text>

      <Text style={styles.texto}>Versão: 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  texto: { fontSize: 16, marginBottom: 10, color: "#444" },
});