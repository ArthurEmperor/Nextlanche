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
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const [modalEscolherProdutoVisible, setModalEscolherProdutoVisible] = useState(false);
  const [meusTickets, setMeusTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketProdutoId, setSelectedTicketProdutoId] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Preferências de pagamento do usuário
  const [userPaymentPref, setUserPaymentPref] = useState({ 
    method: "pix", 
    pixKey: "", 
    cardLast4: "" 
  });

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

  // Carregar preferências de pagamento salvas
  async function carregarPreferenciasPagamento() {
    try {
      const config = await AsyncStorage.getItem("@payment_settings");
      if (config) {
        const parsed = JSON.parse(config);
        setUserPaymentPref({
          method: parsed.method || "pix",
          pixKey: parsed.pixKey || "",
          cardLast4: parsed.cardLast4 || ""
        });
        console.log("Preferências carregadas:", parsed);
      }
    } catch (error) {
      console.log("Erro ao carregar preferências:", error);
    }
  }

  // CARREGAR TICKETS ATIVOS DO USUÁRIO
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

      // BUSCAR tickets onde usado = false (tickets ativos)
      const { data, error } = await supabase
        .from("tickets")
        .select("*, produtos(nome, preco)")
        .eq("usuario_id", usuarioId)
        .eq("usado", false)
        .order("created_at", { ascending: true });

      if (error) {
        console.log("Erro ao carregar tickets:", error);
        setMeusTickets([]);
      } else {
        setMeusTickets(data || []);
      }
    } catch (e) {
      console.log("Erro carregarTicketsAtivos:", e);
      setMeusTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
    carregarSaldo();
    carregarTicketsAtivos();
    carregarPreferenciasPagamento();

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

  // Calcular total COM ticket aplicado
  function calcularTotalComTicket() {
    if (!selectedTicket) return total;
    
    let totalCalculado = total;
    
    // Se ticket tem produto específico
    if (selectedTicket.produto_id) {
      const produtoNoCarrinho = carrinho.find(item => String(item.id) === String(selectedTicket.produto_id));
      if (produtoNoCarrinho) {
        totalCalculado -= Number(produtoNoCarrinho.preco || 0);
      }
    } 
    // Se ticket NÃO tem produto específico mas tem produto selecionado manualmente
    else if (selectedTicketProdutoId) {
      const produtoNoCarrinho = carrinho.find(item => String(item.id) === String(selectedTicketProdutoId));
      if (produtoNoCarrinho) {
        totalCalculado -= Number(produtoNoCarrinho.preco || 0);
      }
    }
    
    return Math.max(0, totalCalculado); // Não pode ser negativo
  }

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

    try {
      for (const item of items) {
        const codigoUnico = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { error: ticketError } = await supabase.from("tickets").insert([
          {
            usuario_id: usuarioId,
            produto_id: item.id,
            transacao_id: insertData.id,
            usado: false,
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

    if (usedTicket && usedTicket.id) {
      try {
        const { error: updErr } = await supabase
          .from("tickets")
          .update({ usado: true, transacao_id: insertData.id })
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
        // Se chegou aqui, ticket não tem produto e usuário não selecionou um
        Alert.alert(
          "Selecionar Produto", 
          "Este ticket não tem um produto específico. Por favor, selecione qual produto do carrinho será gratuito.",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Selecionar Agora", 
              onPress: () => {
                setProcessingPayment(false);
                setPaymentModalVisible(false);
                setModalEscolherProdutoVisible(true);
              }
            }
          ]
        );
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

    if (paymentMethod === "pix") {
      const code = pixCode || `PIX|VAL:${calcularTotalComTicket()}|AT:${Date.now()}`;
      setPixCode(code);
      await new Promise((r) => setTimeout(r, 700));

      const result = await processarCompraComItems(carrinho, null);
      setProcessingPayment(false);
      setPaymentModalVisible(false);

      if (result.success) {
        const qrPayload = { 
          itens: carrinho, 
          total: Number(calcularTotalComTicket()), 
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
          total: Number(calcularTotalComTicket()), 
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
    carregarPreferenciasPagamento(); // Atualizar preferências antes de abrir
    
    // Usar preferência do usuário como padrão
    setPaymentMethod(userPaymentPref.method || "pix");
    
    // Se tiver chave PIX salva, preencher automaticamente
    if (userPaymentPref.method === "pix" && userPaymentPref.pixKey) {
      setPixKey(userPaymentPref.pixKey);
    } else {
      setPixKey(""); // Limpar se não tiver
    }
    
    // Se tiver cartão salvo, mostrar mensagem
    if (userPaymentPref.method === "card" && userPaymentPref.cardLast4) {
      setCardNumber(`**** **** **** ${userPaymentPref.cardLast4}`);
      // Não preenchemos os outros campos por segurança (fictício)
    }
    
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setPixCode("");
    setPaymentModalVisible(true);
  }

  // Selecionar ticket para aplicar
  function aplicarTicketNaCompra(ticket) {
    setSelectedTicket(ticket);
    
    // Se o ticket já tem um produto_id específico, usar ele
    if (ticket.produto_id) {
      setSelectedTicketProdutoId(ticket.produto_id);
      setModalEscolherTicketVisible(false);
      Alert.alert("Ticket selecionado", `Ticket ${ticket.codigo} aplicado ao produto.`);
    } else {
      // Se o ticket NÃO tem produto específico, perguntar se quer selecionar um agora
      Alert.alert(
        "Ticket Genérico", 
        "Este ticket pode ser usado em qualquer produto. Deseja selecionar um produto agora ou mais tarde?",
        [
          { 
            text: "Mais Tarde", 
            onPress: () => {
              setSelectedTicketProdutoId(null);
              setModalEscolherTicketVisible(false);
              Alert.alert("Ticket selecionado", "Você poderá escolher o produto na hora do pagamento.");
            }
          },
          { 
            text: "Selecionar Agora", 
            onPress: () => {
              setModalEscolherTicketVisible(false);
              setModalEscolherProdutoVisible(true);
            }
          }
        ]
      );
    }
  }

  // Selecionar produto para ticket genérico
  function selecionarProdutoParaTicket(produto) {
    setSelectedTicketProdutoId(produto.id);
    setModalEscolherProdutoVisible(false);
    Alert.alert(
      "Produto selecionado", 
      `Ticket será aplicado no produto: ${produto.nome} (R$ ${Number(produto.preco).toFixed(2)})`
    );
  }

  // Função para criar um ticket de teste
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
          produto_id: null, // Ticket genérico, sem produto específico
          created_at: new Date(),
        },
      ])
      .select();

    if (error) {
      Alert.alert("Erro na criação", error.message);
    } else {
      Alert.alert("Sucesso", "Ticket de teste genérico criado!");
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
              await carregarPreferenciasPagamento();
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

        {/* Botão para criar ticket de teste */}
        <TouchableOpacity
          style={[styles.botaoAdd, { backgroundColor: "#FF9800", marginBottom: 10 }]}
          onPress={criarTicketTeste}
        >
          <Text style={styles.textoBotaoAdd}>Criar Ticket Teste Genérico</Text>
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

        {/* Display do ticket selecionado */}
        {selectedTicket && (
          <View style={styles.ticketSelecionadoBox}>
            <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 5 }}>
              🎫 Ticket selecionado:
            </Text>
            <Text style={{ fontSize: 14 }}>{selectedTicket.codigo || selectedTicket.id}</Text>
            
            {selectedTicket.produto_id ? (
              <Text style={{ opacity: 0.7, marginTop: 4 }}>
                Produto específico: {produtos.find(p => String(p.id) === String(selectedTicket.produto_id))?.nome || `ID: ${selectedTicket.produto_id}`}
              </Text>
            ) : selectedTicketProdutoId ? (
              <Text style={{ opacity: 0.7, marginTop: 4 }}>
                Produto escolhido: {produtos.find(p => String(p.id) === String(selectedTicketProdutoId))?.nome || `ID: ${selectedTicketProdutoId}`}
              </Text>
            ) : (
              <View>
                <Text style={{ opacity: 0.7, marginTop: 4 }}>
                  Ticket genérico: escolha um produto
                </Text>
                <TouchableOpacity 
                  onPress={() => setModalEscolherProdutoVisible(true)} 
                  style={{ marginTop: 6 }}
                >
                  <Text style={{ color: "#2196F3", fontWeight: "bold" }}>
                    📝 Selecionar produto agora
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity 
              onPress={() => { 
                setSelectedTicket(null); 
                setSelectedTicketProdutoId(null); 
              }} 
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: "#E53935" }}>❌ Remover ticket</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mostrar economia com ticket */}
        {selectedTicket && carrinho.length > 0 && (
          <View style={styles.economiaBox}>
            <Text style={{ fontWeight: "bold", color: "#4CAF50" }}>
              💰 Economia com ticket: R$ {Number(total - calcularTotalComTicket()).toFixed(2)}
            </Text>
            <Text style={{ fontSize: 12, opacity: 0.7 }}>
              Total com ticket: R$ {calcularTotalComTicket().toFixed(2)}
            </Text>
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
            {carrinho.map((item, i) => {
              // Verificar se este item será gratuito com o ticket
              const seraGratuito = selectedTicket && (
                (selectedTicket.produto_id && String(item.id) === String(selectedTicket.produto_id)) ||
                (selectedTicketProdutoId && String(item.id) === String(selectedTicketProdutoId))
              );
              
              return (
                <View
                  key={i}
                  style={{ 
                    flexDirection: "row", 
                    justifyContent: "space-between", 
                    marginBottom: 6,
                    backgroundColor: seraGratuito ? "#E8F5E9" : "transparent",
                    padding: seraGratuito ? 6 : 0,
                    borderRadius: seraGratuito ? 4 : 0
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemCarrinho, seraGratuito && { color: "#2E7D32" }]}>
                      {seraGratuito ? "🎫 " : "• "}{item.nome} — R$ {Number(item.preco).toFixed(2)}
                      {seraGratuito && " (GRÁTIS com ticket)"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removerItemIndex(i)}>
                    <Text style={{ color: "#E53935" }}>x</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <Text style={styles.total}>
            Total: R$ {Number(total).toFixed(2)}
            {selectedTicket && (
              <Text style={{ fontSize: 14, color: "#4CAF50" }}>
                {" "}(R$ {calcularTotalComTicket().toFixed(2)} com ticket)
              </Text>
            )}
          </Text>

          {total > 0 && Number(saldo) >= calcularTotalComTicket() && (
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
          {total > 0 && Number(saldo) < calcularTotalComTicket() && (
            <Text style={styles.erroSaldo}>Saldo insuficiente!</Text>
          )}
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
                  </View>
                ) : (
                  meusTickets.map((t) => {
                    const produtoNome = t.produto_id ? 
                      (produtos.find(p => String(p.id) === String(t.produto_id))?.nome || `Produto específico: ${t.produto_id}`) 
                      : "Ticket genérico (qualquer produto)";
                    
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={styles.ticketItem}
                        onPress={() => aplicarTicketNaCompra(t)}
                      >
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                          {t.codigo || `Ticket ${t.id.slice(0, 8)}...`}
                        </Text>
                        <Text style={{ marginTop: 4, color: t.produto_id ? "#333" : "#2196F3" }}>
                          {produtoNome}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                          Criado em: {new Date(t.created_at).toLocaleDateString()}
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

      {/* MODAL: escolha de produto para ticket genérico */}
      <Modal visible={modalEscolherProdutoVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>Escolha um produto para o ticket</Text>
            <Text style={{ marginBottom: 15, textAlign: "center", color: "#666" }}>
              Selecione qual produto do carrinho será gratuito:
            </Text>
            
            <ScrollView style={{ maxHeight: 300, width: "100%" }}>
              {carrinho.length === 0 ? (
                <View style={{ padding: 12, alignItems: "center" }}>
                  <Text style={{ fontSize: 16, marginBottom: 10 }}>Carrinho vazio</Text>
                  <Text style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
                    Adicione produtos ao carrinho primeiro.
                  </Text>
                </View>
              ) : (
                carrinho.map((produto, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.produtoItem, selectedTicketProdutoId === produto.id && styles.produtoItemSelecionado]}
                    onPress={() => selecionarProdutoParaTicket(produto)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "bold", fontSize: 16 }}>{produto.nome}</Text>
                      <Text style={{ marginTop: 4, color: "#666" }}>R$ {Number(produto.preco).toFixed(2)}</Text>
                    </View>
                    {selectedTicketProdutoId === produto.id && (
                      <Text style={{ color: "#4CAF50", fontWeight: "bold" }}>✓ Selecionado</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: "#ccc", flex: 1, marginRight: 5 }]} 
                onPress={() => setModalEscolherProdutoVisible(false)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              
              {selectedTicketProdutoId && (
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: "#4CAF50", flex: 1, marginLeft: 5 }]} 
                  onPress={() => {
                    setModalEscolherProdutoVisible(false);
                    Alert.alert("Pronto!", "Produto selecionado para o ticket.");
                  }}
                >
                  <Text style={{ color: "#fff" }}>Confirmar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL PAGAMENTO - ATUALIZADA com preferências */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.paymentModalBg}>
          <View style={styles.paymentModalBox}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
              Escolha a forma de pagamento
            </Text>

            {/* Aviso sobre preferência salva */}
            {userPaymentPref.method && (
              <View style={{ 
                backgroundColor: userPaymentPref.method === "pix" ? "#E8F5E9" : "#E3F2FD", 
                padding: 10, 
                borderRadius: 8, 
                marginBottom: 15,
                flexDirection: "row",
                alignItems: "center"
              }}>
                <Text style={{ 
                  color: userPaymentPref.method === "pix" ? "#2E7D32" : "#1565C0",
                  fontSize: 12,
                  flex: 1
                }}>
                  ⚡ <Text style={{ fontWeight: "bold" }}>Pagamento rápido:</Text> Sua preferência é {
                    userPaymentPref.method === "pix" 
                    ? "PIX" + (userPaymentPref.pixKey ? ` (${userPaymentPref.pixKey})` : "") 
                    : "Cartão" + (userPaymentPref.cardLast4 ? ` (**** ${userPaymentPref.cardLast4})` : "")
                  }
                </Text>
              </View>
            )}

            {/* Aviso sobre ticket genérico sem produto selecionado */}
            {selectedTicket && !selectedTicket.produto_id && !selectedTicketProdutoId && (
              <View style={{ backgroundColor: "#FFF3CD", padding: 10, borderRadius: 8, marginBottom: 15 }}>
                <Text style={{ color: "#856404", textAlign: "center" }}>
                  ⚠️ Você precisa selecionar um produto para o ticket antes de pagar.
                </Text>
                <TouchableOpacity 
                  style={{ marginTop: 8, padding: 8, backgroundColor: "#FFC107", borderRadius: 5 }}
                  onPress={() => {
                    setPaymentModalVisible(false);
                    setModalEscolherProdutoVisible(true);
                  }}
                >
                  <Text style={{ textAlign: "center", fontWeight: "bold" }}>Selecionar Produto Agora</Text>
                </TouchableOpacity>
              </View>
            )}

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
                  placeholder={userPaymentPref.pixKey || "chave@email.com / CPF / Celular"}
                  value={pixKey}
                  onChangeText={setPixKey}
                  style={styles.input}
                  keyboardType="default"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.generatePixBtn]}
                  onPress={() => {
                    const code = `PIX|VAL:${Number(calcularTotalComTicket()).toFixed(2)}|TO:${pixKey || userPaymentPref.pixKey || "LOJA"}|AT:${Date.now()}`;
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
                <TextInput 
                  placeholder="Nome impresso" 
                  value={cardName} 
                  onChangeText={setCardName} 
                  style={styles.input} 
                />
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

            {/* Resumo com ticket */}
            {selectedTicket && (
              <View style={{ backgroundColor: "#E8F5E9", padding: 10, borderRadius: 8, marginTop: 10 }}>
                <Text style={{ fontWeight: "bold", color: "#2E7D32" }}>🎫 Ticket aplicado:</Text>
                <Text style={{ fontSize: 12 }}>{selectedTicket.codigo}</Text>
                <Text style={{ marginTop: 5 }}>
                  Valor original: R$ {Number(total).toFixed(2)}
                </Text>
                <Text style={{ fontWeight: "bold" }}>
                  Valor com ticket: R$ {Number(calcularTotalComTicket()).toFixed(2)}
                </Text>
                <Text style={{ color: "#4CAF50", fontSize: 12, marginTop: 3 }}>
                  Economia: R$ {Number(total - calcularTotalComTicket()).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: "#ccc" }]} 
                onPress={() => setPaymentModalVisible(false)} 
                disabled={processingPayment}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalBtn, { 
                  backgroundColor: selectedTicket && !selectedTicket.produto_id && !selectedTicketProdutoId ? "#FF9800" : "#28a745"
                }]} 
                onPress={handleConfirmPayment} 
                disabled={processingPayment || (selectedTicket && !selectedTicket.produto_id && !selectedTicketProdutoId)}
              >
                {processingPayment ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>
                    {selectedTicket && !selectedTicket.produto_id && !selectedTicketProdutoId 
                      ? "Selecione produto primeiro" 
                      : "Confirmar pagamento"}
                  </Text>
                )}
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
            <QRCode 
              size={220} 
              value={JSON.stringify({ 
                itens: carrinho, 
                total: calcularTotalComTicket(), 
                at: Date.now(),
                ticket: selectedTicket ? true : false
              })} 
            />
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

  ticketSelecionadoBox: {
    marginHorizontal: 8,
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#6C63FF"
  },

  economiaBox: {
    marginHorizontal: 8,
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    alignItems: "center"
  },

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

  // modal produto
  produtoItem: {
    padding: 12,
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center"
  },
  produtoItemSelecionado: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50"
  },
});