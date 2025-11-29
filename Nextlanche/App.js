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

// Navigators
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

/* Tela da cantina*/
function CantinaStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Cardápio"
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

/*tela do admin*/
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

/* =====================================================
    MENU LATERAL
===================================================== */
function DrawerMenu({ isAdmin }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#2196f3" },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#2196f3",
      }}
    >
      <Drawer.Screen
        name="Início"
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
        name="Histórico"
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
        name="Sobre"
        component={SobreScreens}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome name="info-circle" color={color} size={size} />
          ),
        }}
      />

      {/* APARECE SÓ SE FOR ADMIN */}
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

/* =====================================================
    APP PRINCIPAL
===================================================== */
export default function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);

      if (data.session?.user) checkAdmin(data.session.user.id);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session?.user) checkAdmin(session.user.id);
    });
  }, []);

  async function checkAdmin(userId) {
    const { data } = await supabase
      .from("usuarios")
      .select("tipo")
      .eq("id", userId)
      .single();

    setIsAdmin(data?.tipo === "admin");
  }

  return (
    <CartProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            <Stack.Screen name="Login" component={LoginScreens} />
          ) : (
            <Stack.Screen name="MainApp">
              {() => <DrawerMenu key={isAdmin} isAdmin={isAdmin} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}