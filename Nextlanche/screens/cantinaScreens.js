import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function CantinaScreen() {
  const [saldo, setSaldo] = useState(100);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarQR, setMostrarQR] = useState(false);

  const produtos = [
    { nome: "Coxinha", preco: 5.0 },
    { nome: "Pastel", preco: 6.5 },
    { nome: "Refrigerante", preco: 4.0 },
    { nome: "Brigadeiro", preco: 3.0 },
  ];

  function adicionarItem(item) {
    setCarrinho([...carrinho, item]);
  }

  function gerarQR() {
    setMostrarQR(true);
  }

  const total = carrinho.reduce((acc, item) => acc + item.preco, 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        
        <Text style={styles.titulo}>Cantina</Text>
        <Text style={styles.saldo}>Saldo: R$ {saldo.toFixed(2)}</Text>

        {/* Adicionar saldo */}
        <TouchableOpacity style={styles.botaoAdd} onPress={() => setSaldo(saldo + 5)}>
          <Text style={styles.textoBotaoAdd}>Adicionar R$ 5,00</Text>
        </TouchableOpacity>

        {/* LISTA DE PRODUTOS */}
        {produtos.map((item, index) => (
          <View key={index} style={styles.card}>
            <View>
              <Text style={styles.nomeProduto}>{item.nome}</Text>
              <Text style={styles.precoProduto}>R$ {item.preco.toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={styles.botaoAddCarrinho} onPress={() => adicionarItem(item)}>
              <Text style={styles.textoAdd}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* CARRINHO */}
        <View style={styles.boxCarrinho}>
          <Text style={styles.tituloCarrinho}>Carrinho</Text>

          <ScrollView style={styles.scrollCarrinho}>
            {carrinho.map((item, i) => (
              <Text key={i} style={styles.itemCarrinho}>• {item.nome} — R$ {item.preco.toFixed(2)}</Text>
            ))}
          </ScrollView>

          <Text style={styles.total}>Total: R$ {total.toFixed(2)}</Text>

          {total > 0 && saldo >= total && (
            <TouchableOpacity style={styles.botaoPagar} onPress={gerarQR}>
              <Text style={styles.textoPagar}>Pagar</Text>
            </TouchableOpacity>
          )}

          {total > saldo && (
            <Text style={styles.erroSaldo}>Saldo insuficiente!</Text>
          )}
        </View>
      </ScrollView>

      {/* MODAL DO QR CODE */}
      <Modal visible={mostrarQR} transparent animationType="fade">
        <View style={styles.modalFundo}>
          <View style={styles.modalBox}>
            
            {/* Botão X */}
            <TouchableOpacity style={styles.botaoFechar} onPress={() => setMostrarQR(false)}>
              <Text style={styles.textoFechar}>X</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitulo}>QR Code do Pedido:</Text>

            <QRCode size={220} value={`Pedido: ${Date.now()}`} />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7931a",
    padding: 20,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 10,
  },
  saldo: {
    fontSize: 20,
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "bold",
  },
  botaoAdd: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  textoBotaoAdd: {
    fontSize: 18,
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    marginVertical: 10,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nomeProduto: {
    fontSize: 20,
    fontWeight: "bold",
  },
  precoProduto: {
    fontSize: 16,
    color: "#555",
  },
  botaoAddCarrinho: {
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  textoAdd: {
    color: "#fff",
    fontSize: 16,
  },
  boxCarrinho: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 30,
    borderRadius: 20,
  },
  tituloCarrinho: {
    fontSize: 26,
    fontWeight: "bold",
  },
  scrollCarrinho: {
    maxHeight: 200, // ← AGORA O CARRINHO ROLA!
    marginVertical: 10,
  },
  itemCarrinho: {
    fontSize: 18,
    marginBottom: 5,
  },
  total: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },
  botaoPagar: {
    backgroundColor: "#28a745",
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  textoPagar: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  erroSaldo: {
    color: "red",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },

  /* MODAL */
  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
  },
  modalTitulo: {
    fontSize: 20,
    marginBottom: 15,
  },
  botaoFechar: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  textoFechar: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});