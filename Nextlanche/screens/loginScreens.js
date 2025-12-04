import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  ActivityIndicator 
} from "react-native";
import { supabase } from "../services/supabase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha email e senha");
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Erro ao fazer login", error.message);
      return;
    }

    // NÃO navega manualmente - o App.js já vai detectar a mudança de sessão
    // O navigation.replace acontece automaticamente no App.js
    console.log("Login realizado com sucesso");
    
    // Limpar campos
    setEmail("");
    setSenha("");
  };

  const registrar = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha email e senha");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: senha,
      options: {
        emailRedirectTo: "nextlanche://login", // URL de redirecionamento (para deep linking)
        data: {
          nome: email.split('@')[0], // Nome padrão do email
        }
      }
    });

    setLoading(false);

    if (error) {
      Alert.alert("Erro ao registrar", error.message);
      return;
    }

    if (data?.user?.identities?.length === 0) {
      Alert.alert("Aviso", "Este email já está registrado. Tente fazer login.");
      return;
    }

    Alert.alert(
      "Conta criada!", 
      "Verifique seu email para confirmar o cadastro. Você já pode fazer login.",
      [
        { 
          text: "OK", 
          onPress: () => {
            // Limpar campos após registro
            setEmail("");
            setSenha("");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Next Lanche</Text>
      <Text style={styles.subtitulo}>Faça login para continuar</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#999"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        editable={!loading}
      />

      <TouchableOpacity 
        style={[styles.botao, loading && styles.botaoDisabled]} 
        onPress={login}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.textoBotao}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.botaoSecundario, loading && styles.botaoDisabled]} 
        onPress={registrar}
        disabled={loading}
      >
        <Text style={styles.textoBotao}>Criar Conta</Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        Ao criar uma conta, você concorda com nossos Termos de Serviço
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  titulo: { 
    fontSize: 32, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 10,
    color: "#FF8A00",
  },
  subtitulo: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
    elevation: 1,
  },
  botao: {
    backgroundColor: "#FF8A00",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  botaoSecundario: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  botaoDisabled: {
    opacity: 0.7,
  },
  textoBotao: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  info: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginTop: 20,
    paddingHorizontal: 20,
  },
});