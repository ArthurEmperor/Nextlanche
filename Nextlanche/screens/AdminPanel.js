import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

export default function AdminPanel({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Painel do Administrador</Text>
      <Text style={styles.subtitulo}>Bem-vindo! Escolha uma das opções abaixo.</Text>

      <TouchableOpacity
        style={styles.botao}
        onPress={() => navigation.navigate("GerenciarProdutos")}
      >
        <View style={styles.iconBox}>
          <FontAwesome name="cutlery" size={24} color="#000" />
        </View>
        <Text style={styles.textoBotao}>Gerenciar Produtos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.botao, styles.botaoSair]}
        onPress={() => navigation.goBack()}
      >
        <View style={[styles.iconBox, styles.iconBoxSair]}>
          <FontAwesome name="arrow-left" size={24} color="#FF5722" />
        </View>
        <Text style={[styles.textoBotao, styles.textoSair]}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#FFF7ED",
  },

  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },

  subtitulo: {
    fontSize: 16,
    color: "#4a4a4a",
    textAlign: "center",
    marginBottom: 40,
    width: "90%",
  },

  botao: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF8A00",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: "100%",
    marginBottom: 20,
    elevation: 3,
  },

  iconBox: {
    width: 45,
    height: 45,
    backgroundColor: "#FFE0B2",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  iconBoxSair: {
    backgroundColor: "#FDE0DC",
  },

  textoBotao: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },

  botaoSair: {
    backgroundColor: "#FFCCBC",
    marginTop: 10,
  },

  textoSair: {
    color: "#FF5722",
  },
});