import { useTheme } from "@/presentation/context/ThemeChangerContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

// Definimos los tipos de modo que aceptamos
type ThemeMode = "light" | "dark" | "system";

interface Props {
  mode: ThemeMode;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
}

export const ThemeOptionCard = ({ mode, iconName, label }: Props) => {
  // Usamos el hook para saber cuál es el tema activo actualmente
  const { theme: activeTheme, setTheme, resolvedTheme } = useTheme();

  const isSelected = activeTheme === mode;

  // Definimos colores dinámicos para el estado seleccionado vs no seleccionado
  // Usamos clases de NativeWind para manejar esto limpiamente.

  // Contenedor principal
  const containerClasses = `
    flex-1 items-center justify-center p-4 m-1 rounded-2xl border-2
    ${
      isSelected
        ? "border-primary bg-primary/10 dark:bg-primary/20" // Borde y fondo sutil si está seleccionado
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" // Borde y fondo normal
    }
  `;

  // Color del icono y texto
  const contentColorClasses = isSelected
    ? "text-primary" // Color primario si está seleccionado
    : "text-gray-500 dark:text-gray-400"; // Gris si no

  // Icono específico para modo sistema (opcional: mostrar qué es actualmente)
  const renderSystemIcon = () => {
    if (mode !== "system")
      return (
        <Ionicons name={iconName} size={32} className={contentColorClasses} />
      );

    // Si es sistema, mostramos un icono doble pequeño para indicar que es automático
    return (
      <View className="relative w-8 h-8 items-center justify-center">
        <Ionicons
          name={iconName}
          size={32}
          className={contentColorClasses}
          style={{ opacity: isSelected ? 1 : 0.5 }}
        />
        {/* Pequeño indicador de qué está usando el sistema realmente */}
        <View className="absolute bottom-0 right-0 bg-gray-200 dark:bg-gray-700 rounded-full p-[2px]">
          <Ionicons
            name={resolvedTheme === "light" ? "sunny" : "moon"}
            size={10}
            color={isSelected ? "#007AFF" : "gray"}
          />
        </View>
      </View>
    );
  };

  return (
    <Pressable
      onPress={() => setTheme(mode)}
      className={containerClasses}
      // Añadimos un pequeño efecto al presionar
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
    >
      <View className="mb-3">{renderSystemIcon()}</View>

      <Text className={`text-sm font-semibold ${contentColorClasses}`}>
        {label}
      </Text>

      {/* Checkmark opcional si está seleccionado (estilo iOS moderno) */}
      {isSelected && (
        <View className="absolute top-2 right-2">
          <Ionicons
            name="checkmark-circle"
            size={18}
            className="text-primary"
            color="#007AFF"
          />
        </View>
      )}
    </Pressable>
  );
};
