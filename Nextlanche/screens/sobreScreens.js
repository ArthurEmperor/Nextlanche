import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

export default function SobreScreens() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Sobre o App</Text>

      <View style={styles.card}>
        <View style={styles.iconBox}>
          <FontAwesome name="info-circle" size={26} color="#F7931A" />
        </View>
        <View style={styles.cardTextBox}>
          <Text style={styles.cardTitulo}>O que é o Next Lanche?</Text>
          <Text style={styles.cardTexto}>
            O Next Lanche foi desenvolvido para modernizar e facilitar o sistema
            de compra da cantina, trazendo mais agilidade, organização e 
            praticidade tanto para os alunos quanto para a equipe responsável.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconBox}>
          <FontAwesome name="users" size={26} color="#F7931A" />
        </View>
        <View style={styles.cardTextBox}>
          <Text style={styles.cardTitulo}>Desenvolvedores</Text>
          <Text style={styles.cardTexto}>
            Projeto criado por:
          </Text>
          <Text style={styles.nomeDev}>• Arthur</Text>
          <Text style={styles.nomeDev}>• Robson</Text>
          <Text style={styles.nomeDev}>• João Guilherme</Text>
          <Text style={styles.nomeDev}>• laís</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconBox}>
          <FontAwesome name="rocket" size={26} color="#F7931A" />
        </View>
        <View style={styles.cardTextBox}>
          <Text style={styles.cardTitulo}>Objetivo do Aplicativo</Text>
          <Text style={styles.cardTexto}>
            Tornar o processo de compra mais rápido, reduzir filas, melhorar o
            fluxo de pedidos e oferecer uma experiência moderna para todos.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconBox}>
          <FontAwesome name="mobile" size={26} color="#F7931A" />
        </View>
        <View style={styles.cardTextBox}>
          <Text style={styles.cardTitulo}>Versão Atual</Text>
          <Text style={styles.cardTexto}>Aplicativo versão 1.0.0</Text>
          <Text style={styles.cardTexto}>
            Feito utilizando React Native e voltado para alto desempenho,
            estabilidade e experiência do usuário.
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: "#f5f7fa",
  },

  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1E1E1E",
    textAlign: "center",
    marginBottom: 30,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  iconBox: {
    width: 55,
    height: 55,
    borderRadius: 14,
    backgroundColor: "#FFE6C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },

  cardTextBox: {
    flex: 1,
  },

  cardTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E1E1E",
    marginBottom: 6,
  },

  cardTexto: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },

  nomeDev: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginTop: 4,
  },
});