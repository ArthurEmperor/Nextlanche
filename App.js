import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import HomeScreens from "./screens/HomeScreen";
import cantinaScreens from "./screens/cantinaScreens";

const Drawer = createDrawerNavigator();

export default function App() {
  return (
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
          component={cantinaScreens}
          options={{
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="cantina" color={color} size={size} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}