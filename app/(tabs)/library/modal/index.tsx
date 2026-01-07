import ThemedText from "@/presentation/theme/components/themed-text";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useRouter } from "expo-router";
import { View } from "react-native";

export default function ModalIndex() {
  const background = useThemeColor({}, "background");
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        // justifyContent: "center",
        alignItems: "center",
        backgroundColor: background,
        padding: 20,
      }}
    >
      <ThemedText style={{ fontSize: 22, fontWeight: "600", marginBottom: 20 }}>
        ⚙️ Configuraciones / Información Legal
      </ThemedText>

      <ThemedButton
        onPress={() => router.push("/library/modal/terminos-condiciones")}
      >
        Ver Términos y Condiciones
      </ThemedButton>

      <ThemedButton onPress={() => router.push("/library/modal/faq")}>
        Ver FAQ
      </ThemedButton>

      <ThemedButton
        onPress={() => router.push("/library/modal/sobre-nosotros")}
      >
        Ir a Sobre Nosotros
      </ThemedButton>

      <ThemedButton onPress={() => router.push("/library/modal/contacto")}>
        Ir a Contacto
      </ThemedButton>
    </View>
  );
}
