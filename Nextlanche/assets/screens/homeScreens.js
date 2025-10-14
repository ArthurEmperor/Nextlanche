import React, { useEffect, useState } from 'react'
import { View, Text, Button } from 'react-native'
import { supabase } from '../services/supabase'

export default function HomeScreen() {
  const [aluno, setAluno] = useState(null)
  const [saldo, setSaldo] = useState(0)

  useEffect(() => {
    getAlunoAtual()
  }, [])

  async function getAlunoAtual() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Busca o aluno na tabela
      const { data } = await supabase.from('alunos').select('*').eq('email', user.email).single()
      setAluno(data)
      setSaldo(data?.saldo || 0)
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Bem-vindo, {aluno?.nome}</Text>
      <Text>Saldo atual: R$ {saldo.toFixed(2)}</Text>
      <Button title="Histórico de consumo" onPress={() => { /* navegar */ }} />
    </View>
  )
}