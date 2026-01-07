import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { SplashScreen, useRootNavigationState, useRouter } from "expo-router";
import React, { useEffect } from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";

import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  ThemeProviderCustom,
  // ThemeChangerProvider,
  useTheme,
} from "@/presentation/context/ThemeChangerContext";
import { usePushNotifications } from "@/presentation/hooks/usePushNotifications";
import { LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

LogBox.ignoreAllLogs(false); // 👈 asegúrate de no estar ocultando warnings 🚫 Ignorar warnings de red

// export const unstable_settings = {
//   anchor: "(tabs)",
// };

// Crea un valor de referencia que NO sea reactivo al foco
let STABLE_INSETS = { top: 50, bottom: 20 }; // Valores por defecto por si falla

export default function RootLayout() {
  // usePushNotifications();

  return (
    // 1. Primero el Provider envuelve TODO
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProviderCustom>
          <RootLayoutContent />
        </ThemeProviderCustom>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function RootLayoutContent() {
  // ✅ PRO: Ahora sí, este componente es hijo de QueryClientProvider
  // Los listeners de notificaciones se activarán correctamente
  usePushNotifications();

  const insets = useSafeAreaInsets();
  // const backgroundColor = useThemeColor({}, "background");

  // 2. Ahora SÍ podemos usar el hook porque estamos dentro del Provider
  const { resolvedTheme, bgColor } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const { checkStatus, status } = useAuthStore();
  const router = useRouter();

  const rootNavigationState = useRootNavigationState(); // 💡 Paso CRÍTICO: Obtener el estado de navegación raíz

  const [fontsLoaded, error] = useFonts({
    "Roboto-Thin": require("../assets/fonts/Roboto-Thin.ttf"),
    "Roboto-ExtraLight": require("../assets/fonts/Roboto-ExtraLight.ttf"),
    "Roboto-Light": require("../assets/fonts/Roboto-Light.ttf"),
    "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Medium": require("../assets/fonts/Roboto-Medium.ttf"),
    "Roboto-SemiBold": require("../assets/fonts/Roboto-SemiBold.ttf"),
    "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
    "Roboto-ExtraBold": require("../assets/fonts/Roboto-ExtraBold.ttf"),
    "Roboto-Black": require("../assets/fonts/Roboto-Black.ttf"),
    "Gotu-Regular": require("../assets/fonts/Gotu-Regular.ttf"),
  });

  if (insets.top > 0) STABLE_INSETS.top = insets.top;
  if (insets.bottom > 0) STABLE_INSETS.bottom = insets.bottom;

  // 2. Revisar estado de autenticación (esto está bien)
  useEffect(() => {
    checkStatus();
  }, []);

  // LOGS DE DEPURACIÓN (Míralos en tu terminal)
  console.log({
    fontsLoaded,
    authStatus: status,
    navReady: !!rootNavigationState?.key,
    theme: resolvedTheme,
  });

  // useEffect(() => {
  //   if (error) {
  //     console.error("Error cargando fuentes:", error);
  //     return;
  //   }

  // 2. Control de Ocultación de Splash Screen (La clave del profesionalismo)
  useEffect(() => {
    if (error) throw error;

    // Oculta el Splash Screen SOLO si todo esto ya cargó
    if (rootNavigationState?.key && fontsLoaded && status !== "cheking") {
      SplashScreen.hideAsync();
    }
  }, [rootNavigationState?.key, fontsLoaded, status, error]);

  // 3. Control de Retorno de Carga (Devuelve NULL para mantener el Splash nativo)
  if (!rootNavigationState?.key || !fontsLoaded || status === "cheking") {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: bgColor,
            // paddingTop: Platform.OS === "android" ? 30 : 0, // Un poco más de margen pro
            paddingTop: Platform.OS === "android" ? 23 : 0,
            // flex: 1,
          },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
      </Stack>

      {/* StatusBar dinámico */}
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </GestureHandlerRootView>
  );
}

// export default function RootLayouts() {
//   const insets = useSafeAreaInsets();

//   const backgroundColor = useThemeColor({}, "background");
//   // const { colorScheme } = useColorScheme();
//   // const { currentTheme } = useThemeChangerContext();
//   const { colorScheme } = useColorScheme();
//   const isDarkModes = colorScheme === "dark";

//   const textColorClass = isDarkModes ? "#fff" : "#000";

//   const { resolvedTheme } = useTheme();
//   const isDarkMode = resolvedTheme === "dark";

//   const { checkStatus, status } = useAuthStore();
//   const router = useRouter();

//   const rootNavigationState = useRootNavigationState(); // 💡 Paso CRÍTICO: Obtener el estado de navegación raíz

//   const [fontsLoaded, error] = useFonts({
//     "Roboto-Thin": require("../assets/fonts/Roboto-Thin.ttf"),
//     "Roboto-ExtraLight": require("../assets/fonts/Roboto-ExtraLight.ttf"),
//     "Roboto-Light": require("../assets/fonts/Roboto-Light.ttf"),
//     "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
//     "Roboto-Medium": require("../assets/fonts/Roboto-Medium.ttf"),
//     "Roboto-SemiBold": require("../assets/fonts/Roboto-SemiBold.ttf"),
//     "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
//     "Roboto-ExtraBold": require("../assets/fonts/Roboto-ExtraBold.ttf"),
//     "Roboto-Black": require("../assets/fonts/Roboto-Black.ttf"),
//     "Gotu-Regular": require("../assets/fonts/Gotu-Regular.ttf"),
//   });

//   if (insets.top > 0) STABLE_INSETS.top = insets.top;
//   if (insets.bottom > 0) STABLE_INSETS.bottom = insets.bottom;

//   // 2. Revisar estado de autenticación (esto está bien)
//   useEffect(() => {
//     checkStatus();
//   }, []);

//   // 2. Control de Ocultación de Splash Screen (La clave del profesionalismo)
//   useEffect(() => {
//     if (error) throw error;

//     // Oculta el Splash Screen SOLO si todo esto ya cargó
//     if (rootNavigationState?.key && fontsLoaded && status !== "cheking") {
//       SplashScreen.hideAsync();
//     }
//   }, [rootNavigationState?.key, fontsLoaded, status, error]);

//   // 3. Control de Retorno de Carga (Devuelve NULL para mantener el Splash nativo)
//   if (!rootNavigationState?.key || !fontsLoaded || status === "cheking") {
//     return null;
//   }

//   return (
//     <GestureHandlerRootView
//       style={{ backgroundColor: backgroundColor, flex: 1 }}
//       // className="flex-1 bg-light-background dark:bg-dark-background"
//     >
//       <QueryClientProvider client={queryClient}>
//         <ThemeProviderCustom>
//           <Stack
//             screenOptions={{
//               headerShown: false, // Ocultamos header global

//               contentStyle: {
//                 backgroundColor: backgroundColor,
//                 // height: Platform.OS === "android" ? 200 : 0,
//                 paddingTop: Platform.OS === "android" ? 23 : 0,
//               },
//             }}
//           >
//             <Stack.Screen name="(tabs)" />
//             <Stack.Screen name="auth" />
//           </Stack>

//           {/* <StatusBar style="inverted" /> */}
//           {/* <PlayerBackground></PlayerBackground> */}
//           <StatusBar style={isDarkMode ? "light" : "dark"} />
//           {/* <StatusBar style={"auto"} /> */}
//         </ThemeProviderCustom>
//       </QueryClientProvider>
//     </GestureHandlerRootView>
//   );
// }

//  "react-native-reanimated": "~4.1.1",
//     "react-native-safe-area-context": "~5.6.0",
//  <ThemeProvider
//           value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
//           >
//         </ThemeProvider>
