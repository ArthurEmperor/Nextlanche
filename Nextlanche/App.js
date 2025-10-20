import React, { useEffect, useState } from 'react'
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
    <View style={styles.container}>
      <Text>Arthur é gay!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
