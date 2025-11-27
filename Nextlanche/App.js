import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { supabase } from "./services/supabase";

import SobreScreens from "./screens/sobreScreens";
import PerfilScreens from "./screens/perfilScreens";
import HistoricoScreens from "./screens/historicoScreens";
import CantinaScreens from "./screens/cantinaScreens";
import DetalhesCompra from "./screens/detalhesCompra";
import LoginScreens from "./screens/loginScreens";
import HomeScreens from "./screens/homeScreens";
import TicketScreens from "./screens/TicketScreens";
import AdminPanel from "./screens/AdminPanel";

import { CartProvider } from "./screens/Usercontext";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

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
        options={{ title: "Carrinho de Compras" }}
      />
      <Stack.Screen
        name="Ticket"
        component={TicketScreens}
        options={{ title: "Seu Ticket Digital" }}
      />
    </Stack.Navigator>
  );
}

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

      {/*  Mostra APENAS para administradores */}
      {isAdmin && (
        <Drawer.Screen
          name="AdminPanel"
          component={AdminPanel}
          options={{
            title: "Admin",
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
    console.log("🔵 APP INICIADO");

    supabase.auth.getSession().then(({ data }) => {
      console.log("➡️ getSession USER:", data.session?.user);
      console.log("➡️ getSession USER ID:", data.session?.user?.id);

      setSession(data.session);

      if (data.session?.user) {
        checkAdmin(data.session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔄 onAuthStateChange USER:", session?.user);
      console.log("🔄 onAuthStateChange USER ID:", session?.user?.id);

      setSession(session);

      if (session?.user) {
        checkAdmin(session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    async function testTable() {
      const { data, error } = await supabase.from("usuarios").select("*");

      console.log("🧪 TESTE TABELA usuarios:", data);
      console.log("🧪 ERRO TABELA usuarios:", error);
    }

    testTable();
  }, []);
  

  async function checkAdmin(userId) {
    console.log("🟦 checkAdmin() CHAMADO");
    console.log("🟦 UserId recebido:", userId);

    const { data, error } = await supabase
      .from("usuarios")
      .select("tipo")
      .eq("id", userId)
      .single();

    console.log("🟩 Retorno do banco:", data);
    console.log("🟥 Erro do banco:", error);

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