import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { supabase } from '../services/supabase';

export default function HistoricoScreens() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.log("Usuário não logado.");
      return;
    }

    const alunoId = userData.user.id;

    const { data, error } = await supabase
      .from("transacoes")
      .select("*")
      .eq("tipo", "compra")
      .eq("aluno_id", alunoId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Erro ao buscar histórico:", error);
      return;
    }

    setPedidos(data);
  };

  return (
    <FlatList
      data={pedidos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ padding: 10, borderBottomWidth: 1 }}>
          <Text>Data: {new Date(item.created_at).toLocaleString()}</Text>
          <Text>Valor: R$ {item.valor.toFixed(2)}</Text>
          <Text>{item.descricao}</Text>
        </View>
      )}
    />
  );
}
