import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "../services/supabase";
import FontAwesome from "react-native-vector-icons/FontAwesome";

export default function TicketScreens() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de criação de ticket
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Carregar tickets do usuário
  async function carregarTickets() {
    setRefreshing(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        Alert.alert("Erro", "Você precisa estar logado para ver os tickets.");
        setRefreshing(false);
        return;
      }
      const userId = userData.user.id;

      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Erro ao carregar tickets:", error);
        Alert.alert("Erro", "Não foi possível carregar os tickets.");
      } else {
        setTickets(data || []);
      }
    } catch (e) {
      console.log(e);
    }
    setRefreshing(false);
    setLoading(false);
  }

  useEffect(() => {
    carregarTickets();

    const channel = supabase
      .channel("public:tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          carregarTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Criar novo ticket
  async function criarTicket() {
    if (!newTitle || !newDescription) {
      Alert.alert("Campos vazios", "Preencha título e descrição.");
      return;
    }
    setCreating(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        Alert.alert("Erro", "Você precisa estar logado para criar um ticket.");
        setCreating(false);
        return;
      }

      const userId = userData.user.id;

      const { error } = await supabase.from("tickets").insert([
        {
          user_id: userId,
          title: newTitle,
          description: newDescription,
          status: "open",
        },
      ]);

      if (error) {
        console.log("Erro ao criar ticket:", error);
        Alert.alert("Erro", "Não foi possível criar o ticket.");
      } else {
        setModalVisible(false);
        setNewTitle("");
        setNewDescription("");
        carregarTickets();
        Alert.alert("Sucesso", "Ticket criado com sucesso!");
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Erro", "Ocorreu um erro ao criar o ticket.");
    }
    setCreating(false);
  }

  // Marcar ticket como resolvido
  async function resolverTicket(ticketId) {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: "resolved" })
        .eq("id", ticketId);

      if (error) {
        Alert.alert("Erro", "Não foi possível resolver o ticket.");
      } else {
        carregarTickets();
      }
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={{
      refreshing: refreshing,
      onRefresh: carregarTickets
    }}>
      <Text style={styles.titulo}>Meus Tickets</Text>

      <TouchableOpacity style={styles.btnNovo} onPress={() => setModalVisible(true)}>
        <Text style={styles.btnNovoTexto}>+ Criar Novo Ticket</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#F7931A" style={{ marginTop: 20 }} />
      ) : tickets.length === 0 ? (
        <Text style={styles.semTickets}>Você não possui tickets.</Text>
      ) : (
        tickets.map((ticket) => (
          <View key={ticket.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{ticket.title}</Text>
              <Text style={ticket.status === "open" ? styles.statusOpen : styles.statusResolved}>
                {ticket.status === "open" ? "Aberto" : "Resolvido"}
              </Text>
            </View>
            <Text style={styles.cardDescription}>{ticket.description}</Text>
            {ticket.status === "open" && (
              <TouchableOpacity style={styles.btnResolver} onPress={() => resolverTicket(ticket.id)}>
                <Text style={styles.btnResolverTexto}>Marcar como Resolvido</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {/* Modal de criação de ticket */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>Novo Ticket</Text>
            <TextInput
              placeholder="Título"
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Descrição"
              value={newDescription}
              onChangeText={setNewDescription}
              style={[styles.input, { height: 100 }]}
              multiline
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#ccc" }]}
                onPress={() => setModalVisible(false)}
                disabled={creating}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#F7931A" }]}
                onPress={criarTicket}
                disabled={creating}
              >
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff" }}>Criar Ticket</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f5f7fa", paddingBottom: 50 },
  titulo: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  btnNovo: { backgroundColor: "#F7931A", padding: 12, borderRadius: 10, alignItems: "center", marginBottom: 20 },
  btnNovoTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  semTickets: { textAlign: "center", fontSize: 16, color: "#555", marginTop: 20 },

  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  statusOpen: { color: "#FF9800", fontWeight: "bold" },
  statusResolved: { color: "#4CAF50", fontWeight: "bold" },
  cardDescription: { fontSize: 15, color: "#555", marginBottom: 10 },
  btnResolver: { backgroundColor: "#4CAF50", padding: 10, borderRadius: 8, alignItems: "center" },
  btnResolverTexto: { color: "#fff", fontWeight: "bold" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", width: "90%", padding: 20, borderRadius: 12 },
  modalTitulo: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: { backgroundColor: "#f1f1f1", padding: 10, borderRadius: 8, marginBottom: 10 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, justifyContent: "center", alignItems: "center" },
});