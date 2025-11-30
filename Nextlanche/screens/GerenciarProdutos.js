import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { supabase } from "../services/supabase";

export default function GerenciarProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [produtoAtual, setProdutoAtual] = useState({
    id: null,
    nome: "",
    preco: "",
    descricao: "",
    categoria: "",
    imagem_url: "",
    disponivel: true
  });

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setProdutos(data || []);
  }

  useEffect(() => {
    carregarProdutos();
    const channel = supabase
      .channel("public:produtos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "produtos" },
        () => {
          carregarProdutos();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function adicionarProduto() {
    if (!produtoAtual.nome || produtoAtual.preco === "") {
      Alert.alert("Erro", "Preencha nome e preço.");
      return;
    }
    const { error } = await supabase.from("produtos").insert([
      {
        nome: produtoAtual.nome,
        preco: Number(produtoAtual.preco),
        descricao: produtoAtual.descricao || null,
        categoria: produtoAtual.categoria || null,
        imagem_url: produtoAtual.imagem_url || null,
        disponivel: produtoAtual.disponivel
      }
    ]);
    if (error) {
      Alert.alert("Erro ao adicionar", error.message);
      return;
    }
    setModalVisible(false);
    setProdutoAtual({
      id: null,
      nome: "",
      preco: "",
      descricao: "",
      categoria: "",
      imagem_url: "",
      disponivel: true
    });
    carregarProdutos();
  }

  async function atualizarProduto() {
    if (!produtoAtual.nome || produtoAtual.preco === "") {
      Alert.alert("Erro", "Preencha nome e preço.");
      return;
    }
    const { error } = await supabase
      .from("produtos")
      .update({
        nome: produtoAtual.nome,
        preco: Number(produtoAtual.preco),
        descricao: produtoAtual.descricao || null,
        categoria: produtoAtual.categoria || null,
        imagem_url: produtoAtual.imagem_url || null,
        disponivel: produtoAtual.disponivel
      })
      .eq("id", produtoAtual.id);
    if (error) {
      Alert.alert("Erro ao atualizar", error.message);
      return;
    }
    setModalVisible(false);
    setEditando(false);
    setProdutoAtual({
      id: null,
      nome: "",
      preco: "",
      descricao: "",
      categoria: "",
      imagem_url: "",
      disponivel: true
    });
    carregarProdutos();
  }

  async function removerProduto(id) {
    Alert.alert("Confirmar exclusão", "Excluir esse produto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("produtos").delete().eq("id", id);
          if (error) {
            Alert.alert("Erro ao excluir", error.message);
            return;
          }
          carregarProdutos();
        }
      }
    ]);
  }

  function abrirEdicao(produto) {
    setEditando(true);
    setProdutoAtual({
      id: produto.id,
      nome: produto.nome || "",
      preco: produto.preco ? String(produto.preco) : "",
      descricao: produto.descricao || "",
      categoria: produto.categoria || "",
      imagem_url: produto.imagem_url || "",
      disponivel: produto.disponivel ?? true
    });
    setModalVisible(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Gerenciar Produtos</Text>
      <FlatList
        data={produtos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.preco}>R$ {Number(item.preco).toFixed(2)}</Text>
              {item.descricao ? (
                <Text style={styles.descricao}>{item.descricao}</Text>
              ) : null}
              <Text style={styles.categoria}>
                {item.categoria ? item.categoria : "Sem categoria"}
              </Text>
              <Text style={styles.status}>
                {item.disponivel ? "Disponível" : "Indisponível"}
              </Text>
            </View>
            <View style={styles.acoes}>
              <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEdicao(item)}>
                <FontAwesome name="edit" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnExcluir} onPress={() => removerProduto(item.id)}>
                <FontAwesome name="trash" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.botaoAdicionar}
        onPress={() => {
          setEditando(false);
          setProdutoAtual({
            id: null,
            nome: "",
            preco: "",
            descricao: "",
            categoria: "",
            imagem_url: "",
            disponivel: true
          });
          setModalVisible(true);
        }}
      >
        <FontAwesome name="plus" size={28} color="#fff" />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalFundo}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>{editando ? "Editar Produto" : "Novo Produto"}</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do produto"
              value={produtoAtual.nome}
              onChangeText={(txt) => setProdutoAtual({ ...produtoAtual, nome: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Preço (ex: 4.5)"
              keyboardType="numeric"
              value={String(produtoAtual.preco)}
              onChangeText={(txt) => setProdutoAtual({ ...produtoAtual, preco: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Descrição (opcional)"
              value={produtoAtual.descricao}
              onChangeText={(txt) => setProdutoAtual({ ...produtoAtual, descricao: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Categoria (ex: Bebida)"
              value={produtoAtual.categoria}
              onChangeText={(txt) => setProdutoAtual({ ...produtoAtual, categoria: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Imagem URL (opcional)"
              value={produtoAtual.imagem_url}
              onChangeText={(txt) => setProdutoAtual({ ...produtoAtual, imagem_url: txt })}
            />
            <View style={styles.switchRow}>
              <Text style={{ fontSize: 16, marginRight: 10 }}>Disponível</Text>
              <Switch
                value={produtoAtual.disponivel}
                onValueChange={(v) => setProdutoAtual({ ...produtoAtual, disponivel: v })}
              />
            </View>
            <TouchableOpacity
              style={styles.modalBotao}
              onPress={editando ? atualizarProduto : adicionarProduto}
            >
              <Text style={styles.modalBotaoTexto}>{editando ? "Salvar" : "Adicionar"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalFechar} onPress={() => setModalVisible(false)}>
              <Text style={{ color: "red", fontSize: 16 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED", padding: 20 },
  titulo: { fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#000" },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3
  },
  nome: { fontSize: 20, fontWeight: "bold" },
  preco: { fontSize: 16, color: "#444", marginTop: 6 },
  descricao: { fontSize: 14, color: "#666", marginTop: 6 },
  categoria: { fontSize: 13, color: "#888", marginTop: 6 },
  status: { fontSize: 13, color: "#007700", marginTop: 6 },
  acoes: { flexDirection: "row", gap: 10 },
  btnEditar: { backgroundColor: "#4CAF50", padding: 10, borderRadius: 10, marginRight: 8 },
  btnExcluir: { backgroundColor: "#E53935", padding: 10, borderRadius: 10 },
  botaoAdicionar: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#FF8A00",
    width: 65,
    height: 65,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5
  },
  modalFundo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalBox: { backgroundColor: "#fff", width: "90%", padding: 20, borderRadius: 12 },
  modalTitulo: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  input: { backgroundColor: "#F1F1F1", padding: 12, borderRadius: 10, marginBottom: 12 },
  modalBotao: { backgroundColor: "#FF8A00", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalBotaoTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  modalFechar: { marginTop: 12, alignItems: "center" },
  switchRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 }
});