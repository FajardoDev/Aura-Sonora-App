/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/theme";
import { useTheme } from "@/presentation/context/ThemeChangerContext";
// import { useTheme } from "./ThemeContext"; // Ajusta la ruta

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light
) {
  const { resolvedTheme } = useTheme();

  if (props[resolvedTheme]) return props[resolvedTheme];
  return Colors[resolvedTheme][colorName];
}

// import { Colors } from "@/constants/theme";
// import { useColorScheme } from "nativewind";

// export function useThemeColor(
//   props: { light?: string; dark?: string },
//   colorName: keyof typeof Colors.light & keyof typeof Colors.dark
// ) {
//   const { colorScheme } = useColorScheme();
//   const theme = colorScheme === "dark" ? "dark" : "light";

//   return props[theme] ?? Colors[theme][colorName];
// }

// import { Colors } from "@/constants/theme";
// import { useColorScheme } from "react-native";
// // import { useColorScheme } from './use-color-scheme';

// export function useThemeColor(
//   props: { light?: string; dark?: string },
//   colorName: keyof typeof Colors.light & keyof typeof Colors.dark
// ) {
//   const theme = useColorScheme() ?? "light";
//   const colorFromProps = props[theme];

//   if (colorFromProps) {
//     return colorFromProps;
//   } else {
//     return Colors[theme][colorName];
//   }
// }
