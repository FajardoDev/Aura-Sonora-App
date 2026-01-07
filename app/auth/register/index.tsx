import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedLink from "@/presentation/theme/components/ThemedLink";
import ThemeTextInput from "@/presentation/theme/components/ThemeTextInput";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

export default function RegisterScreen() {
  const { register } = useAuthStore();

  const { height } = useWindowDimensions();
  const backgroundColor = useThemeColor({}, "background");
  const router = useRouter();

  const [isPosting, setIsPosting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleRegister = async () => {
    const { fullName, email, password } = form;

    console.log({ fullName, email, password });

    if (fullName.length === 0 || email.length === 0 || password.length === 0) {
      return Alert.alert("Error", "Los campos son obligatorios");
    }

    setIsPosting(true);
    const wasSuccessful = await register(fullName, email, password);
    setIsPosting(false);

    if (wasSuccessful) {
      router.replace("/home");
      return;
    }

    Alert.alert("Error", "No se pudo registrar el usuario");
  };

  return (
    <KeyboardAvoidingView
      // behavior="height"
      behavior={Platform.OS === "ios" ? "padding" : "height"} // 'padding' for iOS, 'height' o 'position' para Android
      style={{ flex: 1 }} // Es crucial q KeyboardAvoidingView ocupe todo el espacio
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} //Ajusta este valor según sea necesario
    >
      <ScrollView
        style={{ paddingHorizontal: 40, backgroundColor: backgroundColor }}
      >
        <View style={{ paddingTop: height * 0.2 }}>
          <ThemedText type="h1">Crear cuenta</ThemedText>
          <ThemedText
            className="mb-8 mt-2"
            type="normal"
            // style={{ color: "gray", marginBottom: 14, marginTop: 6 }}
          >
            Por favor crea una cuenta para continuar
          </ThemedText>
        </View>

        {/*fullName Email & Password */}

        <View style={styles.container}>
          <ThemedText type="normal" className="text-[#4B5563] mb-4 mt-5">
            Nombre completo
          </ThemedText>
          <ThemeTextInput
            autoComplete="username"
            autoCapitalize="words"
            // style={styles.input}
            placeholder="Ingrese su nombre completo"
            placeholderTextColor="#9CA3AF" // text-gray-400
            icon="person-outline"
            value={form.fullName}
            onChangeText={(value) => setForm({ ...form, fullName: value })}
          />
          <ThemedText type="normal" className="text-[#4B5563] mb-4 mt-5">
            Correo electrónico
          </ThemedText>
          <ThemeTextInput
            autoComplete="email"
            keyboardType="email-address"
            autoCapitalize="none"
            // style={styles.input}
            placeholder="Ingrese su correo electrónico"
            placeholderTextColor="#9CA3AF" // text-gray-400
            icon="mail-outline"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />

          <ThemedText type="normal" className="text-[#4B5563] mb-4 mt-5">
            Contraseña
          </ThemedText>
          <ThemeTextInput
            secureTextEntry
            autoComplete="off"
            // style={styles.input}
            placeholder="Ingrese su contraseña"
            placeholderTextColor="#9CA3AF" // text-gray-400
            icon="lock-closed-outline"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />
        </View>

        {/* Button */}
        <ThemedButton
          icon="arrow-forward-circle-outline"
          onPress={handleRegister}
          disabled={isPosting}
        >
          Crear cuenta
        </ThemedButton>

        {/* Enlace a registro */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText>¿Ya tienes cuenta?</ThemedText>

          <ThemedLink href="./login" className="mx-2 font-Roboto-SemiBold">
            Ingresar
          </ThemedLink>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: "#4B5563", // text-gray-600
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D1D5DB", // border-gray-300
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
});
