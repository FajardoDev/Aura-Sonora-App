import { Colors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useColorScheme as useNWColorScheme } from "nativewind";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextProps {
  theme: ThemeMode; // 'light' | 'dark' | 'system'
  resolvedTheme: "light" | "dark"; // El color real que se ve
  setTheme: (mode: ThemeMode) => void;
  bgColor: string;
}

const ThemeContext = createContext({} as ThemeContextProps);

export const ThemeProviderCustom = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { colorScheme, setColorScheme } = useNWColorScheme();
  const [theme, _setTheme] = useState<ThemeMode>("system");

  // Al cargar la app, recuperamos la preferencia
  useEffect(() => {
    AsyncStorage.getItem("user-theme").then((saved) => {
      if (saved) {
        const mode = saved as ThemeMode;
        _setTheme(mode);
        setColorScheme(mode);
      }
    });
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    _setTheme(mode);
    setColorScheme(mode); // NativeWind se encarga de 'system' automáticamente
    await AsyncStorage.setItem("user-theme", mode);
  };

  // El "resolvedTheme" es lo que realmente ve el usuario (importante para lógica JS)
  const resolvedTheme = colorScheme ?? "light";

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      bgColor:
        resolvedTheme === "dark"
          ? Colors.dark.background
          : Colors.light.background,
    }),
    [theme, colorScheme]
  );

  return (
    <ThemeProvider value={resolvedTheme === "dark" ? DarkTheme : DefaultTheme}>
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    </ThemeProvider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// npx expo install @react-native-async-storage/async-storage
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
// import {
//   createContext,
//   PropsWithChildren,
//   useContext,
//   useEffect,
//   useState,
// } from "react";

// import { Colors } from "@/constants/theme";
// import { useColorScheme } from "nativewind";

// interface ThemeChangerContextType {
//   currentTheme: "light" | "dark";
//   isSystemTheme: boolean;

//   bgColor: string;

//   toggleTheme: () => void;
//   setSystemTheme: () => void;
// }

// const ThemeChangerContext = createContext({} as ThemeChangerContextType);

// // Custom Hook para acceder al ThemeChangerContext
// export const useThemeChangerContext = () => {
//   const themeChanger = useContext(ThemeChangerContext);

//   return themeChanger;
// };

// // Provider Para envolver toda la app
// export const ThemeChangerProvider = ({ children }: PropsWithChildren) => {
//   const { colorScheme, setColorScheme } = useColorScheme();

//   const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");
//   const [isSystemThemeEnabled, setIsSystemThemeEnabled] = useState(true);

//   const currentTheme = isSystemThemeEnabled
//     ? colorScheme
//     : isDarkMode
//       ? "dark"
//       : "light";

//   // saber el bg actual
//   // const backgroundColor = isDarkMode
//   //   ? Colors.dark.background
//   //   : Colors.light.background;

//   const backgroundColor =
//     currentTheme === "dark" ? Colors.dark.background : Colors.light.background;

//   useEffect(() => {
//     AsyncStorage.getItem("selected-theme").then((theme) => {
//       if (!theme) return;

//       setIsDarkMode(theme === "dark");
//       setIsSystemThemeEnabled(theme === "system");
//       setColorScheme(theme as "light" | "dark" | "system");
//     });
//   }, [setColorScheme]);

//   return (
//     <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//       <ThemeChangerContext.Provider
//         value={{
//           currentTheme: currentTheme ?? "light",
//           isSystemTheme: isSystemThemeEnabled,
//           bgColor: backgroundColor,

//           toggleTheme: async () => {
//             setIsDarkMode(!isDarkMode);
//             setColorScheme(isDarkMode ? "light" : "dark");
//             setIsSystemThemeEnabled(false);

//             // TODO Saved in storage
//             await AsyncStorage.setItem(
//               "selected-theme",
//               isDarkMode ? "light" : "dark"
//             );
//           },
//           setSystemTheme: async () => {
//             setIsSystemThemeEnabled(true);
//             setColorScheme("system");
//             await AsyncStorage.setItem("selected-theme", "system");
//           },
//         }}
//       >
//         {children}
//       </ThemeChangerContext.Provider>
//     </ThemeProvider>
//   );
// };
