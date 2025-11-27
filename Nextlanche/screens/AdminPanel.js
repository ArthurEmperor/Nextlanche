import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

export default function AdminPanel({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Painel do Administrador</Text>
      <Text style={styles.subtitulo}>
        Bem-vindo! Escolha uma das categorias abaixo para gerenciar o sistema.
      </Text>

      {/* --- GERENCIAR PRODUTOS --- */}
      <TouchableOpacity
        style={styles.botao}
        onPress={() => navigation.navigate("GerenciarProdutos")}
      >
        <FontAwesome name="cutlery" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.textoBotao}>Gerenciar Produtos</Text>
      </TouchableOpacity>

      {/* --- PEDIDOS --- */}
      <TouchableOpacity
        style={styles.botao}
        onPress={() => navigation.navigate("Pedidos")}
      >
        <FontAwesome name="archive" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.textoBotao}>Pedidos</Text>
      </TouchableOpacity>

      {/* --- USUÁRIOS --- */}
      <TouchableOpacity
        style={styles.botao}
        onPress={() => navigation.navigate("Usuarios")}
      >
        <FontAwesome name="users" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.textoBotao}>Usuários</Text>
      </TouchableOpacity>

      {/* --- CONFIGURAÇÕES --- */}
      <TouchableOpacity
        style={styles.botao}
        onPress={() => navigation.navigate("Config")}
      >
        <FontAwesome name="cogs" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.textoBotao}>Configurações</Text>
      </TouchableOpacity>

      {/* --- VOLTAR OU LOGOUT --- */}
      <TouchableOpacity
        style={[styles.botao, styles.botaoSair]}
        onPress={() => navigation.goBack()}
      >
        <FontAwesome name="arrow-left" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.textoBotao}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1f1f1f",
  },
  subtitulo: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  botao: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196f3",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 15,
    width: "90%",
    elevation: 2,
  },
  botaoSair: {
    backgroundColor: "#d9534f",
  },
  textoBotao: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
});