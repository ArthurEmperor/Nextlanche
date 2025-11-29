import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.titulo}>Home</Text>
        <Text style={styles.subtitulo}>Bem-vindo à sua área principal</Text>
      </View>

      {/* CARD PRINCIPAL */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Explorar Recursos</Text>
        <Text style={styles.cardTexto}>
          Aqui você pode acessar todas as funcionalidades do aplicativo.
        </Text>

        <TouchableOpacity style={styles.botao}>
          <Text style={styles.textoBotao}>Explorar</Text>
        </TouchableOpacity>
      </View>

      {/* OUTROS CARDS OPCIONAIS */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Cantina</Text>
        <Text style={styles.cardTexto}>Acesse o sistema da cantina.</Text>

        <TouchableOpacity style={styles.botao}>
          <Text style={styles.textoBotao}>Ir para Cantina</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Configurações</Text>
        <Text style={styles.cardTexto}>Ajuste preferências da sua conta.</Text>

        <TouchableOpacity style={styles.botao}>
          <Text style={styles.textoBotao}>Abrir Configurações</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7931E", // Laranja igual à Cantina
    paddingHorizontal: 20,
  },

  headerContainer: {
    marginTop: 40,
    marginBottom: 20,
  },

  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
  },

  subtitulo: {
    fontSize: 18,
    color: "#222",
    marginTop: 5,
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 3,
  },

  cardTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  cardTexto: {
    fontSize: 16,
    color: "#444",
    marginBottom: 20,
  },

  botao: {
    backgroundColor: "#000",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },

  textoBotao: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});