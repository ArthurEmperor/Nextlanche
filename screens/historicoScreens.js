import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { supabase } from '../services/supabase';

export default function HistoricoScreen() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    const { data } = await supabase
      .from('transacoes')
      .select('*')
      .eq('tipo', 'compra')
      .eq('aluno_id', 'ALUNO_ID_AQUI')
      .order('created_at', { ascending: false });

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
