import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

export default function HomeScreens({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerContainer}>
        <Text style={styles.titulo}>Home</Text>
        <Text style={styles.subtitulo}>Bem-vindo à sua área principal</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome name="star" size={26} color="#000" />
          <Text style={styles.cardTitulo}>Explorar Recursos</Text>
        </View>

        <Text style={styles.cardTexto}>
          Aqui você pode acessar todas as funcionalidades do aplicativo.
        </Text>

        <TouchableOpacity
          style={styles.botao}
          onPress={() => navigation.navigate("Sobre")}
        >
          <Text style={styles.textoBotao}>Explorar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome name="cutlery" size={26} color="#000" />
          <Text style={styles.cardTitulo}>Cantina</Text>
        </View>

        <Text style={styles.cardTexto}>Acesse o sistema da cantina.</Text>

        <TouchableOpacity
          style={styles.botao}
          onPress={() => navigation.navigate("Cantina")}
        >
          <Text style={styles.textoBotao}>Ir para Cantina</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome name="cog" size={26} color="#000" />
          <Text style={styles.cardTitulo}>Configurações</Text>
        </View>

        <Text style={styles.cardTexto}>Ajuste preferências da sua conta.</Text>

        <TouchableOpacity
          style={styles.botao}
          onPress={() => navigation.navigate("Config")}
        >
          <Text style={styles.textoBotao}>Abrir Configurações</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7931E",
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

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },

  cardTitulo: {
    fontSize: 22,
    fontWeight: "bold",
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
