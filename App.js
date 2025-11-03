import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";

import FontAwesome from "react-native-vector-icons/FontAwesome";
import HomeScreens from "./screens/HomeScreens";
import CantinaScreen from "./screens/cantinaScreens";
import DetalhesCompra from "./screens/detalhesCompra";
import TicketScreen from "./screens/TicketScreens";
import HistoricoScreen from "./screens/historicoScreens";
import PerfilScreen from "./screens/perfilScreens";
import SobreScreen from "./screens/sobreScreens";
import { CartProvider } from "./screens/Usercontext";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function CantinaStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Cardápio"
        component={CantinaScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Carrinho"
        component={DetalhesCompra}
        options={{ title: "Carrinho de Compras" }}
      />
      <Stack.Screen
        name="Ticket"
        component={TicketScreen}
        options={{ title: "Seu Ticket Digital" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <CartProvider>
      <NavigationContainer>
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
            component={CantinaScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <FontAwesome name="cutlery" color={color} size={size} />
              ),
            }}
          />

          <Drawer.Screen
            name="Histórico"
            component={HistoricoScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <FontAwesome name="list" color={color} size={size} />
              ),
            }}
          />

          <Drawer.Screen
            name="Perfil"
            component={PerfilScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <FontAwesome name="user" color={color} size={size} />
              ),
            }}
          />

          <Drawer.Screen
            name="Sobre"
            component={SobreScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <FontAwesome name="info-circle" color={color} size={size} />
              ),
            }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}