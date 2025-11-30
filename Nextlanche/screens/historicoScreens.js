import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { supabase } from "../services/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function HistoricoScreens() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    setCarregando(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setErro("Não foi possível carregar o usuário.");
      setCarregando(false);
      return;
    }

    const alunoId = userData.user.id;

    const { data, error } = await supabase
      .from("transacoes")
      .select("*")
      .eq("tipo", "compra")
      .eq("aluno_id", alunoId)
      .order("created_at", { ascending: false });

    if (error) {
      setErro("Erro ao carregar histórico.");
      console.log(error);
      setCarregando(false);
      return;
    }

    setPedidos(data);
    setCarregando(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="cart-check" size={26} color="#ffa31a" />
        <Text style={styles.cardTitle}>Compra realizada</Text>
      </View>

      <Text style={styles.cardText}>
        <Text style={styles.bold}>Data: </Text>
        {new Date(item.created_at).toLocaleString("pt-BR")}
      </Text>

      <Text style={styles.cardText}>
        <Text style={styles.bold}>Valor: </Text>
        R$ {item.valor.toFixed(2)}
      </Text>

      {item.descricao && (
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Descrição: </Text>
          {item.descricao}
        </Text>
      )}
    </View>
  );

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffa31a" />
        <Text style={styles.loadingText}>Carregando histórico...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{erro}</Text>
      </View>
    );
  }

  if (pedidos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="clipboard-text-off" size={70} color="#777" />
        <Text style={styles.emptyText}>Você ainda não possui compras registradas.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Histórico de Compras</Text>

      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffa31a",
    marginBottom: 20,
  },

  // CARD
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#ffa31a",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffa31a",
  },
  cardText: {
    color: "#ccc",
    fontSize: 15,
    marginTop: 4,
  },
  bold: {
    fontWeight: "bold",
    color: "#fff",
  },

  // LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: {
    marginTop: 10,
    color: "#ffa31a",
  },

  // ERROR
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 18,
  },

  // EMPTY
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  emptyText: {
    marginTop: 15,
    color: "#888",
    fontSize: 18,
    textAlign: "center",
    maxWidth: 250,
  },
});