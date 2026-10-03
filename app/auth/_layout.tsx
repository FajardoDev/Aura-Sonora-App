import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { getAuthReturnRoute } from "@/presentation/auth/hooks/useAuthNavigation";
// import { useAuth, useUser } from "@clerk/clerk-expo";
import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { Stack, usePathname, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { Platform, Pressable, View } from "react-native";

export default function AuthLayout() {
  const router = useRouter();
  const pathname = usePathname();

  // const { status, checkStatus, clearLastRoute, getLastRoute } = useAuthStore();
  const backgroundColor = useThemeColor({}, "background");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Función personalizada de navegación atrás
  const handleGoBack = () => {
    const destination = getAuthReturnRoute(useAuthStore.getState().lastRoute);
    // A private destination would immediately request login again.
    const privateRoute = /^\/(?:favorites|library\/(?:history|notifications))(?:\/|$)/.test(destination);
    void useAuthStore.getState().clearLastRoute();
    // Reuse the existing tabs route, which owns the currently playing audio.
    router.dismissTo((privateRoute ? "/home" : destination) as import("expo-router").Href);
  };

  // console.log(pathname);

  return (
    <Stack
      screenOptions={{
        headerBackground: () => (
          <PlayerBackground style={{ flex: 1 }} className="shadow-xl" />
        ),
        headerShown: true,
        headerShadowVisible: false, // ocultar la sombra
        headerTitleAlign: "center",
        // headerStyle: {backgroundColor: backgroundColor, },
        contentStyle: { backgroundColor },

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
      <Stack.Screen name="login/index" options={{ title: "Iniciar Sesión" }} />
      <Stack.Screen name="register/index" options={{ title: "Registrarse" }} />
    </Stack>
  );
}
