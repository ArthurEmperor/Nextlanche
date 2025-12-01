import React, { useState } from "react";
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

export default function PerfilScreens() {
  const [foto, setFoto] = useState(
    "https://cdn-icons-png.flaticon.com/512/847/847969.png"
  );

  const [nome, setNome] = useState("Usuário Exemplo");
  const [email, setEmail] = useState("email@exemplo.com");
  const [nascimento, setNascimento] = useState("");
  const [bio, setBio] = useState("");

  const [modalVisible, setModalVisible] = useState(false);

  // NOVO — forma de pagamento padrão (local)
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("pix"); // "pix" | "card"
  const [savedPixKey, setSavedPixKey] = useState("");
  const [savedCardLast4, setSavedCardLast4] = useState("");

  // Escolher foto
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

  function savePaymentSettings() {
    // atualmente salva só no estado local;
    setPayModalVisible(false);
    Alert.alert("Salvo", "Configuração de pagamento salva localmente.");
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

        {/* NOVO: forma de pagamento padrão */}
        <View style={{ marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#222" }}>
          <Text style={{ color: "#ddd", fontWeight: "bold", marginBottom: 6 }}>Forma de pagamento padrão</Text>
          <Text style={{ color: "#ccc", marginBottom: 8 }}>{defaultPaymentMethod === "pix" ? `PIX — ${savedPixKey || "sem chave"}` : `Cartão — ${savedCardLast4 ? `**** ${savedCardLast4}` : "sem cartão"}`}</Text>
          <TouchableOpacity style={[styles.botaoEditar, { backgroundColor: "#333" }]} onPress={() => setPayModalVisible(true)}>
            <FontAwesome name="credit-card" size={18} color="#000" />
            <Text style={[styles.textoEditar, { color: "#fff", marginLeft: 8 }]}>Editar forma de pagamento</Text>
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

      {/* MODAL: Editar forma de pagamento (local) */}
      <Modal animationType="slide" transparent={true} visible={payModalVisible}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Forma de pagamento</Text>

            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TouchableOpacity onPress={() => setDefaultPaymentMethod("pix")} style={[styles.payChip, defaultPaymentMethod === "pix" && styles.payChipActive]}>
                <Text style={defaultPaymentMethod === "pix" ? { fontWeight: "bold" } : {}}>PIX</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDefaultPaymentMethod("card")} style={[styles.payChip, defaultPaymentMethod === "card" && styles.payChipActive]}>
                <Text style={defaultPaymentMethod === "card" ? { fontWeight: "bold" } : {}}>Cartão</Text>
              </TouchableOpacity>
            </View>

            {defaultPaymentMethod === "pix" ? (
              <>
                <Text style={{ color: "#ccc", marginBottom: 6 }}>Chave PIX (opcional)</Text>
                <TextInput placeholder="chave@example.com / CPF / Celular" value={savedPixKey} onChangeText={setSavedPixKey} style={styles.input} />
              </>
            ) : (
              <>
                <Text style={{ color: "#ccc", marginBottom: 6 }}>Salvar cartão (fictício)</Text>
                <TextInput placeholder="Últimos 4 dígitos" value={savedCardLast4} onChangeText={setSavedCardLast4} style={styles.input} keyboardType="numeric" maxLength={4} />
              </>
            )}

            <TouchableOpacity style={styles.botaoSalvar} onPress={savePaymentSettings}>
              <Text style={styles.textoSalvar}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoCancelar} onPress={() => setPayModalVisible(false)}>
              <Text style={styles.textoCancelar}>Fechar</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  modalContent: {
    width: "90%",
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 12,
  },

  modalTitulo: {
    color: "#ff8c00",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },

  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
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

  payChip: { padding: 10, backgroundColor: "#333", borderRadius: 8, marginRight: 8 },
  payChipActive: { backgroundColor: "#ff8c00" },
});