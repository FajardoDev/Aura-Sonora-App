import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import { useNotificationStore } from "@/presentation/radio-podcast/stores/notifications.store";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { Stack, usePathname, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { Platform, Pressable, View } from "react-native";

export default function LibraryLayout() {
  const backgroundColor = useThemeColor({}, "background");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const router = useRouter();
  const pathname = usePathname();

  console.log({ pathname });

  // Función personalizada de navegación atrás
  const handleGoBack = () => {
    // ✅ Si vienes desde un slug, regresa al index
    if (pathname.startsWith("/library/")) {
      router.push("/library");
    } else {
      // Si no, simplemente retrocede
      router.push("/home");
    }

    // if (pathname.startsWith("/podcast/")) {
    //   router.push("/library/notifications");
    // }

    // else {
    //   // Si no, simplemente retrocede
    //   router.push("/library/notifications");
    // }
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        // headerStyle: {backgroundColor: background,},

        headerBackground: () => (
          <PlayerBackground style={{ flex: 1 }} className="shadow-xl" />
        ),
        contentStyle: { backgroundColor },

        headerTitleAlign: "center",
        headerShadowVisible: false, // ocultar la sombra

        // 3️⃣ Título personalizado para poder bajarlo
        headerTitle: ({ children }) => (
          <View style={{ marginBottom: Platform.OS === "ios" ? 40 : 30 }}>
            <ThemedText
              className="shadow-xl"
              style={{
                fontSize: 18,
                fontWeight: "bold",
                letterSpacing: 0.5,
              }}
            >
              {children}
            </ThemedText>
          </View>
        ),

        // 4️⃣ Botón de atrás con margen superior, Botón de atrás optimizado (Mejor área táctil)
        headerLeft: () => (
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => ({
              marginBottom: Platform.OS === "ios" ? 40 : 30,
              marginLeft: 5,
              opacity: pressed ? 0.5 : 1,
            })}
          >
            {/* Círculo sutil detrás de la flecha para look premium */}
            <View
              style={{
                // backgroundColor: "rgba(255,255,255,0.15)",
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(32, 32, 32, 0.15)",
                padding: 6,
                borderRadius: 20,
              }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={isDark ? "white" : "black"}
              />
              {/* color="#f43f5e" /> */}
            </View>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Biblioteca",
          headerShown: false, // puedes mostrarlo si quieres
        }}
      />
      <Stack.Screen
        name="history/index"
        options={{
          title: "Historial",
          headerBackTitle: "Atrás",
        }}
      />

      <Stack.Screen
        name="audiobook/index"
        options={{
          title: "Audio Libros",
          headerBackTitle: "Atrás",
        }}
      />

      <Stack.Screen
        name="notifications/index"
        options={{
          title: "Centro de notificaciones",
          headerBackTitle: "Atrás",
        }}
      />

      <Stack.Screen
        name="modal/index"
        options={{
          title: "Configuraciones / Legal",
          presentation: "modal", // 👈 se abrirá tipo modal
        }}
      />

      <Stack.Screen
        name="modal/faq"
        options={{
          title: "FAQ",
          presentation: "modal", // 👈 Esto hace que sea un modal
        }}
      />
      <Stack.Screen
        name="modal/privacy-policy"
        options={{
          title: "Política de Privacidad",
          presentation: "modal", // 👈 Esto hace que sea un modal
        }}
      />
      <Stack.Screen
        name="modal/contacto"
        options={{
          title: "Contacto",
          presentation: "modal", // 👈 Esto hace que sea un modal
        }}
      />
      <Stack.Screen
        name="modal/sobre-nosotros"
        options={{
          title: "Sobre Nosotros",
          presentation: "modal", // 👈 Esto hace que sea un modal
        }}
      />
      <Stack.Screen
        name="modal/terminos-condiciones"
        options={{
          title: "Términos y Condiciones",
          presentation: "modal", // 👈 Esto hace que sea un modal
        }}
      />
      <Stack.Screen
        name="modal/themes"
        options={{
          title: "Temas",
          presentation: "modal", // 👈 Esto hace que sea un modal
        }}
      />
      <Stack.Screen
        name="modal/descargas"
        options={{
          title: "Descargas",
          presentation: "modal", // 👈 Esto hace que sea un modal
        }}
      />
    </Stack>
  );
}
