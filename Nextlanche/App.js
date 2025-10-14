import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from './services/supabase'

// Telas
import LoginScreen from './screens/loginScreens'
import HomeScreen from './screens/homeScreens'
import HistoricoScreen from './screens/historicoScreens'
import PerfilScreen from './screens/perfilScreens'
import SobreScreen from './screens/sobreScreens'
import DetalhesCompraScreen from './screens/detalhescompra'

const Stack = createNativeStackNavigator()

export default function App() {
  const [session, setSession] = useState(null)

  // Verifica se há sessão ativa
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }

    // Monitora login/logout em tempo real
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    getSession()

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'NextLanche 🍔' }} />
            <Stack.Screen name="Histórico" component={HistoricoScreen} />
            <Stack.Screen name="Perfil" component={PerfilScreen} />
            <Stack.Screen name="Sobre" component={SobreScreen} />
            <Stack.Screen name="DetalhesCompra" component={DetalhesCompraScreen} />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}