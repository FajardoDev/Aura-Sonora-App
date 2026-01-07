import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemeOptionCard } from "@/presentation/theme/components/ThemeOptionCard"; // Importa el nuevo componente
import React from "react";
import { View } from "react-native";

export default function ThemesScreen() {
  // ¡Ya no necesitamos traer nada del hook aquí!
  // Las tarjetas se encargan de todo internamente.

  return (
    <ThemedView className="flex-1 p-6">
      <View className="mb-8">
        <ThemedText type="h2" className="font-bold text-2xl mb-2">
          Apariencia
        </ThemedText>
        <ThemedText className="text-gray-500 dark:text-gray-400">
          Elige cómo se ve la aplicación. El modo sistema se adaptará a la
          configuración de tu dispositivo.
        </ThemedText>
      </View>

      {/* Contenedor de las 3 tarjetas */}
      <View className="flex-row justify-between gap-2">
        <ThemeOptionCard mode="light" label="Claro" iconName="sunny-outline" />

        <ThemeOptionCard mode="dark" label="Oscuro" iconName="moon-outline" />

        <ThemeOptionCard
          mode="system"
          label="Sistema"
          iconName="phone-portrait-outline"
        />
      </View>
    </ThemedView>
  );
}

// import { useThemeChangerContext } from "@/presentation/context/ThemeChangerContext";
// import { ThemedView } from "@/presentation/theme/components/themed-view";
// import { ThemedCard } from "@/presentation/theme/components/ThemedCard";
// import { ThemedSwitch } from "@/presentation/theme/components/ThemedSwitch";
// import { useState } from "react";

// export default function ThemesScreen() {
//   const { currentTheme, setSystemTheme, toggleTheme, isSystemTheme } =
//     useThemeChangerContext();

//   const [darkModeSettings, setDarkModeSettings] = useState({
//     // darkMode: colorScheme === "dark",
//     darkMode: currentTheme === "dark",
//     systemMode: isSystemTheme,
//   });

//   const setDarkMode = (value: boolean) => {
//     // setColorScheme(value ? "dark" : "light");
//     toggleTheme();

//     setDarkModeSettings({
//       darkMode: value,
//       systemMode: false,
//     });
//   };

//   const setSystemMode = (value: boolean) => {
//     if (value) {
//       setSystemTheme();
//     }
//     setDarkModeSettings({
//       darkMode: darkModeSettings.darkMode,
//       systemMode: true,
//     });
//   };

//   return (
//     <ThemedView className="flex-1 bg-light-background dark:bg-dark-background">
//       <ThemedCard className="mt-5">
//         <ThemedSwitch
//           text="Dark Mode"
//           // className="mb-5"
//           value={darkModeSettings.darkMode}
//           onValueChange={setDarkMode}
//         />
//         <ThemedSwitch
//           text="System Mode"
//           // className="mb-5"
//           value={darkModeSettings.systemMode}
//           onValueChange={setSystemMode}
//         />
//       </ThemedCard>
//     </ThemedView>
//   );
// }
