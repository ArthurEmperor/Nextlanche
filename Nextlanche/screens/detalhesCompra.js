import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useCart } from './Usercontext';
import { supabase } from '../services/supabase';
import * as Crypto from 'expo-crypto';

export default function DetalhesCompra({ navigation }) {
  const { cart, clearCart } = useCart();
  const total = cart.reduce((sum, item) => sum + item.preco, 0);

  const confirmarPagamento = async () => {
    // Gerar ID único
    const codigo_unico = await Crypto.randomUUID();

    // Criar transação fictícia
    const { data: transacao } = await supabase
      .from('transacoes')
      .insert([
        {
          tipo: 'compra',
          valor: total,
          descricao: `Pedido ${codigo_unico}`,
          aluno_id: 'ALUNO_ID_AQUI', // substitua conforme login
        },
      ])
      .select()
      .single();

    // Registrar compra
    for (const item of cart) {
      await supabase.from('compras').insert([
        {
          transacao_id: transacao.id,
          produto_id: item.id,
          quantidade: 1,
          preco_unitario: item.preco,
          total: item.preco,
        },
      ]);
    }

    clearCart();
    navigation.navigate('Ticket', { codigo_unico });
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Total: R$ {total.toFixed(2)}</Text>
      <TouchableOpacity
        onPress={confirmarPagamento}
        style={{ backgroundColor: '#2196f3', padding: 10, marginTop: 20, borderRadius: 8 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>Confirmar Pagamento (PIX)</Text>
      </TouchableOpacity>
    </View>
  );
}
