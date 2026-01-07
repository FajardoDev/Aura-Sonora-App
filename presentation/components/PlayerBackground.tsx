// PlayerBackground.tsx (TUS COLORES SE QUEDAN IGUAL)
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeChangerContext";

const DARK_GRADIENT_COLORS = ["#000000", "#023550", "#280236"];
const LIGHT_GRADIENT_COLORS = ["#FFFFFF", "#F0F4F8", "#E0F7FA"];

export const PlayerBackground = ({ children, style, className }: any) => {
  // const { colorScheme } = useColorScheme();
  // const isDarkMode = colorScheme === "dark";

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const currentColors = isDarkMode
    ? DARK_GRADIENT_COLORS
    : LIGHT_GRADIENT_COLORS;
  const startPoint = isDarkMode ? { x: 0, y: 0 } : { x: 0, y: 1 };
  const endPoint = isDarkMode ? { x: 1, y: 0 } : { x: 0, y: 0 };

  return (
    <LinearGradient
      colors={currentColors as any}
      start={startPoint}
      end={endPoint}
      style={style} // <--- ESTO ES VITAL para que no se rompa
      className={className}
    >
      {children}
    </LinearGradient>
  );
};
// import { LinearGradient } from "expo-linear-gradient";
// import { useColorScheme } from "nativewind";

// const DARK_GRADIENT_COLORS = ["#000000", "#023550", "#280236"];
// const LIGHT_GRADIENT_COLORS = ["#FFFFFF", "#F0F4F8", "#E0F7FA"];

// export const PlayerBackground = ({ children, style, className }: any) => {
//   const { colorScheme } = useColorScheme();
//   const isDarkMode = colorScheme === "dark";

//   const currentColors = isDarkMode
//     ? DARK_GRADIENT_COLORS
//     : LIGHT_GRADIENT_COLORS;
//   const startPoint = isDarkMode ? { x: 0, y: 0 } : { x: 0, y: 1 };
//   const endPoint = isDarkMode ? { x: 1, y: 0 } : { x: 0, y: 0 };

//   return (
//     <LinearGradient
//       colors={currentColors as any}
//       start={startPoint}
//       end={endPoint}
//       style={style} // <--- ESTO ES VITAL para que no se rompa
//       className={className}
//     >
//       {children}
//     </LinearGradient>
//   );
// };
