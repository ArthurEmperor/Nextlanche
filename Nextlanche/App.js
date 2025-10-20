import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from './services/supabase'
import LoginScreen from './screens/loginScreens'
import HomeScreen from './screens/homeScreens'
import HistoricoScreen from './screens/historicoScreens'
import PerfilScreen from './screens/perfilScreens'
import SobreScreen from './screens/sobreScreens'
import DetalhesCompraScreen from './screens/detalhescompra'



export default function App() {
  // saldo inicial
  const [saldo, setSaldo] = useState(20);

  // lista de comidas
  const [comidas, setComidas] = useState([
    { id: "1", nome: "Coxinha", preco: 5 },
    { id: "2", nome: "Pastel", preco: 7 },
    { id: "3", nome: "Refrigerante", preco: 4 },
    { id: "4", nome: "Brigadeiro", preco: 3 },
  ]);

  // função de compra
  const comprar = (item) => {
    if (saldo >= item.preco) {
      setSaldo(saldo - item.preco);
      alert(`Você comprou ${item.nome}! 🍴`);
    } else {
      alert("Saldo insuficiente 😢");
    }
  };

  // renderização de cada item
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.nome}>{item.nome}</Text>
      <Text style={styles.preco}>R$ {item.preco.toFixed(2)}</Text>
      <TouchableOpacity style={styles.botao} onPress={() => comprar(item)}>
        <Text style={styles.textoBotao}>Comprar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cantina da Escola 🍕</Text>
      <Text style={styles.saldo}>💰 Saldo: R$ {saldo.toFixed(2)}</Text>

      <FlatList
        data={comidas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  saldo: {
    fontSize: 18,
    color: "#2e7d32",
    marginBottom: 20,
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    marginVertical: 8,
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
  },
  nome: {
    fontSize: 18,
    fontWeight: "bold",
  },
  preco: {
    fontSize: 16,
    color: "#555",
  },
  botao: {
    backgroundColor: "#2196f3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
  },
});
