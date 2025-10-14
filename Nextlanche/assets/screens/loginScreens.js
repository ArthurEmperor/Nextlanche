import React, { useState } from 'react'
import { View, TextInput, Button, Text, Alert } from 'react-native'
import { supabase } from '../services/supabase'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })
    if (error) Alert.alert('Erro', error.message)
    else {
      Alert.alert('Login realizado!')
      navigation.navigate('Home')
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Email:</Text>
      <TextInput value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 10 }} />

      <Text>Senha:</Text>
      <TextInput
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        style={{ borderWidth: 1, marginBottom: 20 }}
      />

      <Button title="Entrar" onPress={handleLogin} />
    </View>
  )
}