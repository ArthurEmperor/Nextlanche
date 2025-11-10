<<<<<<< HEAD


=======
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SobreScreens() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sobre o App</Text>
      <Text style={styles.text}>
        Este aplicativo foi feito para gerenciar as fichas da cantina.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});
>>>>>>> 34c81b068e748074be80cbad808c41cd7458533e
