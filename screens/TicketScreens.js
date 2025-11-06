import React from 'react';
import { View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function TicketScreens({ route }) {
  const { codigo_unico } = route.params;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Pedido Confirmado!</Text>
      <QRCode value={codigo_unico} size={200} />
      <Text style={{ marginTop: 10 }}>Mostre o codigo QR na cantina por favor.</Text>
    </View>
  );
}
