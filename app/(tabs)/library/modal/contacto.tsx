import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import ThemedText from "@/presentation/theme/components/themed-text";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";

interface Subscription {
  email: string;
  message: string;
  name: string;
}

export default function ModalPantallaContacto() {
  const background = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      Alert.alert(
        "Todos los campos requeridos",
        "Por favor, completa todos los campos."
      );
      return;
    }

    setLoading(true);

    try {
      const resp = radioPodcastApi.post<Subscription>("/subscription", {
        name,
        email,
        message,
      });

      if (!resp) throw new Error("Error enviando formulario");

      Alert.alert("¡Gracias!", "Tu mensaje ha sido enviado.");
      setName("");
      setEmail("");
      setMessage("");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Error al enviar, vuelve a intentar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="px-5 py-8"
      >
        {/* Título */}
        <View className="items-center mb-6">
          <ThemedText className="text-2xl font-bold mb-2 text-center">
            📬 Contáctanos
          </ThemedText>
          <ThemedText className="text-center opacity-80 text-base">
            Estamos aquí para escucharte. Completa el formulario y te
            responderemos lo antes posible.
          </ThemedText>
        </View>

        {/* Campo Nombre */}
        <View className="mb-4">
          <ThemedText className="text-base mb-1 font-semibold">
            Nombre
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre completo"
            placeholderTextColor="#999"
            className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-base text-gray-800"
          />
        </View>

        {/* Campo Email */}
        <View className="mb-4">
          <ThemedText className="text-base mb-1 font-semibold">
            Correo Electrónico
          </ThemedText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tuemail@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
            className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-base text-gray-800"
          />
        </View>

        {/* Campo Mensaje */}
        <View className="mb-6">
          <ThemedText className="text-base mb-1 font-semibold">
            Tu Mensaje
          </ThemedText>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholder="Escribe tu mensaje aquí..."
            placeholderTextColor="#999"
            className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-base text-gray-800"
          />
        </View>

        {/* Botón Enviar */}
        <ThemedButton
          onPress={handleSubmit}
          disabled={loading}
          className="w-full bg-rose-500 py-3 rounded-2xl shadow-md active:opacity-80"
        >
          {loading ? "Enviando..." : "Enviar Mensaje"}
        </ThemedButton>

        {/* Sección de Despedida */}
        <View className="mt-10 items-center">
          <ThemedText className="text-center text-sm opacity-70">
            💡 Soy FajardoDevs, desarrollador freelance de la República
            Dominicana. Me apasiona crear aplicaciones modernas, útiles y
            centradas en el usuario.
          </ThemedText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
