// import LogoutIconButton from "@/presentation/auth/components/LogoutIconButton";
import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { Stack, usePathname, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { Platform, Pressable, View } from "react-native";

export default function EmisorasLayout() {
  const backgroundColor = useThemeColor({}, "background");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const router = useRouter();
  const pathname = usePathname();

  // Función personalizada de navegación atrás
  const handleGoBack = () => {
    // ✅ Si vienes desde un slug, regresa al index
    if (pathname.startsWith("/radio-station/")) {
      // router.back();
      router.push("/radio-station");
    } else {
      // Si no, simplemente retrocede
      router.push("/home");
    }
  };

  console.log(pathname);

  return (
    <Stack
      screenOptions={{
        // headerShown: false, // comentar
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerBackground: () => (
          <PlayerBackground style={{ flex: 1 }} className="shadow-xl" />
        ),
        contentStyle: { backgroundColor },
        // headerTransparent: true, // Para que el contenido se vea bajo la cabecera
        // headerTintColor: "#fff", // Color de los botones (flechas, etc) sobre el gradiente
        // headerStyle: { backgroundColor },
        // headerTitleStyle: {color: "#FFFFFF",fontSize: 18,fontWeight: "700",letterSpacing: 0.5, },

        // 3️⃣ Título personalizado para poder bajarlo
        headerTitle: ({ children }) => (
          <View
            style={{
              marginBottom: Platform.OS === "ios" ? 40 : 30,
              // marginTop: Platform.OS === "ios" ? 40 : -60,
            }}
          >
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

        //   headerStyle: {
        //   height: Platform.OS === 'ios' ? 120 : 100,

        // },

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

        // headerLeft: () => (
        //   <Pressable onPress={handleGoBack} style={{ marginLeft: 12 }}>
        //     <Ionicons name="arrow-back-outline" size={24} color="#f43f5e" />
        //   </Pressable>
        // ),
      }}
    >
      <Stack.Screen name="index" options={{ title: "Estaciones de radio" }} />
      <Stack.Screen
        name="[slug]"
        options={{
          title: "Reproduciendo",
          headerBackTitle: "Atrás",
          headerShown: true,
          // headerRight: () => <LogoutIconButton />,
        }}
      />

      {/* Página de categorías */}
      <Stack.Screen
        name="categoria/[categoria]"
        options={{ title: "Categoría de Radios" }}
      />
    </Stack>
  );
}

/*

app/
└── (tabs)/
    └── radio-station/
        ├── index.tsx                   # 📻 Lista general de todas las radios
        ├── [slug].tsx                  # 🔊 Detalle de una radio específica
        └── categoria/
            ├── [categorySlug].tsx      # 🎧 Radios por categoría
            └── index.tsx               # 🔖 Listado de categorías


import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Stack } from "expo-router";
import React from "react";

export default function PodcastDetailLayout() {
	const background = useThemeColor({}, "background");

	return (
		<Stack
			screenOptions={{
				// headerShown: false, // lo cambie
				headerTitleAlign: "center",
				headerShadowVisible: false,
				headerStyle: { backgroundColor: background },
				contentStyle: { backgroundColor: background },
			}}
		>
			
			<Stack.Screen name="index" options={{ title: "Alofoke" }} />

			 /podcast/:slug/episodes 
			 <Stack.Screen name="episodes" options={{ title: "Episodios" }} /> 

			 /podcast/:slug/comments 
			 <Stack.Screen name="comments" options={{ title: "Comentarios" }} /> 
		</Stack>
	);
}

* */
