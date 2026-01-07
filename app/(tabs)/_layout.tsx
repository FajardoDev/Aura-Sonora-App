/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// import LogoutIconButton from "@/presentation/auth/components/LogoutIconButton";

import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import AudioPlayer from "@/presentation/components/AudioPlayer";
import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import { useDownloadsStore } from "@/presentation/podcast/store/useDownloadsStore";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
// import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons"; //

import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// const isAndroid = Platform.OS === "android"; // Quitar rayita de abajo en android
// import * as NavigationBar from "expo-navigation-bar";
// if (isAndroid) {NavigationBar.setBackgroundColorAsync("black"); }

// useEffect(() => {
// 	if (Platform.OS === "android") {
// 		NavigationBar.setBackgroundColorAsync("black");
// 		NavigationBar.setButtonStyleAsync("light"); // Opcional: iconos claros
// 	}
// }, []);

export default function TabsLayout() {
  const background = useThemeColor({}, "background");
  const terciary = useThemeColor({}, "terciary");

  const insets = useSafeAreaInsets();

  const { isConnected } = useNetworkStatus();

  const { streamUrl } = useAudioPlayerStore();

  // const { isSignedIn } = useAuth();
  // const { user } = useUser();

  const router = useRouter();
  const pathname = usePathname();

  const { status, checkStatus } = useAuthStore();

  useEffect(() => {
    useDownloadsStore.getState().loadDownloads();
  }, []);

  useEffect(() => {
    checkStatus();
  }, []);

  // 👇 esto evita que el redireccionamiento ocurra durante el render
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status]);

  if (status === "unauthenticated") {
    return null; // evita que renderice mientras redirige
  }

  if (status === "cheking") {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ActivityIndicator color="#f43f5e" />
        <ThemedText className="mt-3">Por favor espere... </ThemedText>
      </View>
    );
  }

  // Componente de fondo para el Header
  const PremiumHeaderBg = () => (
    <PlayerBackground
      style={{
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.1)",
      }}
    />
  );

  // Componente de fondo para la TabBar (Efecto Cristal)
  const PremiumTabBackground = () => (
    <View style={{ flex: 1, overflow: "hidden", borderRadius: 15 }}>
      <PlayerBackground style={{ flex: 1, opacity: 0.95 }} />
    </View>
  );

  const screenListeners = {
    tabPress: (e: any) => {
      const targetName = e?.targetName || "";
      const target = e?.target || "";

      if (
        targetName.includes("radio-station") ||
        target.includes("radio-station")
      ) {
        e.preventDefault();
        router.replace("/radio-station");
      } else if (targetName.includes("podcast") || target.includes("podcast")) {
        e.preventDefault();
        router.replace("/podcast");
      }
    },
  };

  return (
    <View className="flex-1 -my-6">
      <Tabs
        detachInactiveScreens={false}
        screenListeners={screenListeners}
        screenOptions={{
          // --- Títulos y Header ---
          headerShown: false,
          // headerTransparent: true,
          headerBackground: PremiumHeaderBg,
          headerTitleAlign: "center",
          // headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 18,
            letterSpacing: 0.5,
          },

          // tabBarHideOnKeyboard: true,

          // --- Estilo de la Tab Bar (Premium Floating) ---
          tabBarActiveTintColor: "#f43f5e", // Rose-500
          tabBarInactiveTintColor: "#9ca3af", // Gray-400
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: 8,
          },
          tabBarStyle: {
            position: "absolute",
            height: 70 + insets.bottom, // Le damos altura real para que el Header no baje
            // bottom: 25, // La eleva del suelo
            bottom: 20, // La eleva del suelo
            // bottom: insets.bottom + 0, // ← CLAVE
            left: 20, // Margen lateral
            right: 20, // Margen lateral
            // height: 68, // Un poco más alta para que respire
            borderRadius: 34,
            // backgroundColor: background,
            borderTopWidth: 0,
            // Sombra para Android/iOS
            elevation: 0, // 15
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 15,
            // zIndex: 1000,
          },
          tabBarBackground: PremiumTabBackground,
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: "Inicio",
            // Título personalizado premium para el Home
            // headerTitle: () => (
            //   <View style={{ alignItems: "center" }}>
            //     <ThemedText
            //       style={{ fontSize: 18, fontWeight: "900", color: "#f43f5e" }}
            //     >
            //       Aura Sonora
            //     </ThemedText>
            //     <ThemedText
            //       style={{
            //         fontSize: 10,
            //         color: "#9ca3af",
            //         textTransform: "uppercase",
            //         letterSpacing: 2,
            //       }}
            //     >
            //       Radios & Podcasts
            //     </ThemedText>
            //   </View>
            // ),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={focused ? 28 : 24}
                name={focused ? "home" : "home-outline"}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="podcast"
          options={{
            title: "Podcast",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={focused ? 30 : 26}
                name={focused ? "mic" : "mic-outline"}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="radio-station"
          options={{
            title: "Estaciones",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={focused ? 30 : 26}
                name={focused ? "radio" : "radio-outline"}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="library"
          options={{
            title: "Biblioteca",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={focused ? 28 : 24}
                name={focused ? "library" : "library-outline"}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="favorites/index"
          options={{
            title: "Favoritos",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={focused ? 28 : 24}
                name={focused ? "heart" : "heart-outline"}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* ✅ Contenedor del AudioPlayer adaptado a la Tab Bar Flotante */}
      <SafeAreaView
        pointerEvents="box-none"
        style={{
          position: "absolute",
          // Calculado: 25 (bottom) + 68 (height) + 12 (espacio) = 105
          bottom: streamUrl ? 88 : -200,
          // bottom: streamUrl ? 67 : 0,
          left: 0,
          right: 0,
          // left: 12,
          // right: 12,
          zIndex: 1000,
        }}
      >
        <View
          style={{
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 20,
          }}
        >
          <AudioPlayer />
        </View>
      </SafeAreaView>

      {/* ✅ El AudioPlayer ahora vive solo, sin wrappers que lo limiten */}

      {/* {streamUrl && <AudioPlayer />} */}
    </View>
  );

  // return (
  //   <View className="flex-1">
  //     <Tabs
  //       screenListeners={
  //         // pathname === "/radio-station" ? screenListeners : screenListener
  //         screenListeners
  //       }
  //       screenOptions={{
  //         // ✅ ESTO LO APLICA A TODAS LAS TABS DE GOLPE
  //         // headerBackground: () => <PlayerBackground style={{ flex: 1 }} />,
  //         // headerTransparent: true, // Para que el contenido se vea bajo la cabecera
  //         // headerTintColor: "#fff", // Color de los botones (flechas, etc) sobre el gradiente
  //         headerTitleStyle: { fontWeight: "bold" },

  //         headerShown: false,
  //         tabBarActiveTintColor: terciary,

  //         tabBarShowLabel: true,
  //         tabBarStyle: {
  //           backgroundColor: background,
  //           borderColor: background,
  //         },

  //         headerStyle: {
  //           backgroundColor: background,
  //           borderColor: background,
  //           // height: 200,
  //         },
  //         headerTitleAlign: "center",
  //         headerShadowVisible: false, // ocultar la sombra
  //       }}
  //     >
  //       {/* <Tabs.Screen
  //         name="home/index"
  //         options={{
  //           title: "Inicio",
  //           headerShown: true, // ⚠️ Cámbialo a true para que se vea el header
  //           headerTitleAlign: "center",
  //           tabBarIcon: ({ color }) => (
  //             <Ionicons size={26} name="home-outline" color={color} />
  //           ),

  //           headerTitle: () => (
  //             <PlayerBackground>
  //               <View className="flex-col items-center">
  //                 <ThemedText
  //                   type="h2"
  //                   className="dark:text-dark-terciary text-light-terciary"
  //                 >
  //                   Aura Sonora
  //                 </ThemedText>
  //                 <ThemedText>Radios Podcasts & Más</ThemedText>
  //               </View>
  //             </PlayerBackground>
  //           ),
  //         }}
  //       /> */}

  //       <Tabs.Screen
  //         name="home/index"
  //         options={{
  //           title: "Inicio",
  //           headerShown: true, // ⚠️ Cámbialo a true para que se vea el header
  //           headerTitleAlign: "center",
  //           tabBarIcon: ({ color }) => (
  //             <Ionicons size={26} name="home-outline" color={color} />
  //           ),
  //         }}
  //       />

  //       <Tabs.Screen
  //         name="podcast"
  //         options={{
  //           title: "Podcast",
  //           tabBarIcon: ({ color }) => (
  //             <Ionicons size={28} name="mic-outline" color={color} />
  //           ),
  //         }}
  //       />

  //       <Tabs.Screen
  //         name="radio-station"
  //         options={{
  //           title: "Radio Station",
  //           tabBarIcon: ({ color }) => (
  //             <Ionicons size={28} name="radio-outline" color={color} />
  //             // <FontAwesome size={28} name="home" color={color} />
  //           ),
  //         }}
  //       />

  //       {/* Pestaña Biblioteca */}
  //       <Tabs.Screen
  //         name="library"
  //         // name="library/index"
  //         options={{
  //           title: "Biblioteca",
  //           tabBarIcon: ({ color }) => (
  //             <Ionicons name="library-outline" size={26} color={color} />
  //           ),
  //         }}
  //       />

  //       <Tabs.Screen
  //         name="favorites/index"
  //         options={{
  //           title: "Favoritos",
  //           tabBarIcon: ({ color }) => (
  //             <Ionicons size={28} name="heart-outline" color={color} />
  //           ),
  //         }}
  //       />
  //     </Tabs>
  //     {/* ✅ Contenedor seguro para el AudioPlayer */}
  //     <SafeAreaView
  //       pointerEvents="box-none" // 🔥 Permite que los tabs sigan funcionando
  //       style={{
  //         position: "absolute",
  //         bottom: streamUrl ? 49 : 0, // justo arriba de la tab bar
  //         left: 0,
  //         right: 0,
  //         zIndex: 999,
  //       }}
  //     >
  //       <AudioPlayer />
  //     </SafeAreaView>
  //   </View>
  // );
}
