import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { supabase } from '../services/supabase'

export default function HistoricoScreen() {
  const [historico, setHistorico] = useState([])

  useEffect(() => {
    buscarHistorico()
  }, [])

  async function buscarHistorico() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('compras')
        .select('*')
        .eq('aluno_id', user.id)
        .order('data', { ascending: false })
      setHistorico(data)
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Histórico de Compras:</Text>
      {historico.map((item) => (
        <Text key={item.id}>
          {item.item} - R$ {item.valor} - {new Date(item.data).toLocaleDateString()}
        </Text>
      ))}
    </View>
  )
}