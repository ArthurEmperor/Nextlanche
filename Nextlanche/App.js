import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";

import SobreScreens from "./screens/sobreScreens";  
import PerfilScreens from "./screens/perfilScreens"; 
import HistoricoScreens from "./screens/historicoScreens";
import CantinaScreens from "./screens/cantinaScreens";
import DetalhesCompra from "./screens/detalhesCompra";
import LoginScreens from "./screens/loginScreens";   // <-- ADICIONADO

import FontAwesome from "react-native-vector-icons/FontAwesome";
import HomeScreens from "./screens/homeScreens";
import TicketScreens from "./screens/TicketScreens";        
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

function DrawerMenu() {
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
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <CartProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          
          {/* LOGIN PRIMEIRO */}
          <Stack.Screen 
            name="Login" 
            component={LoginScreens} 
          />

          {/* MENU APÓS LOGIN */}
          <Stack.Screen 
            name="MainApp" 
            component={DrawerMenu}
          />
          
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}