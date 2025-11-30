import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { supabase } from "./services/supabase";

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
        name="Cardapio" // interno do stack da cantina
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
      {/* Mantive Config aqui também — é seguro ter em ambos */}
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

      {/* A rota "Cantina" leva ao CantinaStack */}
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

      {/* Coloquei Config também no drawer para todos os usuários */}
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

      {/* ROTA ADMIN: só aparece se isAdmin true */}
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

  useEffect(() => {
    // pega sessão inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) checkAdmin(data.session.user.id);
    });

    // observa mudanças de auth
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });

    // cleanup
    return () => sub.subscription?.unsubscribe?.();
  }, []);

  async function checkAdmin(userId) {
    try {
      const { data } = await supabase
        .from("usuarios")
        .select("tipo")
        .eq("id", userId)
        .single();
      setIsAdmin(data?.tipo === "admin");
    } catch (e) {
      console.log("checkAdmin erro:", e);
      setIsAdmin(false);
    }
  }

  return (
    <CartProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            <Stack.Screen name="Login" component={LoginScreens} />
          ) : (
            <Stack.Screen name="MainApp">
              {() => <DrawerMenu key={isAdmin ? "admin" : "user"} isAdmin={isAdmin} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}