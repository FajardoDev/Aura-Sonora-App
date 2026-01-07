import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { Stack, usePathname, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { Platform, Pressable, View } from "react-native";

export default function PodcastLayout() {
  const backgroundColor = useThemeColor({}, "background");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const router = useRouter();
  const pathname = usePathname();

  // Función personalizada de navegación atrás
  const handleGoBack = () => {
    // ✅ Si vienes desde un slug, regresa al index
    if (pathname.startsWith("/podcast/")) {
      // router.back();
      router.push("/podcast");
    } else {
      // Si no, simplemente retrocede
      router.push("/home");
    }
  };

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerShadowVisible: false,
        // headerStyle: { backgroundColor },
        headerBackground: () => (
          <PlayerBackground style={{ flex: 1 }} className="shadow-xl" />
        ),
        contentStyle: { backgroundColor },

        // 3️⃣ Título personalizado para poder bajarlo
        headerTitle: ({ children }) => (
          <View style={{ marginBottom: Platform.OS === "ios" ? 40 : 40 }}>
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
              marginBottom: Platform.OS === "ios" ? 40 : 40,
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
      {/* Página principal de podcasts */}
      <Stack.Screen name="index" options={{ title: "Podcasts" }} />

      {/* Detalle de un podcast */}
      <Stack.Screen name="[slug]" options={{ title: "Detalle del Podcast" }} />

      {/* Página de categorías */}
      <Stack.Screen
        name="categoria/[categoria]"
        options={{ title: "Categoría de Podcasts" }}
      />
    </Stack>
  );
}
