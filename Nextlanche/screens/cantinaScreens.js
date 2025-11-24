import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function CantinaScreen() {
  const [saldo, setSaldo] = useState(100);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [total, setTotal] = useState(0);
  const [pedidoQRCode, setPedidoQRCode] = useState(null);

  const [comidas] = useState([
    { nome: "Coxinha", preco: 5 },
    { nome: "Pastel", preco: 6.5 },
    { nome: "Refrigerante", preco: 4 },
    { nome: "Brigadeiro", preco: 3 },
    { nome: "Kalzone", preco: 5.5 },
    { nome: "Pizza", preco: 7.5 },
  ]);

  const adicionarAoCarrinho = (item) => {
    setCarrinho([...carrinho, item]);
    setTotal(total + item.preco);
  };

  const simularPagamento = () => {
    alert("Simulando pagamento...");

    setTimeout(() => {
      gerarQRCode();
    }, 1500);
  };

  const gerarQRCode = () => {
    const pedido = {
      itens: carrinho,
      total: total,
      data: new Date().toISOString(),
    };

    const codigo = JSON.stringify(pedido);
    setPedidoQRCode(codigo);
    alert("Pagamento aprovado! QR Code gerado.");
    setCarrinho([]);
    setTotal(0);
    setMostrarCarrinho(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.preco}>R$ {item.preco.toFixed(2)}</Text>
      </View>

      <TouchableOpacity
        style={styles.botao}
        onPress={() => adicionarAoCarrinho(item)}
      >
        <Text style={styles.textoBotao}>Adicionar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cantina</Text>
      <Text style={styles.saldo}>Saldo: R$ {saldo.toFixed(2)}</Text>

      {!mostrarCarrinho && (
        <>
          <FlatList
            data={comidas}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
          />

          <TouchableOpacity
            style={styles.carrinhoBotao}
            onPress={() => setMostrarCarrinho(true)}
          >
            <Text style={styles.carrinhoTexto}>Ver Carrinho ({carrinho.length})</Text>
          </TouchableOpacity>
        </>
      )}

      {mostrarCarrinho && (
        <View style={styles.carrinhoContainer}>
          <Text style={styles.carrinhoTitulo}>Carrinho</Text>

          {carrinho.map((item, index) => (
            <Text key={index} style={styles.carrinhoItem}>
              • {item.nome} — R$ {item.preco.toFixed(2)}
            </Text>
          ))}

          <Text style={styles.total}>Total: R$ {total.toFixed(2)}</Text>

          <TouchableOpacity style={styles.pagarBotao} onPress={simularPagamento}>
            <Text style={styles.pagarTexto}>Pagar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pagarBotao, { backgroundColor: "#999" }]}
            onPress={() => setMostrarCarrinho(false)}
          >
            <Text style={styles.pagarTexto}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )}

      {pedidoQRCode && (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={{ marginBottom: 10, fontSize: 18 }}>QR Code do Pedido:</Text>
          <QRCode value={pedidoQRCode} size={200} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20, backgroundColor: "#fff" },
  titulo: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  saldo: { fontSize: 18, color: "green", textAlign: "center", marginBottom: 15 },
  item: {
    flexDirection: "row", justifyContent: "space-between",
    padding: 15, marginVertical: 8, backgroundColor: "#eee", borderRadius: 8
  },
  nome: { fontSize: 18, fontWeight: "bold" },
  preco: { fontSize: 16 },
  botao: { backgroundColor: "#2196f3", padding: 10, borderRadius: 8 },
  textoBotao: { color: "#fff" },

  carrinhoBotao: {
    backgroundColor: "#ff9800",
    padding: 12, borderRadius: 8, marginTop: 10
  },
  carrinhoTexto: { color: "#fff", textAlign: "center", fontWeight: "bold" },

  carrinhoContainer: { padding: 20, backgroundColor: "#f8f8f8", borderRadius: 10 },
  carrinhoTitulo: { fontSize: 22, fontWeight: "bold" },
  carrinhoItem: { fontSize: 16, marginTop: 5 },
  total: { fontSize: 18, marginTop: 20, fontWeight: "bold" },
  pagarBotao: {
    backgroundColor: "green",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  pagarTexto: { color: "#fff", textAlign: "center", fontSize: 16, fontWeight: "bold" },
});