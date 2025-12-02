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

  // Tickets
  const [modalEscolherTicketVisible, setModalEscolherTicketVisible] = useState(false);
  const [meusTickets, setMeusTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketProdutoId, setSelectedTicketProdutoId] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);

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

  // Carregar saldo do usuário
  async function carregarSaldo() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("saldo")
        .eq("id", userData.user.id)
        .single();

      if (usuarioData) {
        setSaldo(Number(usuarioData.saldo) || 0);
      }
    } catch (error) {
      console.log("Erro ao carregar saldo:", error);
    }
  }

  // CARREGAR TICKETS ATIVOS DO USUÁRIO - VERSÃO CORRIGIDA
  async function carregarTicketsAtivos() {
    try {
      setLoadingTickets(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        console.log("Usuário não autenticado");
        setMeusTickets([]);
        setLoadingTickets(false);
        return;
      }
      
      const usuarioId = userData.user.id;
      console.log("Buscando tickets para usuário:", usuarioId);

      // BUSCAR tickets onde usado = false (tickets ativos)
      const { data, error } = await supabase
        .from("tickets")
        .select("*, produtos(nome, preco)")
        .eq("usuario_id", usuarioId)
        .eq("usado", false)  // IMPORTANTE: usado = false significa ticket ATIVO
        .order("created_at", { ascending: true });

      console.log("Resultado da busca de tickets:", {
        quantidade: data?.length || 0,
        error: error?.message,
        usuarioId: usuarioId
      });

      if (error) {
        console.log("Erro detalhado ao carregar tickets:", error);
        Alert.alert(
          "Erro", 
          `Não foi possível carregar tickets: ${error.message}\n\n` +
          "Verifique se as policies estão configuradas."
        );
        setMeusTickets([]);
      } else {
        console.log("Tickets carregados com sucesso:", data?.length || 0);
        setMeusTickets(data || []);
      }
    } catch (e) {
      console.log("Erro em carregarTicketsAtivos:", e);
      setMeusTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
    carregarSaldo();
    carregarTicketsAtivos();

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

    // Canal para tickets também
    const ticketsChannel = supabase
      .channel("public:tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          carregarTicketsAtivos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ticketsChannel);
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
    setSelectedTicket(null);
    setSelectedTicketProdutoId(null);
  }

  const total = carrinho.reduce((acc, item) => acc + Number(item.preco || 0), 0);

  // FUNÇÃO CORRIGIDA para processar compras
  async function processarCompraComItems(items = [], usedTicket = null) {
    setLoadingCompra(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setLoadingCompra(false);
      Alert.alert("Login necessário", "Você precisa estar logado para finalizar a compra.");
      return { success: false, msg: "no-user" };
    }
    const usuarioId = userData.user.id;

    const valorCobrado = items.reduce((acc, it) => acc + Number(it.preco || 0), 0);

    const transacao = {
      aluno_id: usuarioId,
      tipo: "compra",
      valor: valorCobrado,
      descricao: JSON.stringify(
        items.map((p) => ({ id: p.id, nome: p.nome, preco: p.preco }))
      ),
    };

    // Criar transação
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

    // Atualizar saldo
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

    // Criar tickets de pickup para cada item cobrado (usado = false inicialmente)
    try {
      for (const item of items) {
        const codigoUnico = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { error: ticketError } = await supabase.from("tickets").insert([
          {
            usuario_id: usuarioId,
            produto_id: item.id,
            transacao_id: insertData.id,
            usado: false,  // IMPORTANTE: começa como não usado
            codigo: codigoUnico,
          },
        ]);
        if (ticketError) {
          console.log("Erro ao criar ticket para item:", item.id, ticketError);
        }
      }
    } catch (e) {
      console.log("Erro ao criar tickets dos items cobrados:", e);
    }

    // Se um ticket foi usado para dar um item grátis, atualizamos ele para usado = true
    if (usedTicket && usedTicket.id) {
      try {
        const { error: updErr } = await supabase
          .from("tickets")
          .update({ usado: true, transacao_id: insertData.id })  // IMPORTANTE: usado = true
          .eq("id", usedTicket.id);
        if (updErr) console.log("Erro ao marcar ticket usado:", updErr);
      } catch (e) {
        console.log("Erro marcando ticket usado:", e);
      }
    }

    setLoadingCompra(false);
    return { success: true, data: insertData };
  }

  async function handleConfirmPayment() {
    if (processingPayment) return;
    setProcessingPayment(true);

    // Se o usuário selecionou um ticket
    if (selectedTicket) {
      const produtoGratisIndex = carrinho.findIndex((it) => 
        String(it.id) === String(selectedTicket.produto_id)
      );

      const itemsParaCobrar = [...carrinho];
      let freeItem = null;

      if (produtoGratisIndex !== -1) {
        freeItem = itemsParaCobrar.splice(produtoGratisIndex, 1)[0];
      } else if (selectedTicketProdutoId) {
        const idx = itemsParaCobrar.findIndex((it) => 
          String(it.id) === String(selectedTicketProdutoId)
        );
        if (idx === -1) {
          Alert.alert("Erro", "Produto selecionado para o ticket não está no carrinho.");
          setProcessingPayment(false);
          return;
        }
        freeItem = itemsParaCobrar.splice(idx, 1)[0];
      } else {
        Alert.alert("Erro", "Selecione um produto para aplicar o ticket.");
        setProcessingPayment(false);
        return;
      }

      const result = await processarCompraComItems(itemsParaCobrar, selectedTicket);
      setProcessingPayment(false);
      setPaymentModalVisible(false);

      if (result.success) {
        const qrPayload = { 
          itens: [...itemsParaCobrar, { ...freeItem, preco: 0 }], 
          total: itemsParaCobrar.reduce((acc, it) => acc + Number(it.preco || 0), 0), 
          transacao_id: result.data.id, 
          at: Date.now() 
        };
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

    // Pagamento normal (sem ticket)
    if (paymentMethod === "pix") {
      const code = pixCode || `PIX|VAL:${total}|AT:${Date.now()}`;
      setPixCode(code);
      await new Promise((r) => setTimeout(r, 700));

      const result = await processarCompraComItems(carrinho, null);
      setProcessingPayment(false);
      setPaymentModalVisible(false);

      if (result.success) {
        const qrPayload = { 
          itens: carrinho, 
          total: Number(total), 
          transacao_id: result.data.id, 
          at: Date.now() 
        };
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
        const qrPayload = { 
          itens: carrinho, 
          total: Number(total), 
          transacao_id: result.data.id, 
          at: Date.now() 
        };
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
    carregarTicketsAtivos();
    setPaymentMethod("pix");
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setPixCode("");
    setPaymentModalVisible(true);
  }

  // Selecionar ticket para aplicar
  function aplicarTicketNaCompra(ticket) {
    setSelectedTicket(ticket);
    setSelectedTicketProdutoId(ticket.produto_id || null);
    setModalEscolherTicketVisible(false);
    Alert.alert("Ticket selecionado", `Ticket ${ticket.codigo ?? ticket.id} selecionado.`);
  }

  // Função para criar um ticket de teste (DEBUG)
  async function criarTicketTeste() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      Alert.alert("Não logado", "Faça login primeiro");
      return;
    }

    const codigoTeste = `TESTE-${Date.now()}`;
    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          usuario_id: userData.user.id,
          codigo: codigoTeste,
          usado: false,
          produto_id: produtos.length > 0 ? produtos[0].id : null,
          created_at: new Date(),
        },
      ])
      .select();

    if (error) {
      Alert.alert("Erro na criação", error.message);
    } else {
      Alert.alert("Sucesso", "Ticket de teste criado!");
      await carregarTicketsAtivos();
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={async () => { 
              await carregarProdutos(); 
              await carregarTicketsAtivos(); 
              await carregarSaldo();
            }} 
          />
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
                const { data: udata } = await supabase
                  .from("usuarios")
                  .select("saldo")
                  .eq("id", id)
                  .single();

                if (udata && typeof udata.saldo !== "undefined") {
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

        {/* Botão para criar ticket de teste (DEBUG) */}
        <TouchableOpacity
          style={[styles.botaoAdd, { backgroundColor: "#FF9800", marginBottom: 10 }]}
          onPress={criarTicketTeste}
        >
          <Text style={styles.textoBotaoAdd}>Criar Ticket Teste (Debug)</Text>
        </TouchableOpacity>

        {/* Botão para usar ticket */}
        <TouchableOpacity
          style={[styles.botaoAdd, { backgroundColor: "#6C63FF", marginBottom: 16 }]}
          onPress={async () => {
            await carregarTicketsAtivos();
            setModalEscolherTicketVisible(true);
          }}
        >
          <Text style={styles.textoBotaoAdd}>
            {loadingTickets ? "Carregando tickets..." : "Usar Ticket grátis"}
          </Text>
        </TouchableOpacity>

        {selectedTicket && (
          <View style={{ marginHorizontal: 8, marginBottom: 12, padding: 10, backgroundColor: "#fff", borderRadius: 8 }}>
            <Text style={{ fontWeight: "bold" }}>Ticket selecionado:</Text>
            <Text>{selectedTicket.codigo ?? selectedTicket.id}</Text>
            <Text style={{ opacity: 0.7 }}>
              Cobrirá o produto: {selectedTicket.produto_id ? 
                (produtos.find(p => String(p.id) === String(selectedTicket.produto_id))?.nome || `ID: ${selectedTicket.produto_id}`) 
                : "Selecione um produto"}
            </Text>
            <TouchableOpacity onPress={() => { 
              setSelectedTicket(null); 
              setSelectedTicketProdutoId(null); 
            }} style={{ marginTop: 6 }}>
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
            
            {loadingTickets ? (
              <ActivityIndicator size="large" color="#F7931A" style={{ margin: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 300, width: "100%" }}>
                {meusTickets.length === 0 ? (
                  <View style={{ padding: 12, alignItems: "center" }}>
                    <Text style={{ fontSize: 16, marginBottom: 10 }}>Nenhum ticket disponível.</Text>
                    <Text style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
                      Você não possui tickets ativos (usado = false).
                    </Text>
                    <Text style={{ fontSize: 12, color: "#999", marginTop: 10 }}>
                      Use o botão "Criar Ticket Teste" para criar um.
                    </Text>
                  </View>
                ) : (
                  meusTickets.map((t) => {
                    const produtoNome = produtos.find((p) => String(p.id) === String(t.produto_id))?.nome || 
                                      t.produtos?.nome || 
                                      `Produto ID: ${t.produto_id || "-"}`;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={styles.ticketItem}
                        onPress={() => aplicarTicketNaCompra(t)}
                      >
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>{t.codigo || `Ticket ${t.id.slice(0, 8)}...`}</Text>
                        <Text style={{ marginTop: 4 }}>{produtoNome}</Text>
                        <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                          Criado em: {new Date(t.created_at).toLocaleDateString()}
                        </Text>
                        <Text style={{ fontSize: 11, color: t.usado ? "#E53935" : "#4CAF50", marginTop: 2 }}>
                          {t.usado ? "USADO" : "ATIVO"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}

            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setModalEscolherTicketVisible(false)}
            >
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
  modalBox: { 
    backgroundColor: "#fff", 
    padding: 20, 
    borderRadius: 12, 
    width: "90%", 
    maxHeight: "80%",
    alignItems: "center" 
  },
  modalCloseBtn: { 
    marginTop: 15, 
    backgroundColor: "#333", 
    padding: 10, 
    borderRadius: 8, 
    alignItems: "center",
    width: "100%" 
  },
  ticketItem: { 
    padding: 12, 
    width: "100%", 
    borderRadius: 8, 
    backgroundColor: "#f2f2f2", 
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#ddd"
  },
});