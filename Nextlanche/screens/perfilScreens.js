import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PerfilScreens() {
  const [foto, setFoto] = useState(
    "https://cdn-icons-png.flaticon.com/512/847/847969.png"
  );
  const [nome, setNome] = useState("Usuário Exemplo");
  const [email, setEmail] = useState("email@exemplo.com");
  const [nascimento, setNascimento] = useState("");
  const [bio, setBio] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Configurações de pagamento
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("pix");
  const [savedPixKey, setSavedPixKey] = useState("");
  const [savedCardLast4, setSavedCardLast4] = useState("");

  // Carregar configurações salvas
  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  async function carregarConfiguracoes() {
    try {
      const config = await AsyncStorage.getItem("@payment_settings");
      if (config) {
        const parsed = JSON.parse(config);
        setDefaultPaymentMethod(parsed.method || "pix");
        setSavedPixKey(parsed.pixKey || "");
        setSavedCardLast4(parsed.cardLast4 || "");
      }
    } catch (error) {
      console.log("Erro ao carregar configurações:", error);
    }
  }

  async function salvarConfiguracoes() {
    try {
      const config = {
        method: defaultPaymentMethod,
        pixKey: savedPixKey,
        cardLast4: savedCardLast4,
      };
      await AsyncStorage.setItem("@payment_settings", JSON.stringify(config));
      setPayModalVisible(false);
      Alert.alert("Salvo", "Configuração de pagamento salva!");
    } catch (error) {
      console.log("Erro ao salvar configurações:", error);
      Alert.alert("Erro", "Não foi possível salvar as configurações.");
    }
  }

  async function escolherFoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFoto(result.assets[0].uri);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Seu Perfil</Text>

      {/* FOTO DE PERFIL */}
      <TouchableOpacity style={styles.fotoBox} onPress={escolherFoto}>
        <Image source={{ uri: foto }} style={styles.foto} />
        <View style={styles.editarFoto}>
          <FontAwesome name="camera" size={18} color="#000" />
        </View>
      </TouchableOpacity>

      {/* CARD DE INFORMAÇÕES */}
      <View style={styles.card}>
        <View style={styles.linha}>
          <FontAwesome name="user" size={22} color="#ff8c00" />
          <Text style={styles.label}>Nome:</Text>
          <Text style={styles.info}>{nome}</Text>
        </View>

        <View style={styles.linha}>
          <FontAwesome name="envelope" size={22} color="#ff8c00" />
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.info}>{email}</Text>
        </View>

        <View style={styles.linha}>
          <FontAwesome name="calendar" size={22} color="#ff8c00" />
          <Text style={styles.label}>Nascimento:</Text>
          <Text style={styles.info}>
            {nascimento || "Adicionar data..."}
          </Text>
        </View>

        <View style={styles.linha}>
          <FontAwesome name="info-circle" size={22} color="#ff8c00" />
          <Text style={styles.label}>Bio:</Text>
          <Text style={styles.info}>{bio || "Escreva algo sobre você..."}</Text>
        </View>

        {/* CONFIGURAÇÃO DE PAGAMENTO PADRÃO */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>⚡ Pagamento Rápido</Text>
          <Text style={styles.paymentSubtitle}>
            Configure sua forma de pagamento preferida para agilizar suas compras
          </Text>
          
          <View style={styles.paymentInfo}>
            <FontAwesome 
              name={defaultPaymentMethod === "pix" ? "qrcode" : "credit-card"} 
              size={24} 
              color="#ff8c00" 
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {defaultPaymentMethod === "pix" ? "PIX" : "Cartão"}
              </Text>
              <Text style={{ color: "#aaa", fontSize: 12 }}>
                {defaultPaymentMethod === "pix" 
                  ? (savedPixKey || "Clique para adicionar chave PIX")
                  : (savedCardLast4 ? `Cartão salvo (**** ${savedCardLast4})` : "Clique para salvar cartão")
                }
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.configPaymentBtn}
            onPress={() => setPayModalVisible(true)}
          >
            <FontAwesome name="cog" size={16} color="#000" />
            <Text style={styles.configPaymentText}>Configurar Pagamento</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTÃO EDITAR PERFIL */}
      <TouchableOpacity
        style={styles.botaoEditar}
        onPress={() => setModalVisible(true)}
      >
        <FontAwesome name="pencil" size={20} color="#000" />
        <Text style={styles.textoEditar}>Editar Perfil</Text>
      </TouchableOpacity>

      {/* BOTÃO SAIR */}
      <TouchableOpacity style={styles.botaoSair}>
        <FontAwesome name="sign-out" size={20} color="#fff" />
        <Text style={styles.textoSair}>Sair da Conta</Text>
      </TouchableOpacity>

      {/* MODAL DE EDIÇÃO DO PERFIL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Editar Perfil</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor="#777"
              value={nome}
              onChangeText={setNome}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#777"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Data de nascimento (DD/MM/AAAA)"
              placeholderTextColor="#777"
              value={nascimento}
              onChangeText={setNascimento}
            />

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Bio"
              placeholderTextColor="#777"
              value={bio}
              multiline
              onChangeText={setBio}
            />

            <TouchableOpacity
              style={styles.botaoSalvar}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textoSalvar}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoCancelar}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Configurar Pagamento */}
      <Modal animationType="slide" transparent={true} visible={payModalVisible}>
        <View style={styles.modalBg}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitulo}>⚡ Pagamento Rápido</Text>
            <Text style={{ color: "#aaa", marginBottom: 20, textAlign: "center" }}>
              Configure sua forma de pagamento preferida para agilizar compras
            </Text>

            <View style={{ flexDirection: "row", marginBottom: 20 }}>
              <TouchableOpacity 
                onPress={() => setDefaultPaymentMethod("pix")} 
                style={[styles.paymentOption, defaultPaymentMethod === "pix" && styles.paymentOptionActive]}
              >
                <FontAwesome name="qrcode" size={28} color={defaultPaymentMethod === "pix" ? "#fff" : "#ff8c00"} />
                <Text style={[styles.paymentOptionText, defaultPaymentMethod === "pix" && { color: "#fff" }]}>PIX</Text>
                <Text style={[styles.paymentOptionDesc, defaultPaymentMethod === "pix" && { color: "#fff" }]}>
                  Mais rápido
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setDefaultPaymentMethod("card")} 
                style={[styles.paymentOption, defaultPaymentMethod === "card" && styles.paymentOptionActive]}
              >
                <FontAwesome name="credit-card" size={28} color={defaultPaymentMethod === "card" ? "#fff" : "#ff8c00"} />
                <Text style={[styles.paymentOptionText, defaultPaymentMethod === "card" && { color: "#fff" }]}>Cartão</Text>
                <Text style={[styles.paymentOptionDesc, defaultPaymentMethod === "card" && { color: "#fff" }]}>
                  Mais cômodo
                </Text>
              </TouchableOpacity>
            </View>

            {defaultPaymentMethod === "pix" ? (
              <View style={styles.paymentForm}>
                <Text style={styles.formLabel}>Chave PIX (opcional)</Text>
                <Text style={styles.formHint}>
                  Se cadastrar uma chave, ela será sugerida automaticamente
                </Text>
                <TextInput
                  placeholder="exemplo@email.com / 123.456.789-00 / (11) 99999-9999"
                  value={savedPixKey}
                  onChangeText={setSavedPixKey}
                  style={styles.input}
                  placeholderTextColor="#666"
                />
              </View>
            ) : (
              <View style={styles.paymentForm}>
                <Text style={styles.formLabel}>Cartão (fictício)</Text>
                <Text style={styles.formHint}>
                  Últimos 4 dígitos para identificação
                </Text>
                <TextInput
                  placeholder="XXXX"
                  value={savedCardLast4}
                  onChangeText={(text) => setSavedCardLast4(text.replace(/\D/g, '').slice(0, 4))}
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholderTextColor="#666"
                />
              </View>
            )}

            <View style={{ flexDirection: "row", marginTop: 20 }}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setPayModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={salvarConfiguracoes}
              >
                <Text style={styles.saveBtnText}>Salvar Preferência</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: "#111",
    alignItems: "center",
  },
  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#ff8c00",
    marginBottom: 25,
  },
  fotoBox: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  foto: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  editarFoto: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ff8c00",
    padding: 8,
    borderRadius: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  label: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#eee",
    marginLeft: 10,
  },
  info: {
    fontSize: 16,
    color: "#ccc",
    marginLeft: 5,
    flexShrink: 1,
  },
  paymentSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  paymentTitle: {
    color: "#ff8c00",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  paymentSubtitle: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 15,
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  configPaymentBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff8c00",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  configPaymentText: {
    color: "#000",
    fontWeight: "bold",
    marginLeft: 8,
  },
  botaoEditar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff8c00",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
    marginBottom: 15,
  },
  textoEditar: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  botaoSair: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d32f2f",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
  },
  textoSair: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  modalBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 15,
  },
  modalTitulo: {
    color: "#ff8c00",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  paymentOption: {
    flex: 1,
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#222",
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentOptionActive: {
    backgroundColor: "#ff8c00",
    borderColor: "#ff8c00",
  },
  paymentOptionText: {
    color: "#ff8c00",
    fontWeight: "bold",
    marginTop: 5,
    fontSize: 16,
  },
  paymentOptionDesc: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  paymentForm: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
  },
  formLabel: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 5,
  },
  formHint: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveBtn: {
    backgroundColor: "#ff8c00",
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "bold",
  },
  cancelBtn: {
    backgroundColor: "#333",
  },
  cancelBtnText: {
    color: "#fff",
  },
  botaoSalvar: {
    backgroundColor: "#ff8c00",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  textoSalvar: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  botaoCancelar: {
    marginTop: 12,
    alignItems: "center",
  },
  textoCancelar: {
    color: "#ccc",
    fontSize: 16,
  },
});