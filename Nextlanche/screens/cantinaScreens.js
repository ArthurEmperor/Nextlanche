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
  TextInput,
  ActivityIndicator,
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

  // Modal pagamento
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [pixKey, setPixKey] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // --- NOVO: tickets ---
  const [modalTicketVisible, setModalTicketVisible] = useState(false); // modal para gerar ticket grátis
  const [modalEscolherTicketVisible, setModalEscolherTicketVisible] = useState(false); // modal para escolher ticket a aplicar na compra
  const [meusTickets, setMeusTickets] = useState([]); // tickets ativos do usuário
  const [selectedTicket, setSelectedTicket] = useState(null); // ticket selecionado para aplicar na compra
  const [selectedTicketProdutoId, setSelectedTicketProdutoId] = useState(null); // produto que o ticket cobre (padrão vem do ticket.produto_id)

  // Carregar produtos
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

    // também carregar tickets ativos se usuário mudar sessão
    carregarTicketsAtivos();

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
    // ao limpar o carrinho removemos seleção de ticket para prevenir inconsistências
    setSelectedTicket(null);
    setSelectedTicketProdutoId(null);
  }

  const total = carrinho.reduce((acc, item) => acc + Number(item.preco || 0), 0);

  // CARREGAR TICKETS ATIVOS DO USUÁRIO
  async function carregarTicketsAtivos() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setMeusTickets([]);
        return;
      }
      const usuarioId = userData.user.id;

      // tenta buscar por coluna usuario_id ou aluno_id (compatibilidade)
      // Primeiro tenta usar usuario_id
      let res = await supabase
        .from("tickets")
        .select("*")
        .eq("usuario_id", usuarioId)
        .eq("status", "ativo")
        .order("created_at", { ascending: true });

      if (res.error || !res.data || res.data.length === 0) {
        // tenta por aluno_id / ou usado boolean false
        res = await supabase
          .from("tickets")
          .select("*")
          .or(`aluno_id.eq.${usuarioId},usuario_id.eq.${usuarioId}`)
          .in("status", ["ativo"])
          .order("created_at", { ascending: true });
      }

      if (res.error) {
        console.log("Erro ao carregar tickets (fallback):", res.error);
        setMeusTickets([]);
        return;
      }

      setMeusTickets(res.data || []);
    } catch (e) {
      console.log("Erro carregarTicketsAtivos:", e);
      setMeusTickets([]);
    }
  }

  // função reutilizável para criar transação e atualizar saldo e criar tickets para itens passados
  // items = array de produtos que serão cobrados (EXCLUIR aqui o item grátis quando for usar ticket)
  async function processarCompraComItems(items = [], usedTicket = null) {
    setLoadingCompra(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setLoadingCompra(false);
      Alert.alert("Login necessário", "Você precisa estar logado para finalizar a compra.");
      return { success: false, msg: "no-user" };
    }
    const usuarioId = userData.user.id;

    // valor cobrado é soma dos items recebidos (items deve já ter excluído o item que ficou grátis)
    const valorCobrado = items.reduce((acc, it) => acc + Number(it.preco || 0), 0);

    const transacao = {
      aluno_id: usuarioId,
      tipo: "compra",
      valor: valorCobrado,
      descricao: JSON.stringify(
        items.map((p) => ({ id: p.id, nome: p.nome, preco: p.preco }))
      ),
    };

    // criar transacao
    const { data: insertData, error: insertError } = await supabase
      .from("transacoes")
      .insert([transacao])
      .select()
      .single();

    if (insertError || !insertData) {
      console.log("Erro ao criar transacao:", insertError);
      setLoadingCompra(false);
      return { success: false, msg: "insert-fail", error: insertError };
    }

    // atualizar saldo somente se valorCobrado > 0
    if (Number(valorCobrado) > 0) {
      try {
        const { data: udata, error: uerr } = await supabase
          .from("usuarios")
          .select("saldo")
          .eq("id", usuarioId)
          .single();

        if (!uerr && udata && typeof udata.saldo !== "undefined") {
          const novoSaldo = Number(udata.saldo) - Number(valorCobrado);
          await supabase.from("usuarios").update({ saldo: novoSaldo }).eq("id", usuarioId);
          setSaldo(novoSaldo);
        } else {
          setSaldo((s) => Number(s) - Number(valorCobrado));
        }
      } catch (e) {
        setSaldo((s) => Number(s) - Number(valorCobrado));
      }
    }

    // criar tickets de pickup para cada item cobrado (um ticket por item)
    try {
      for (const item of items) {
        const { error: ticketError } = await supabase.from("tickets").insert([
          {
            usuario_id: usuarioId,
            produto_id: item.id,
            transacao_id: insertData.id,
            status: "ativo",
            codigo: `TICKET|TX:${insertData.id}|PROD:${item.id}|AT:${Date.now()}`,
          },
        ]);
        if (ticketError) {
          console.log("Erro ao criar ticket para item:", item.id, ticketError);
        }
      }
    } catch (e) {
      console.log("Erro ao criar tickets dos items cobrados:", e);
    }

    // se um ticket foi usado para dar um item grátis, atualizamos ele para 'usado' e linkamos a transacao
    if (usedTicket && usedTicket.id) {
      try {
        const { error: updErr } = await supabase
          .from("tickets")
          .update({ status: "usado", transacao_id: insertData.id })
          .eq("id", usedTicket.id);
        if (updErr) console.log("Erro ao marcar ticket usado:", updErr);
      } catch (e) {
        console.log("Erro marcando ticket usado:", e);
      }
    }

    setLoadingCompra(false);
    return { success: true, data: insertData };
  }

  // chamada quando usuário confirma pagamento na modal
  async function handleConfirmPayment() {
    if (processingPayment) return;
    setProcessingPayment(true);

    // se o usuário selecionou um ticket para aplicar:
    if (selectedTicket) {
      // verifica se carrinho contém o produto coberto pelo ticket
      const produtoGratisIndex = carrinho.findIndex((it) => String(it.id) === String(selectedTicket.produto_id));
      if (produtoGratisIndex === -1) {
        // se o ticket não tem produto_id associado (por ex, ticket genérico), permitir escolher um produto manualmente:
        // se selectedTicketProdutoId estiver definido, usamos esse.
        if (!selectedTicketProdutoId) {
          Alert.alert("Erro", "Seu ticket não corresponde a nenhum produto no carrinho. Selecione um produto ou remova o ticket.");
          setProcessingPayment(false);
          return;
        }
      }

      // construímos array de items que serão cobrados (excluimos o item gratuito apenas uma vez)
      const itemsParaCobrar = [...carrinho];
      let freeItem = null;

      if (produtoGratisIndex !== -1) {
        // remover o item na posição produtoGratisIndex
        freeItem = itemsParaCobrar.splice(produtoGratisIndex, 1)[0];
      } else if (selectedTicketProdutoId) {
        // procurar pelo id selecionado manualmente
        const idx = itemsParaCobrar.findIndex((it) => String(it.id) === String(selectedTicketProdutoId));
        if (idx === -1) {
          Alert.alert("Erro", "Produto selecionado para o ticket não está no carrinho.");
          setProcessingPayment(false);
          return;
        }
        freeItem = itemsParaCobrar.splice(idx, 1)[0];
      } else {
        Alert.alert("Erro", "Não foi possível aplicar o ticket ao carrinho.");
        setProcessingPayment(false);
        return;
      }

      // PROCESSAR compra com itemsParaCobrar e marcar o ticket como usado
      const result = await processarCompraComItems(itemsParaCobrar, selectedTicket);

      setProcessingPayment(false);
      setPaymentModalVisible(false);

      if (result.success) {
        // gerar QR contendo também info do item grátis
        const qrPayload = { itens: [...itemsParaCobrar, { ...freeItem, preco: 0 }], total: itemsParaCobrar.reduce((acc, it) => acc + Number(it.preco || 0), 0), transacao_id: result.data.id, at: Date.now() };
        setMostrarQR(true);
        setCarrinho([]);
        setSelectedTicket(null);
        setSelectedTicketProdutoId(null);
        Alert.alert("Sucesso", "Compra registrada (ticket aplicado).");
        await carregarTicketsAtivos();
      } else {
        Alert.alert("Erro", "Não foi possível registrar a compra com ticket.");
      }

      return;
    }

    // Caso sem ticket selecionado: pagamento normal (mantive o seu fluxo original)
    if (paymentMethod === "pix") {
      const code = pixCode || `PIX|VAL:${total}|AT:${Date.now()}`;
      setPixCode(code);
      await new Promise((r) => setTimeout(r, 700));

      // processar com todos os items do carrinho
      const result = await processarCompraComItems(carrinho, null);
      setProcessingPayment(false);
      setPaymentModalVisible(false);

      if (result.success) {
        const qrPayload = { itens: carrinho, total: Number(total), transacao_id: result.data.id, at: Date.now() };
        setMostrarQR(true);
        setCarrinho([]);
        Alert.alert("Sucesso", "Pagamento via PIX confirmado e compra registrada.");
        await carregarTicketsAtivos();
      } else {
        Alert.alert("Erro", "Não foi possível registrar a compra.");
      }
      return;
    }

    if (paymentMethod === "card") {
      if (!cardNumber || cardNumber.length < 12 || !cardName || !cardExpiry) {
        setProcessingPayment(false);
        Alert.alert("Dados inválidos", "Preencha os dados do cartão (fictício).");
        return;
      }

      await new Promise((r) => setTimeout(r, 1000));
      const result = await processarCompraComItems(carrinho, null);
      setProcessingPayment(false);
      setPaymentModalVisible(false);

      if (result.success) {
        const qrPayload = { itens: carrinho, total: Number(total), transacao_id: result.data.id, at: Date.now() };
        setMostrarQR(true);
        setCarrinho([]);
        Alert.alert("Sucesso", "Pagamento com cartão (fictício) confirmado e compra registrada.");
        await carregarTicketsAtivos();
      } else {
        Alert.alert("Erro", "Não foi possível registrar a compra.");
      }
      return;
    }

    setProcessingPayment(false);
  }

  function openPaymentModal() {
    if (carrinho.length === 0) {
      Alert.alert("Carrinho vazio", "Adicione itens antes de pagar.");
      return;
    }
    // carregar tickets atuais para possibilitar aplicar na compra
    carregarTicketsAtivos();
    setPaymentMethod("pix");
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setPixCode("");
    setPaymentModalVisible(true);
  }

  // --------- Gerar ticket grátis (insere um ticket ativo para o usuário) ----------
  async function gerarTicketGratis(produto) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        Alert.alert("Login necessário", "Faça login para receber um ticket grátis.");
        return;
      }
      const usuarioId = userData.user.id;

      // gera código único simples
      const codigo = `FREE|${usuarioId.slice(0,6)}|PROD:${produto.id}|AT:${Date.now()}`;

      const { data, error } = await supabase.from("tickets").insert([
        {
          usuario_id: usuarioId,        // coluna esperada conforme seu esquema
          produto_id: produto.id,
          codigo,
          status: "ativo",
          created_at: new Date(),
        },
      ]);

      if (error) {
        console.log("Erro insert tickets:", error);
        Alert.alert("Erro", "Falha ao gerar ticket gratuito. Verifique policies no Supabase.");
        return;
      }

      setModalTicketVisible(false);
      Alert.alert("Ticket criado!", `Você ganhou 1 ticket de ${produto.nome}.`);
      await carregarTicketsAtivos();
    } catch (e) {
      console.log("Erro gerarTicketGratis:", e);
      Alert.alert("Erro", "Falha ao gerar ticket grátis.");
    }
  }

  // ---------- Selecionar ticket para aplicar ----------
  function aplicarTicketNaCompra(ticket) {
    // ticket pode ter produto_id ou não; aqui definimos o produto alvo
    setSelectedTicket(ticket);
    setSelectedTicketProdutoId(ticket.produto_id || null);
    setModalEscolherTicketVisible(false);
    Alert.alert("Ticket selecionado", `Ticket ${ticket.codigo ?? ticket.id} selecionado.`);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { await carregarProdutos(); await carregarTicketsAtivos(); }} />
        }
      >
        <Text style={styles.titulo}>Cantina</Text>
        <Text style={styles.saldo}>Saldo: R$ {Number(saldo).toFixed(2)}</Text>

        <TouchableOpacity
          style={styles.botaoAdd}
          onPress={async () => {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (!userError && userData?.user) {
              const id = userData.user.id;
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
              } catch (e) {}
            }
            setSaldo((s) => Number(s) + 5);
          }}
        >
          <Text style={styles.textoBotaoAdd}>Adicionar R$ 5,00</Text>
        </TouchableOpacity>

        {/* NOVO: botão para escolher/usar ticket na compra */}
        <TouchableOpacity
          style={[styles.botaoAdd, { backgroundColor: "#6C63FF", marginBottom: 16 }]}
          onPress={async () => {
            await carregarTicketsAtivos();
            setModalEscolherTicketVisible(true);
          }}
        >
          <Text style={styles.textoBotaoAdd}>Usar Ticket grátis (escolher)</Text>
        </TouchableOpacity>

        {selectedTicket && (
          <View style={{ marginHorizontal: 8, marginBottom: 12, padding: 10, backgroundColor: "#fff", borderRadius: 8 }}>
            <Text style={{ fontWeight: "bold" }}>Ticket selecionado:</Text>
            <Text>{selectedTicket.codigo ?? selectedTicket.id}</Text>
            <Text style={{ opacity: 0.7 }}>Cobrirá o produto ID: {selectedTicket.produto_id ?? selectedTicketProdutoId ?? "qualquer (escolha manual)"}</Text>
            <TouchableOpacity onPress={() => { setSelectedTicket(null); setSelectedTicketProdutoId(null); }} style={{ marginTop: 6 }}>
              <Text style={{ color: "#E53935" }}>Remover ticket</Text>
            </TouchableOpacity>
          </View>
        )}

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
              <View
                key={i}
                style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}
              >
                <Text style={styles.itemCarrinho}>
                  • {item.nome} — R$ {Number(item.preco).toFixed(2)}
                </Text>
                <TouchableOpacity onPress={() => removerItemIndex(i)}>
                  <Text style={{ color: "#E53935" }}>x</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.total}>Total: R$ {Number(total).toFixed(2)}</Text>

          {total > 0 && Number(saldo) >= total && (
            <TouchableOpacity
              style={styles.botaoPagar}
              onPress={openPaymentModal}
              disabled={loadingCompra}
            >
              <Text style={styles.textoPagar}>
                {loadingCompra ? "Processando..." : "Pagar"}
              </Text>
            </TouchableOpacity>
          )}
          {total > Number(saldo) && <Text style={styles.erroSaldo}>Saldo insuficiente!</Text>}
          <TouchableOpacity style={{ marginTop: 10 }} onPress={limparCarrinho}>
            <Text style={{ color: "#666" }}>Limpar carrinho</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL: escolha de ticket para aplicar */}
      <Modal visible={modalEscolherTicketVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>Escolha um ticket para aplicar</Text>
            <ScrollView style={{ maxHeight: 300, width: "100%" }}>
              {meusTickets.length === 0 ? (
                <Text style={{ padding: 12 }}>Nenhum ticket disponível.</Text>
              ) : (
                meusTickets.map((t) => {
                  // tenta buscar nome do produto para legibilidade
                  const produto = produtos.find((p) => String(p.id) === String(t.produto_id));
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.ticketItem}
                      onPress={() => aplicarTicketNaCompra(t)}
                    >
                      <Text style={{ fontWeight: "bold" }}>{t.codigo ?? t.id}</Text>
                      <Text style={{ opacity: 0.7 }}>{produto ? produto.nome : `Produto ID: ${t.produto_id ?? "-"}`}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalEscolherTicketVisible(false)}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PAGAMENTO */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.paymentModalBg}>
          <View style={styles.paymentModalBox}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
              Escolha a forma de pagamento
            </Text>

            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.payOption, paymentMethod === "pix" && styles.payOptionActive]}
                onPress={() => setPaymentMethod("pix")}
              >
                <Text style={paymentMethod === "pix" ? styles.payOptionTextActive : styles.payOptionText}>
                  PIX (Copia & Cola)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payOption, paymentMethod === "card" && styles.payOptionActive]}
                onPress={() => setPaymentMethod("card")}
              >
                <Text style={paymentMethod === "card" ? styles.payOptionTextActive : styles.payOptionText}>
                  Cartão (fictício)
                </Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === "pix" && (
              <>
                <Text style={{ marginBottom: 6 }}>Chave PIX (opcional):</Text>
                <TextInput
                  placeholder="chave@email.com / CPF / Celular"
                  value={pixKey}
                  onChangeText={setPixKey}
                  style={styles.input}
                />
                <TouchableOpacity
                  style={[styles.generatePixBtn]}
                  onPress={() => {
                    const code = `PIX|VAL:${Number(total).toFixed(2)}|TO:${pixKey || "LOJA"}|AT:${Date.now()}`;
                    setPixCode(code);
                    Alert.alert("PIX gerado", "Código PIX gerado para copiar.");
                  }}
                >
                  <Text style={{ color: "#fff" }}>Gerar código PIX</Text>
                </TouchableOpacity>

                {pixCode ? (
                  <>
                    <Text style={{ marginTop: 10, marginBottom: 6 }}>Código PIX (copiar):</Text>
                    <View style={{ backgroundColor: "#f1f1f1", padding: 10, borderRadius: 8 }}>
                      <Text selectable>{pixCode}</Text>
                    </View>
                  </>
                ) : null}
              </>
            )}

            {paymentMethod === "card" && (
              <>
                <TextInput
                  placeholder="Número do cartão (fictício)"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  style={styles.input}
                  keyboardType="numeric"
                />
                <TextInput placeholder="Nome impresso" value={cardName} onChangeText={setCardName} style={styles.input} />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TextInput
                    placeholder="CVV"
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    style={[styles.input, { width: 80 }]}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#ccc" }]} onPress={() => setPaymentModalVisible(false)} disabled={processingPayment}>
                <Text>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#28a745" }]} onPress={handleConfirmPayment} disabled={processingPayment}>
                {processingPayment ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff" }}>Confirmar pagamento</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: QR */}
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
  botaoAddCarrinho: { 
    backgroundColor: "#000", 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  botaoDisabled: { backgroundColor: "#888" },
  textoAdd: { color: "#fff", fontWeight: "bold" },

  boxCarrinho: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginTop: 20 },
  tituloCarrinho: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  scrollCarrinho: { maxHeight: 150, marginBottom: 10 },
  itemCarrinho: { fontSize: 16 },

  total: { fontSize: 18, fontWeight: "bold", textAlign: "right", marginVertical: 8 },
  botaoPagar: { backgroundColor: "#28a745", padding: 12, borderRadius: 8, alignItems: "center" },
  textoPagar: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  erroSaldo: { color: "#E53935", marginTop: 8, fontWeight: "bold" },

  paymentModalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  paymentModalBox: { backgroundColor: "#fff", padding: 20, borderRadius: 12, width: "90%" },
  payOption: { flex: 1, padding: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, alignItems: "center", marginRight: 5 },
  payOptionActive: { borderColor: "#28a745", backgroundColor: "#e6f4ea" },
  payOptionText: { color: "#555" },
  payOptionTextActive: { color: "#28a745", fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 10 },
  generatePixBtn: { backgroundColor: "#000", padding: 10, borderRadius: 8, alignItems: "center" },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, justifyContent: "center", alignItems: "center" },

  modalFundo: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", padding: 20, borderRadius: 12, alignItems: "center" },
  botaoFechar: { position: "absolute", top: 10, right: 10, padding: 8 },
  textoFechar: { fontWeight: "bold", fontSize: 16 },
  modalTitulo: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  // modal ticket
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalCloseBtn: { marginTop: 15, backgroundColor: "#333", padding: 10, borderRadius: 8, alignItems: "center" },
  ticketItem: { padding: 12, width: "100%", borderRadius: 8, backgroundColor: "#f2f2f2", marginVertical: 6 },

});
