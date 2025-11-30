import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "../services/supabase";

export default function CantinaScreen() {
  const [saldo, setSaldo] = useState(0);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarQR, setMostrarQR] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCompra, setLoadingCompra] = useState(false);

  async function carregarProdutos() {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("disponivel", true)
      .order("created_at", { ascending: true });
    setRefreshing(false);

    if (error) {
      console.log("Erro ao carregar produtos:", error);
      Alert.alert("Erro", "Não foi possível carregar produtos.");
      return;
    }
    setProdutos(data || []);
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

  function adicionarItem(item) {
    setCarrinho((s) => [...s, item]);
  }

  function removerItemIndex(idx) {
    setCarrinho((s) => s.filter((_, i) => i !== idx));
  }

  function limparCarrinho() {
    setCarrinho([]);
  }

  const total = carrinho.reduce((acc, item) => acc + Number(item.preco || 0), 0);

  async function finalizarCompra() {
    // validações básicas
    if (carrinho.length === 0) {
      Alert.alert("Carrinho vazio", "Adicione itens antes de pagar.");
      return;
    }

    // pega usuário autenticado
    setLoadingCompra(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setLoadingCompra(false);
      Alert.alert("Login necessário", "Você precisa estar logado para finalizar a compra.");
      return;
    }
    const alunoId = userData.user.id;

    // checa saldo local (se você usa saldo local)
    if (Number(saldo) < Number(total)) {
      setLoadingCompra(false);
      Alert.alert("Saldo insuficiente", "Adicione saldo antes de pagar.");
      return;
    }

    // cria transação no banco
    const transacao = {
      aluno_id: alunoId,
      tipo: "compra",
      valor: total,
      descricao: JSON.stringify(
        carrinho.map((p) => ({ id: p.id, nome: p.nome, preco: p.preco }))
      ),
    };

    const { data: insertData, error: insertError } = await supabase
      .from("transacoes")
      .insert([transacao])
      .select()
      .single();

    if (insertError) {
      console.log("Erro ao criar transacao:", insertError);
      setLoadingCompra(false);
      Alert.alert("Erro", "Não foi possível registrar a compra.");
      return;
    }

    // tenta atualizar saldo no usuário (se existir coluna 'saldo' na tabela usuarios)
    try {
      const { data: udata, error: uerr } = await supabase
        .from("usuarios")
        .select("saldo")
        .eq("id", alunoId)
        .single();

      if (!uerr && udata && typeof udata.saldo !== "undefined") {
        const novoSaldo = Number(udata.saldo) - Number(total);
        await supabase.from("usuarios").update({ saldo: novoSaldo }).eq("id", alunoId);
        setSaldo(novoSaldo);
      } else {
        // se tabela/coluna não existir, só atualiza o saldo local
        setSaldo((s) => Number(s) - Number(total));
      }
    } catch (e) {
      // se falhar aqui, mantemos apenas o saldo local atualizado
      setSaldo((s) => Number(s) - Number(total));
    }

    // mostrar QR, limpar carrinho
    setMostrarQR(true);
    setCarrinho([]);
    setLoadingCompra(false);
    Alert.alert("Compra registrada", "Pagamento aprovado e transação gravada.");
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={carregarProdutos} />
        }
      >
        <Text style={styles.titulo}>Cantina</Text>
        <Text style={styles.saldo}>Saldo: R$ {Number(saldo).toFixed(2)}</Text>

        <TouchableOpacity
          style={styles.botaoAdd}
          onPress={async () => {
            // adiciona saldo local e tenta atualizar no banco se possível
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (!userError && userData?.user) {
              const id = userData.user.id;
              // tenta atualizar coluna saldo (se existir)
              try {
                const { data: udata, error: uerr } = await supabase
                  .from("usuarios")
                  .select("saldo")
                  .eq("id", id)
                  .single();

                if (!uerr && udata && typeof udata.saldo !== "undefined") {
                  const novo = Number(udata.saldo) + 5;
                  await supabase.from("usuarios").update({ saldo: novo }).eq("id", id);
                  setSaldo(novo);
                  return;
                }
              } catch (e) {
                // ignore e segue pro local
              }
            }
            setSaldo((s) => Number(s) + 5);
          }}
        >
          <Text style={styles.textoBotaoAdd}>Adicionar R$ 5,00</Text>
        </TouchableOpacity>

        {produtos.length === 0 && (
          <Text style={styles.nenhum}>Nenhum produto disponível no momento.</Text>
        )}

        {produtos.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.prodInfo}>
              {item.imagem_url ? (
                <Image source={{ uri: item.imagem_url }} style={styles.imagem} />
              ) : (
                <View style={styles.semImagem}>
                  <Text style={styles.semImagemTexto}>No Image</Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.nomeProduto}>{item.nome}</Text>
                <Text style={styles.precoProduto}>R$ {Number(item.preco).toFixed(2)}</Text>
                {item.descricao ? <Text style={styles.descricao}>{item.descricao}</Text> : null}
                <Text style={styles.categoria}>{item.categoria ?? "Sem categoria"}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.botaoAddCarrinho, !item.disponivel && styles.botaoDisabled]}
                onPress={() => (item.disponivel ? adicionarItem(item) : null)}
              >
                <Text style={styles.textoAdd}>{item.disponivel ? "Adicionar" : "Indisponível"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.boxCarrinho}>
          <Text style={styles.tituloCarrinho}>Carrinho</Text>

          <ScrollView style={styles.scrollCarrinho}>
            {carrinho.map((item, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={styles.itemCarrinho}>• {item.nome} — R$ {Number(item.preco).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removerItemIndex(i)}><Text style={{ color: "#E53935" }}>x</Text></TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.total}>Total: R$ {Number(total).toFixed(2)}</Text>

          {total > 0 && Number(saldo) >= total && (
            <TouchableOpacity style={styles.botaoPagar} onPress={finalizarCompra} disabled={loadingCompra}>
              <Text style={styles.textoPagar}>{loadingCompra ? "Processando..." : "Pagar"}</Text>
            </TouchableOpacity>
          )}
          {total > Number(saldo) && <Text style={styles.erroSaldo}>Saldo insuficiente!</Text>}
          <TouchableOpacity style={{ marginTop: 10 }} onPress={limparCarrinho}><Text style={{ color: "#666" }}>Limpar carrinho</Text></TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={mostrarQR} transparent animationType="fade">
        <View style={styles.modalFundo}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.botaoFechar} onPress={() => setMostrarQR(false)}>
              <Text style={styles.textoFechar}>X</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>QR Code do Pedido:</Text>
            <QRCode size={220} value={JSON.stringify({ itens: carrinho, total: total, at: Date.now() })} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7931a", padding: 20 },
  titulo: { fontSize: 32, fontWeight: "bold", marginTop: 10 },
  saldo: { fontSize: 20, textAlign: "center", marginVertical: 10, fontWeight: "bold" },
  botaoAdd: { backgroundColor: "#000", padding: 15, borderRadius: 15, alignItems: "center", marginBottom: 20 },
  textoBotaoAdd: { fontSize: 18, color: "#fff" },
  nenhum: { color: "#fff", fontSize: 18, textAlign: "center", marginVertical: 20 },
  card: { backgroundColor: "#fff", padding: 14, marginVertical: 10, borderRadius: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prodInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  imagem: { width: 78, height: 78, borderRadius: 10, backgroundColor: "#eee" },
  semImagem: { width: 78, height: 78, borderRadius: 10, backgroundColor: "#ddd", justifyContent: "center", alignItems: "center" },
  semImagemTexto: { color: "#666" },
  nomeProduto: { fontSize: 18, fontWeight: "bold" },
  precoProduto: { fontSize: 15, color: "#555", marginTop: 4 },
  descricao: { fontSize: 13, color: "#666", marginTop: 6 },
  categoria: { fontSize: 12, color: "#888", marginTop: 6 },
  actions: { marginLeft: 12 },
  botaoAddCarrinho: { backgroundColor: "#000", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  botaoDisabled: { backgroundColor: "#999" },
  textoAdd: { color: "#fff", fontSize: 16 },
  boxCarrinho: { backgroundColor: "#fff", padding: 20, marginTop: 24, borderRadius: 20 },
  tituloCarrinho: { fontSize: 22, fontWeight: "bold" },
  scrollCarrinho: { maxHeight: 200, marginVertical: 10 },
  itemCarrinho: { fontSize: 16, marginBottom: 6 },
  total: { fontSize: 20, fontWeight: "bold", marginTop: 10 },
  botaoPagar: { backgroundColor: "#28a745", padding: 12, marginTop: 12, borderRadius: 10, alignItems: "center" },
  textoPagar: { color: "#fff", fontSize: 16 },
  erroSaldo: { color: "red", marginTop: 10, fontSize: 16, fontWeight: "bold" },
  modalFundo: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", padding: 25, borderRadius: 20, alignItems: "center" },
  modalTitulo: { fontSize: 20, marginBottom: 15 },
  botaoFechar: { position: "absolute", right: 10, top: 10, backgroundColor: "#000", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  textoFechar: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});