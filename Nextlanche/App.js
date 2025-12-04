import React, { useEffect, useState, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { supabase } from "./services/supabase";
import { View, Text } from "react-native";
// Telas
import SobreScreens from "./screens/sobreScreens";
import PerfilScreens from "./screens/perfilScreens";
import HistoricoScreens from "./screens/historicoScreens";
import CantinaScreens from "./screens/cantinaScreens";
import DetalhesCompra from "./screens/detalhesCompra";
import LoginScreens from "./screens/loginScreens";
import HomeScreens from "./screens/homeScreens";
import TicketScreens from "./screens/TicketScreens";
import AdminPanel from "./screens/AdminPanel";

import GerenciarProdutos from "./screens/GerenciarProdutos";
import Pedidos from "./screens/Pedidos";
import Usuarios from "./screens/Usuarios";
import Config from "./screens/Config";

import { CartProvider } from "./screens/Usercontext";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function CantinaStack() {
  return (
    <Stack.Navigator>
      {/* Tela inicial da Cantina */}
      <Stack.Screen
        name="Cardapio"
        component={CantinaScreens}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Carrinho"
        component={DetalhesCompra}
        options={{ title: "Carrinho" }}
      />
      <Stack.Screen
        name="Ticket"
        component={TicketScreens}
        options={{ title: "Ticket Digital" }}
      />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminPanel"
        component={AdminPanel}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GerenciarProdutos"
        component={GerenciarProdutos}
        options={{ title: "Gerenciar Produtos" }}
      />
      <Stack.Screen
        name="Pedidos"
        component={Pedidos}
        options={{ title: "Pedidos" }}
      />
      <Stack.Screen
        name="Usuarios"
        component={Usuarios}
        options={{ title: "Gerenciar Usuários" }}
      />
      <Stack.Screen
        name="Config"
        component={Config}
        options={{ title: "Configurações" }}
      />
    </Stack.Navigator>
  );
}

function DrawerMenu({ isAdmin }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#FF8A00" },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#FF8A00",
        drawerInactiveTintColor: "#333",
        drawerStyle: { backgroundColor: "#fff" },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreens}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome name="home" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Cantina"
        component={CantinaStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome name="cutlery" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Historico"
        component={HistoricoScreens}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome name="list" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Perfil"
        component={PerfilScreens}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Config"
        component={Config}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome name="cog" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Sobre"
        component={SobreScreens}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome name="info-circle" color={color} size={size} />
          ),
        }}
      />

      {isAdmin && (
        <Drawer.Screen
          name="Admin"
          component={AdminStack}
          options={{
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="shield" color={color} size={size} />
            ),
          }}
        />
      )}
    </Drawer.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    // Função para verificar admin
    const checkAdmin = async (userId) => {
      if (!isMounted) return;
      
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("tipo")
          .eq("id", userId)
          .single();
        
        if (isMounted) {
          setIsAdmin(data?.tipo === "admin");
        }
      } catch (e) {
        console.log("checkAdmin erro:", e);
        if (isMounted) {
          setIsAdmin(false);
        }
      }
    };

    // Carregar sessão inicial
    const loadInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (isMounted) {
          if (error) {
            console.log("Erro ao carregar sessão inicial:", error);
          }
          
          setSession(initialSession);
          
          if (initialSession?.user) {
            await checkAdmin(initialSession.user.id);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.log("Erro no loadInitialSession:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log("Auth state changed:", event);
        
        // Atualizar estado da sessão
        setSession(session);
        
        if (session?.user) {
          await checkAdmin(session.user.id);
        } else {
          setIsAdmin(false);
        }
        
        // Não navegar manualmente aqui - o Stack.Navigator faz isso automaticamente
      }
    );

    // Cleanup
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Se estiver carregando, mostrar tela de loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FF8A00" }}>
        <Text style={{ color: "#fff", fontSize: 20 }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <CartProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            animationEnabled: false // Desabilita animações para evitar conflitos
          }}
        >
          {!session ? (
            // Usuário NÃO logado - tela de Login
            <Stack.Screen 
              name="Login" 
              component={LoginScreens}
              options={{
                gestureEnabled: false, // Desabilita gestos para evitar voltar para login
              }}
            />
          ) : (
            // Usuário logado - App principal
            <Stack.Screen 
              name="MainApp" 
              options={{
                gestureEnabled: false, // Desabilita gestos para evitar logout acidental
              }}
            >
              {(props) => <DrawerMenu {...props} key={isAdmin ? "admin" : "user"} isAdmin={isAdmin} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}

