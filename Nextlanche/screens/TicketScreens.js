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
  RefreshControl,
} from "react-native";
import { supabase } from "../services/supabase";

export default function TicketScreen() {
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
        setLoading(false);
        return;
      }

      const userId = userData.user.id;

      // Buscar tickets com status 'ativo' ou 'open' (não usado)
      const { data, error } = await supabase
        .from("tickets")
        .select("*, produtos(nome, preco)")
        .eq("usuario_id", userId)
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

    // Realtime
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

    return () => supabase.removeChannel(channel);
  }, []);

  // Criar novo ticket de suporte
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
      const codigoUnico = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const { error } = await supabase.from("tickets").insert([
        {
          usuario_id: userId,
          title: newTitle,
          description: newDescription,
          status: "open",
          codigo: codigoUnico,
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
        Alert.alert("Sucesso", "Ticket de suporte criado com sucesso!");
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

  // Usar ticket para compra (marcar como usado)
  async function usarTicketParaCompra(ticketId) {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: "usado" })
        .eq("id", ticketId);

      if (error) {
        Alert.alert("Erro", "Não foi possível usar o ticket.");
      } else {
        carregarTickets();
        Alert.alert("Sucesso", "Ticket utilizado com sucesso!");
      }
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={carregarTickets} />
      }
    >
      <Text style={styles.titulo}>Meus Tickets</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          • <Text style={{ fontWeight: "bold" }}>Tickets ativos</Text>: podem ser usados para compras grátis
        </Text>
        <Text style={styles.infoText}>
          • <Text style={{ fontWeight: "bold" }}>Tickets usados</Text>: já foram aplicados em compras
        </Text>
        <Text style={styles.infoText}>
          • <Text style={{ fontWeight: "bold" }}>Tickets de suporte</Text>: para problemas ou dúvidas
        </Text>
      </View>

      <TouchableOpacity
        style={styles.btnNovo}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.btnNovoTexto}>+ Criar Novo Ticket de Suporte</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#F7931A" style={{ marginTop: 20 }} />
      ) : tickets.length === 0 ? (
        <Text style={styles.semTickets}>Você não possui tickets.</Text>
      ) : (
        tickets.map((ticket) => (
          <View key={ticket.id} style={[
            styles.card,
            ticket.status === "ativo" && styles.cardAtivo,
            ticket.status === "usado" && styles.cardUsado,
            ticket.status === "resolved" && styles.cardResolvido
          ]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{ticket.title || `Ticket ${ticket.codigo?.slice(0, 12) || ticket.id.slice(0, 8)}`}</Text>
                <Text style={styles.cardCodigo}>Código: {ticket.codigo || ticket.id}</Text>
              </View>
              <Text
                style={[
                  styles.status,
                  ticket.status === "ativo" && styles.statusAtivo,
                  ticket.status === "usado" && styles.statusUsado,
                  ticket.status === "open" && styles.statusOpen,
                  ticket.status === "resolved" && styles.statusResolved
                ]}
              >
                {ticket.status === "ativo" ? "Ativo" : 
                 ticket.status === "usado" ? "Usado" :
                 ticket.status === "open" ? "Aberto" : "Resolvido"}
              </Text>
            </View>

            {ticket.description && (
              <Text style={styles.cardDescription}>{ticket.description}</Text>
            )}

            {ticket.produto_id && (
              <View style={styles.produtoInfo}>
                <Text style={styles.produtoLabel}>Produto:</Text>
                <Text style={styles.produtoNome}>
                  {ticket.produtos?.nome || `ID: ${ticket.produto_id}`}
                </Text>
              </View>
            )}

            {ticket.created_at && (
              <Text style={styles.cardDate}>
                Criado em: {new Date(ticket.created_at).toLocaleDateString()}
              </Text>
            )}

            <View style={styles.cardActions}>
              {ticket.status === "ativo" && ticket.produto_id && (
                <TouchableOpacity
                  style={[styles.btnAcao, { backgroundColor: "#4CAF50" }]}
                  onPress={() => usarTicketParaCompra(ticket.id)}
                >
                  <Text style={styles.btnAcaoTexto}>Usar para Compra</Text>
                </TouchableOpacity>
              )}

              {ticket.status === "open" && (
                <TouchableOpacity
                  style={[styles.btnAcao, { backgroundColor: "#4CAF50" }]}
                  onPress={() => resolverTicket(ticket.id)}
                >
                  <Text style={styles.btnAcaoTexto}>Marcar como Resolvido</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}

      {/* Modal para criar ticket de suporte */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>Novo Ticket de Suporte</Text>

            <TextInput
              placeholder="Título do problema"
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.input}
              maxLength={50}
            />

            <TextInput
              placeholder="Descreva o problema em detalhes"
              value={newDescription}
              onChangeText={setNewDescription}
              style={[styles.input, { height: 120 }]}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />

            <Text style={styles.charCount}>
              {newDescription.length}/500 caracteres
            </Text>

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
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>Criar Ticket</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    backgroundColor: "#f5f7fa", 
    paddingBottom: 50 
  },
  titulo: { 
    fontSize: 28, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 20 
  },
  infoBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#F7931A",
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  btnNovo: {
    backgroundColor: "#F7931A",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  btnNovoTexto: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  semTickets: { 
    textAlign: "center", 
    fontSize: 16, 
    color: "#555", 
    marginTop: 20 
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardAtivo: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  cardUsado: {
    borderLeftWidth: 4,
    borderLeftColor: "#9E9E9E",
    opacity: 0.8,
  },
  cardResolvido: {
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: "bold",
    flex: 1,
  },
  cardCodigo: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  status: { 
    fontWeight: "bold",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAtivo: { 
    backgroundColor: "#E8F5E9", 
    color: "#2E7D32" 
  },
  statusUsado: { 
    backgroundColor: "#F5F5F5", 
    color: "#616161" 
  },
  statusOpen: { 
    backgroundColor: "#FFF3E0", 
    color: "#EF6C00" 
  },
  statusResolved: { 
    backgroundColor: "#E3F2FD", 
    color: "#1565C0" 
  },
  cardDescription: { 
    fontSize: 15, 
    color: "#555", 
    marginBottom: 10,
    lineHeight: 20,
  },
  produtoInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  produtoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginRight: 6,
  },
  produtoNome: {
    fontSize: 14,
    color: "#333",
  },
  cardDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  btnAcao: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  btnAcaoTexto: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 12,
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: { 
    backgroundColor: "#fff", 
    width: "90%", 
    padding: 20, 
    borderRadius: 12 
  },
  modalTitulo: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 12 
  },
  input: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginBottom: 10,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
});